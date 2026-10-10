import { NextRequest, NextResponse } from "next/server"
import { createDonationOrder } from "@/lib/cms/donations"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, currency, donor_name, donor_email, donor_phone, pan_number, purpose, message, is_anonymous } = body

    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json({ success: false, error: "A valid donation amount is required" }, { status: 400 })
    }

    if (!donor_name || typeof donor_name !== "string" || !donor_name.trim()) {
      return NextResponse.json({ success: false, error: "Donor name is required" }, { status: 400 })
    }

    const phoneDigits = donor_phone ? String(donor_phone).replace(/\D/g, "") : ""
    if (phoneDigits.length < 10) {
      return NextResponse.json({ success: false, error: "A valid 10-digit phone number is required" }, { status: 400 })
    }

    let cleanEmail = ""
    if (donor_email && String(donor_email).trim()) {
      if (!String(donor_email).includes("@")) {
        return NextResponse.json({ success: false, error: "Please enter a valid email address or leave it blank" }, { status: 400 })
      }
      cleanEmail = String(donor_email).trim()
    }

    const result = await createDonationOrder({
      amount: Number(amount),
      currency: currency || "INR",
      donor_name: donor_name.trim(),
      donor_email: cleanEmail,
      donor_phone: String(donor_phone).trim(),
      pan_number: pan_number ? String(pan_number).trim() : undefined,
      purpose: purpose ? String(purpose).trim() : "General Athlete Support",
      message: message ? String(message).trim() : undefined,
      is_anonymous: Boolean(is_anonymous),
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      keyId: result.keyId,
      donationId: result.donationId,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to initiate payment"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
