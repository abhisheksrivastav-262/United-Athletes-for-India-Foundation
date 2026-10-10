import crypto from "crypto"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { RazorpaySettings, DonationRecord } from "./types"

const DEFAULT_SETTINGS: RazorpaySettings = {
  key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
  is_enabled: true,
  mode: "test",
  currency: "INR",
  min_amount: 1,
  suggested_amounts: [500, 1000, 2500, 5000, 10000],
  tax_benefit_info: "Donations to UnitedAthletes for India Foundation may be eligible for tax exemption under Section 80G.",
  organization_name: "UnitedAthletes for India Foundation",
}

/**
 * Fetch full Razorpay settings (server-only; includes key_secret).
 */
export async function getRazorpaySettings(): Promise<RazorpaySettings> {
  try {
    const supabase = await createServerClient()
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "razorpay")
      .maybeSingle()

    if (data?.value && typeof data.value === "object") {
      const val = data.value as Partial<RazorpaySettings>
      const key_id = val.key_id || process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""
      const key_secret = val.key_secret || process.env.RAZORPAY_KEY_SECRET || ""
      return {
        key_id,
        key_secret,
        is_enabled: val.is_enabled ?? true,
        mode: val.mode || (key_id.startsWith("rzp_live") ? "live" : "test"),
        currency: val.currency || "INR",
        min_amount: Number(val.min_amount) || 1,
        suggested_amounts: Array.isArray(val.suggested_amounts) && val.suggested_amounts.length > 0
          ? val.suggested_amounts
          : [500, 1000, 2500, 5000, 10000],
        tax_benefit_info: val.tax_benefit_info || DEFAULT_SETTINGS.tax_benefit_info,
        organization_name: val.organization_name || DEFAULT_SETTINGS.organization_name,
        notes: val.notes || "",
      }
    }
  } catch (err) {
    console.error("[donations] getRazorpaySettings error:", err)
  }

  return DEFAULT_SETTINGS
}

/**
 * Fetch public Razorpay config safe for client-side consumption (NO key_secret).
 */
export async function getPublicRazorpayConfig(): Promise<Omit<RazorpaySettings, "key_secret">> {
  const full = await getRazorpaySettings()
  const { key_secret, ...pub } = full
  return pub
}

/**
 * Update Razorpay settings in the database.
 */
export async function updateRazorpaySettings(
  input: Partial<RazorpaySettings>
): Promise<{ success: boolean; data?: RazorpaySettings; error?: string }> {
  try {
    const current = await getRazorpaySettings()
    const updated: RazorpaySettings = {
      ...current,
      ...input,
      key_id: input.key_id !== undefined ? input.key_id.trim() : current.key_id,
      key_secret: input.key_secret !== undefined && input.key_secret.trim() !== ""
        ? input.key_secret.trim()
        : current.key_secret,
      mode: input.key_id
        ? (input.key_id.startsWith("rzp_live") ? "live" : "test")
        : (input.mode || current.mode),
      min_amount: Number(input.min_amount) || 1,
      suggested_amounts: Array.isArray(input.suggested_amounts) && input.suggested_amounts.length > 0
        ? input.suggested_amounts.map(Number).filter((n) => !isNaN(n) && n > 0)
        : current.suggested_amounts,
    }

    const supabase = await createServerClient()
    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", "razorpay")
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from("site_settings")
        .update({
          value: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("key", "razorpay")

      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await supabase
        .from("site_settings")
        .insert({
          key: "razorpay",
          value: updated,
        })

      if (error) return { success: false, error: error.message }
    }

    return { success: true, data: updated }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update Razorpay settings"
    return { success: false, error: message }
  }
}

/**
 * Validate credentials directly against the Razorpay REST API.
 */
export async function verifyRazorpayCredentials(
  key_id: string,
  key_secret: string
): Promise<{ valid: boolean; error?: string }> {
  if (!key_id || !key_secret) {
    return { valid: false, error: "Both Key ID and Key Secret are required" }
  }

  try {
    const authHeader = "Basic " + Buffer.from(`${key_id}:${key_secret}`).toString("base64")
    // Fetch 1 order from Razorpay to verify authentication
    const res = await fetch("https://api.razorpay.com/v1/orders?count=1", {
      headers: {
        Authorization: authHeader,
      },
    })

    if (res.ok) {
      return { valid: true }
    }

    const data = await res.json().catch(() => ({}))
    const msg = data.error?.description || `Authentication failed (status ${res.status})`
    return { valid: false, error: msg }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error contacting Razorpay"
    return { valid: false, error: msg }
  }
}

/**
 * Create a Razorpay Order and record initial donation.
 */
export async function createDonationOrder(input: {
  amount: number
  currency?: string
  donor_name: string
  donor_email?: string
  donor_phone: string
  pan_number?: string
  purpose?: string
  message?: string
  is_anonymous?: boolean
}): Promise<{
  success: boolean
  orderId?: string
  amount?: number
  currency?: string
  keyId?: string
  donationId?: string
  error?: string
}> {
  try {
    const settings = await getRazorpaySettings()

    if (!settings.is_enabled) {
      return { success: false, error: "Online donations are currently disabled. Please contact us directly." }
    }

    const minAmount = settings.min_amount || 1
    if (!input.amount || input.amount < minAmount) {
      return { success: false, error: `Minimum donation amount is ₹${minAmount}` }
    }

    if (!input.donor_name || !input.donor_name.trim()) {
      return { success: false, error: "Donor name is required" }
    }

    const phoneDigits = (input.donor_phone || "").replace(/\D/g, "")
    if (phoneDigits.length < 10) {
      return { success: false, error: "A valid 10-digit phone number is required" }
    }

    if (input.donor_email && input.donor_email.trim() && !input.donor_email.includes("@")) {
      return { success: false, error: "Please enter a valid email address or leave it blank" }
    }

    const currency = input.currency || settings.currency || "INR"
    const amountInPaise = Math.round(input.amount * 100)
    const donationId = crypto.randomUUID()
    const receipt = `rcpt_${donationId.slice(0, 12)}`
    const cleanEmail = input.donor_email?.trim().toLowerCase() || ""
    const cleanPhone = input.donor_phone.trim()

    let razorpayOrderId: string | null = null

    // If real keys are configured, create order via Razorpay API
    if (settings.key_id && settings.key_secret) {
      const authHeader = "Basic " + Buffer.from(`${settings.key_id}:${settings.key_secret}`).toString("base64")
      const orderPayload = {
        amount: amountInPaise,
        currency,
        receipt,
        notes: {
          donation_id: donationId,
          donor_name: input.donor_name,
          donor_email: cleanEmail || "Not provided",
          donor_phone: cleanPhone,
          purpose: input.purpose || "General Athlete Support",
        },
      }

      const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok) {
        console.error("[donations] Razorpay order creation failed:", orderData)
        return {
          success: false,
          error: orderData.error?.description || "Failed to create payment order with Razorpay",
        }
      }

      razorpayOrderId = orderData.id
    } else {
      // In development / demo when no keys configured yet
      razorpayOrderId = `order_sim_${donationId.slice(0, 14)}`
    }

    // Save pending donation record
    const donationRecord: DonationRecord = {
      id: donationId,
      donor_name: input.donor_name.trim(),
      donor_email: cleanEmail,
      donor_phone: cleanPhone || null,
      pan_number: input.pan_number?.trim().toUpperCase() || null,
      amount: input.amount,
      currency,
      purpose: input.purpose || "General Athlete Support",
      message: input.message?.trim() || null,
      is_anonymous: Boolean(input.is_anonymous),
      status: "pending",
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: null,
      razorpay_signature: null,
      payment_method: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await saveDonationRecord(donationRecord)

    return {
      success: true,
      orderId: razorpayOrderId || undefined,
      amount: input.amount,
      currency,
      keyId: settings.key_id,
      donationId,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating donation order"
    console.error("[donations] createDonationOrder error:", err)
    return { success: false, error: message }
  }
}

/**
 * Verify Razorpay payment signature and mark donation as paid.
 */
export async function verifyDonationPayment(input: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  donation_id?: string
}): Promise<{
  success: boolean
  donation?: DonationRecord
  error?: string
}> {
  try {
    const settings = await getRazorpaySettings()

    // Verify HMAC-SHA256 signature if key_secret is present
    if (settings.key_secret) {
      const generatedSignature = crypto
        .createHmac("sha256", settings.key_secret)
        .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
        .digest("hex")

      if (generatedSignature !== input.razorpay_signature) {
        console.error("[donations] Invalid Razorpay signature", {
          expected: generatedSignature,
          received: input.razorpay_signature,
        })
        return { success: false, error: "Payment verification failed. Invalid transaction signature." }
      }
    }

    // Find and update the donation record
    const existing = await findDonationRecord(input.razorpay_order_id, input.donation_id)
    if (!existing) {
      return { success: false, error: "Donation record not found for this order" }
    }

    const updated: DonationRecord = {
      ...existing,
      status: "paid",
      razorpay_payment_id: input.razorpay_payment_id,
      razorpay_signature: input.razorpay_signature,
      payment_method: "Razorpay",
      updated_at: new Date().toISOString(),
    }

    await updateDonationRecord(updated)

    return {
      success: true,
      donation: updated,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment verification error"
    console.error("[donations] verifyDonationPayment error:", err)
    return { success: false, error: message }
  }
}

/**
 * Database storage helper: handles both `donations` table and `site_settings` fallback.
 */
async function saveDonationRecord(record: DonationRecord): Promise<void> {
  const supabase = await createServerClient()
  try {
    // Try primary table `donations`
    const { error } = await supabase.from("donations").insert(record)
    if (!error) return
  } catch {
    // Fall through to fallback
  }

  // Fallback: store in site_settings with key prefix
  try {
    await supabase.from("site_settings").insert({
      key: `donation_${record.id}`,
      value: record,
    })
  } catch (err) {
    console.error("[donations] Fallback save failed:", err)
  }
}

/**
 * Database update helper: handles both `donations` table and `site_settings` fallback.
 */
async function updateDonationRecord(record: DonationRecord): Promise<void> {
  const supabase = await createServerClient()
  try {
    const { error } = await supabase
      .from("donations")
      .update(record)
      .eq("id", record.id)
    if (!error) return
  } catch {
    // Fall through to fallback
  }

  // Fallback in site_settings
  try {
    await supabase
      .from("site_settings")
      .update({
        value: record,
        updated_at: new Date().toISOString(),
      })
      .eq("key", `donation_${record.id}`)
  } catch (err) {
    console.error("[donations] Fallback update failed:", err)
  }
}

/**
 * Database find helper by order ID or donation ID.
 */
async function findDonationRecord(orderId: string, donationId?: string): Promise<DonationRecord | null> {
  const supabase = await createServerClient()

  // 1. Try donations table
  try {
    let query = supabase.from("donations").select("*")
    if (donationId) {
      query = query.eq("id", donationId)
    } else {
      query = query.eq("razorpay_order_id", orderId)
    }
    const { data } = await query.maybeSingle()
    if (data) return data as DonationRecord
  } catch {
    // Check fallback
  }

  // 2. Try site_settings fallback
  try {
    if (donationId) {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", `donation_${donationId}`)
        .maybeSingle()
      if (data?.value) return data.value as DonationRecord
    }

    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .like("key", "donation_%")

    if (data) {
      for (const row of data) {
        const val = row.value as DonationRecord
        if (val?.razorpay_order_id === orderId) {
          return val
        }
      }
    }
  } catch (err) {
    console.error("[donations] findDonationRecord error:", err)
  }

  return null
}

/**
 * Retrieve list of donations with search, filtering, and summary statistics.
 */
export async function getDonationsList(options?: {
  status?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<{
  donations: DonationRecord[]
  stats: {
    totalRaised: number
    totalDonations: number
    paidCount: number
    pendingCount: number
    failedCount: number
    averageDonation: number
  }
}> {
  const supabase = await createServerClient()
  let list: DonationRecord[] = []

  // 1. Try donations table
  try {
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && Array.isArray(data)) {
      list = data as DonationRecord[]
    }
  } catch {
    // Fall back to site_settings
  }

  // 2. If primary table returned nothing or errored, check site_settings fallback
  if (list.length === 0) {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .like("key", "donation_%")
        .order("created_at", { ascending: false })

      if (data && Array.isArray(data)) {
        list = data
          .map((r) => r.value as DonationRecord)
          .filter(Boolean)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }
    } catch {
      // Return empty
    }
  }

  // Calculate full stats before filtering
  const paid = list.filter((d) => d.status === "paid")
  const totalRaised = paid.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
  const paidCount = paid.length
  const pendingCount = list.filter((d) => d.status === "pending").length
  const failedCount = list.filter((d) => d.status === "failed").length
  const averageDonation = paidCount > 0 ? Math.round(totalRaised / paidCount) : 0

  // Apply filters
  let filtered = [...list]

  if (options?.status && options.status !== "all") {
    filtered = filtered.filter((d) => d.status === options.status)
  }

  if (options?.search) {
    const q = options.search.toLowerCase()
    filtered = filtered.filter((d) =>
      d.donor_name.toLowerCase().includes(q) ||
      d.donor_email.toLowerCase().includes(q) ||
      (d.donor_phone && d.donor_phone.toLowerCase().includes(q)) ||
      (d.razorpay_payment_id && d.razorpay_payment_id.toLowerCase().includes(q)) ||
      (d.razorpay_order_id && d.razorpay_order_id.toLowerCase().includes(q)) ||
      (d.pan_number && d.pan_number.toLowerCase().includes(q))
    )
  }

  if (options?.limit) {
    const offset = options.offset || 0
    filtered = filtered.slice(offset, offset + options.limit)
  }

  return {
    donations: filtered,
    stats: {
      totalRaised,
      totalDonations: list.length,
      paidCount,
      pendingCount,
      failedCount,
      averageDonation,
    },
  }
}
