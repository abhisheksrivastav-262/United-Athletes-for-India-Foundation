// ============================================================================
// Admin CRUD data layer.
//
// CONTRACT: every mutating/listing function returns `{ data, error }` where
// `error` is a human-readable string or null. Functions never throw — the
// admin UI checks `error` and shows a toast. All queries run under the
// signed-in admin's cookie session, so RLS enforces permissions server-side.
// ============================================================================

import { createClient } from "@/lib/supabase/server"

export type Result<T = Record<string, unknown>> = { data: (T & { id: string }) | null; error: string | null }

function errMessage(e: { message?: string } | null): string {
  return e?.message || "Something went wrong. Please try again."
}

export function normalizeAthleteStatus(status?: unknown): string {
  if (status === "published" || status === "active" || !status) return "active"
  if (status === "draft" || status === "inactive") return "inactive"
  if (status === "archived" || status === "retired") return "retired"
  return String(status)
}

export function normalizeEventStatus(status?: unknown): string {
  if (status === "published" || status === "upcoming" || !status) return "upcoming"
  if (status === "live") return "live"
  if (status === "draft" || status === "cancelled") return "cancelled"
  if (status === "archived" || status === "completed") return "completed"
  return String(status)
}

export function normalizeTeamStatus(status?: unknown): string {
  if (status === "published" || status === "active" || !status) return "active"
  if (status === "draft" || status === "inactive") return "inactive"
  return String(status)
}

export function normalizeTestimonialStatus(status?: unknown): string {
  if (status === "published" || status === "active" || !status) return "active"
  if (status === "draft" || status === "inactive") return "inactive"
  if (status === "archived") return "archived"
  return String(status)
}

export function normalizeGalleryStatus(status?: unknown): string {
  if (status === "published" || status === "active" || !status) return "active"
  if (status === "draft" || status === "inactive") return "inactive"
  if (status === "archived") return "archived"
  return String(status)
}

// ── Who am I (used by activity logging + forms) ─────────────────────────────

export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      return {
        id: user.id,
        email: user.email || null,
        profile: profile as { full_name?: string; role?: string; is_active?: boolean } | null,
      }
    }
  } catch {
    // Continue to check admin session cookie
  }

  try {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const adminCookie = cookieStore.get("ua_admin_session")?.value
    if (adminCookie) {
      const parsed = JSON.parse(adminCookie)
      return {
        id: "master-admin",
        email: parsed.email || "admin@unitedsports.org",
        profile: {
          full_name: "Super Admin",
          role: "super_admin",
          is_active: true,
        },
      }
    }
  } catch {
    // Ignore
  }

  return null
}

export async function createActivityLog(input: {
  admin_user_id: string | null
  admin_email: string | null
  action: string
  entity_type: string
  entity_id: string | null
  description?: string | null
}) {
  try {
    const supabase = await createClient()
    await supabase.from("activity_logs").insert({
      admin_user_id: input.admin_user_id,
      admin_email: input.admin_email,
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      description: input.description || null,
    })
  } catch {
    // Activity logging is best-effort; never block the user action.
  }
}

// ── Site settings ────────────────────────────────────────────────────────────

export async function getSiteSettings() {
  const supabase = await createClient()
  const { data: rows, error } = await supabase.from("site_settings").select("*")
  if (error || !rows || rows.length === 0) {
    return {
      id: "site_settings_unified",
      site_name: "UnitedAthletes",
      description: "UnitedAthletes for India Foundation — an athlete-focused organisation building a stronger sporting ecosystem across India.",
      logo_url: "/assets/logo-circle.png",
      favicon_url: null,
      email: "info@unitedathletes.in",
      phone: "+91 85278 77688",
      address: "384A, Nyay Khand 3, Indirapuram, Ghaziabad, Uttar Pradesh – 201014",
      whatsapp: "918527877688",
      facebook_url: "",
      instagram_url: "",
      youtube_url: "",
      twitter_url: "",
      linkedin_url: "",
      primary_color: null,
      secondary_color: null,
      footer_text: "UnitedAthletes for India Foundation",
      created_at: "",
      updated_at: new Date().toISOString(),
    }
  }

  const map: Record<string, any> = {}
  for (const r of rows) {
    if (r.key && r.value) map[r.key] = r.value
  }

  const general = map["general"] || {}
  const contact = map["contact"] || {}
  const social = map["social"] || {}
  const whatsapp = map["whatsapp"] || {}
  const seo = map["seo"] || {}

  return {
    id: "site_settings_unified",
    site_name: general.site_name || "UnitedAthletes",
    description: general.footer_blurb || seo.default_description || "",
    logo_url: general.logo_url || null,
    favicon_url: general.favicon_url || null,
    email: contact.email || "",
    phone: contact.phone || "",
    address: contact.address || "",
    whatsapp: whatsapp.phone_number || "",
    facebook_url: social.facebook || "",
    instagram_url: social.instagram || "",
    youtube_url: social.youtube || "",
    twitter_url: social.twitter || "",
    linkedin_url: social.linkedin || "",
    primary_color: general.primary_color || null,
    secondary_color: general.secondary_color || null,
    footer_text: general.footer_blurb || null,
    created_at: "",
    updated_at: new Date().toISOString(),
  }
}

export async function updateSiteSettings(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  try {
    const { data: rows } = await supabase.from("site_settings").select("*")
    const map: Record<string, any> = {}
    for (const r of rows || []) {
      if (r.key && r.value) map[r.key] = r.value
    }

    const general = {
      ...(map["general"] || {}),
      site_name: input.site_name || map["general"]?.site_name || "UnitedAthletes",
      footer_blurb: input.description !== undefined ? input.description : map["general"]?.footer_blurb,
      logo_url: input.logo_url !== undefined ? input.logo_url : map["general"]?.logo_url,
      favicon_url: input.favicon_url !== undefined ? input.favicon_url : map["general"]?.favicon_url,
      primary_color: input.primary_color !== undefined ? input.primary_color : map["general"]?.primary_color,
      secondary_color: input.secondary_color !== undefined ? input.secondary_color : map["general"]?.secondary_color,
    }

    const contact = {
      ...(map["contact"] || {}),
      email: input.email !== undefined ? input.email : map["contact"]?.email,
      phone: input.phone !== undefined ? input.phone : map["contact"]?.phone,
      phone_tel: input.phone !== undefined ? input.phone : map["contact"]?.phone_tel,
      address: input.address !== undefined ? input.address : map["contact"]?.address,
    }

    const social = {
      ...(map["social"] || {}),
      facebook: input.facebook_url !== undefined ? input.facebook_url : map["social"]?.facebook,
      instagram: input.instagram_url !== undefined ? input.instagram_url : map["social"]?.instagram,
      youtube: input.youtube_url !== undefined ? input.youtube_url : map["social"]?.youtube,
      twitter: input.twitter_url !== undefined ? input.twitter_url : map["social"]?.twitter,
      linkedin: input.linkedin_url !== undefined ? input.linkedin_url : map["social"]?.linkedin,
    }

    const whatsapp = {
      ...(map["whatsapp"] || {}),
      enabled: Boolean(input.whatsapp),
      phone_number: input.whatsapp !== undefined ? input.whatsapp : map["whatsapp"]?.phone_number,
    }

    const seo = {
      ...(map["seo"] || {}),
      site_name: input.site_name || map["seo"]?.site_name || "UnitedAthletes",
      default_description: input.description !== undefined ? input.description : map["seo"]?.default_description,
      og_image_url: input.logo_url || "/assets/facility.jpg",
    }

    const now = new Date().toISOString()
    await Promise.all([
      supabase.from("site_settings").upsert({ key: "general", value: general, updated_at: now }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "contact", value: contact, updated_at: now }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "social", value: social, updated_at: now }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "whatsapp", value: whatsapp, updated_at: now }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "seo", value: seo, updated_at: now }, { onConflict: "key" }),
    ])

    return { data: { id: "site_settings_unified", ...input }, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Failed to update site settings" }
  }
}

// ── Articles ─────────────────────────────────────────────────────────────────

export async function createArticle(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("articles").insert(input).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateArticle(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("articles").update(input).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteArticle(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("articles").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getArticleById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).maybeSingle()
  if (error) { console.error("[cms] getArticleById:", error.message); return null }
  return data
}

export async function getArticles(opts?: { limit?: number; status?: string; search?: string }) {
  const supabase = await createClient()
  let q = supabase
    .from("articles")
    .select("*, category:categories(name, slug)")
    .order("created_at", { ascending: false })
  if (opts?.status && opts.status !== "all") q = q.eq("status", opts.status)
  if (opts?.search) q = q.ilike("title", `%${opts.search}%`)
  if (opts?.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) { console.error("[cms] getArticles:", error.message); return [] }
  return data || []
}

export async function getAllArticles() {
  return getArticles()
}

export async function publishArticle(id: string) {
  return updateArticle(id, { status: "published", published_at: new Date().toISOString() })
}

export async function unpublishArticle(id: string) {
  return updateArticle(id, { status: "draft" })
}

export async function archiveArticle(id: string) {
  return updateArticle(id, { status: "archived" })
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function createCategory(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("categories").insert(input).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateCategory(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("categories").update(input).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteCategory(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("categories").select("*").order("name")
  if (error) { console.error("[cms] getCategories:", error.message); return [] }
  return data || []
}

export async function getArticleCategories() {
  return getCategories()
}

export async function createArticleCategory(input: Record<string, unknown>) {
  return createCategory(input)
}

export async function updateArticleCategory(id: string, input: Record<string, unknown>) {
  return updateCategory(id, input)
}

export async function deleteArticleCategory(id: string) {
  return deleteCategory(id)
}

// ── Events ───────────────────────────────────────────────────────────────────

export async function createEvent(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = {
    ...input,
    status: normalizeEventStatus(input.status),
  }
  const { data, error } = await supabase.from("events").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateEvent(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = {
    ...input,
    ...(input.status !== undefined ? { status: normalizeEventStatus(input.status) } : {}),
  }
  const { data, error } = await supabase.from("events").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteEvent(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("events").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getEventById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle()
  if (error) { console.error("[cms] getEventById:", error.message); return null }
  return data
}

export async function getEvents(opts?: { limit?: number; status?: string; search?: string }) {
  const supabase = await createClient()
  let q = supabase.from("events").select("*").order("event_date", { ascending: true })
  if (opts?.status && opts.status !== "all") q = q.eq("status", normalizeEventStatus(opts.status))
  if (opts?.search) q = q.ilike("title", `%${opts.search}%`)
  if (opts?.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) { console.error("[cms] getEvents:", error.message); return [] }
  return data || []
}

export async function getAllEvents() {
  return getEvents()
}

export async function publishEvent(id: string) {
  return updateEvent(id, { status: "upcoming" })
}

export async function unpublishEvent(id: string) {
  return updateEvent(id, { status: "cancelled" })
}

// ── Programmes ───────────────────────────────────────────────────────────────

export async function createProgramme(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("programmes").insert(input).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateProgramme(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("programmes").update(input).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteProgramme(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("programmes").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getProgrammeById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("programmes").select("*").eq("id", id).maybeSingle()
  if (error) { console.error("[cms] getProgrammeById:", error.message); return null }
  return data
}

export async function getProgrammes(opts?: { status?: string; search?: string }) {
  const supabase = await createClient()
  let q = supabase
    .from("programmes")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
  if (opts?.status && opts.status !== "all") q = q.eq("status", opts.status)
  if (opts?.search) q = q.ilike("title", `%${opts.search}%`)
  const { data, error } = await q
  if (error) { console.error("[cms] getProgrammes:", error.message); return [] }
  return data || []
}

export async function getAllProgrammes() {
  return getProgrammes()
}

export async function publishProgramme(id: string) {
  return updateProgramme(id, { status: "published" })
}

export async function unpublishProgramme(id: string) {
  return updateProgramme(id, { status: "draft" })
}

// ── Athletes ─────────────────────────────────────────────────────────────────

export async function createAthlete(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = {
    ...input,
    status: normalizeAthleteStatus(input.status),
  }
  const { data, error } = await supabase.from("athletes").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateAthlete(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = {
    ...input,
    ...(input.status !== undefined ? { status: normalizeAthleteStatus(input.status) } : {}),
  }
  const { data, error } = await supabase.from("athletes").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteAthlete(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("athletes").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getAthleteById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("athletes").select("*").eq("id", id).maybeSingle()
  if (error) { console.error("[cms] getAthleteById:", error.message); return null }
  return data
}

export async function getAthletes(opts?: { status?: string; sport?: string; search?: string }) {
  const supabase = await createClient()
  let q = supabase
    .from("athletes")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
  if (opts?.status && opts.status !== "all") q = q.eq("status", normalizeAthleteStatus(opts.status))
  if (opts?.sport && opts.sport !== "all") q = q.eq("sport", opts.sport)
  if (opts?.search) q = q.ilike("name", `%${opts.search}%`)
  const { data, error } = await q
  if (error) { console.error("[cms] getAthletes:", error.message); return [] }
  return data || []
}

export async function getAllAthletes() {
  return getAthletes()
}

export async function publishAthlete(id: string) {
  return updateAthlete(id, { status: "active" })
}

export async function unpublishAthlete(id: string) {
  return updateAthlete(id, { status: "inactive" })
}

// ── Teams ────────────────────────────────────────────────────────────────────

export async function createTeam(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = {
    ...input,
    status: normalizeTeamStatus(input.status),
  }
  const { data, error } = await supabase.from("teams").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateTeam(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = {
    ...input,
    ...(input.status !== undefined ? { status: normalizeTeamStatus(input.status) } : {}),
  }
  const { data, error } = await supabase.from("teams").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteTeam(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("teams").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getTeamById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("teams").select("*").eq("id", id).maybeSingle()
  if (error) { console.error("[cms] getTeamById:", error.message); return null }
  return data
}

export async function getTeams(opts?: { status?: string; sport?: string; search?: string }) {
  const supabase = await createClient()
  let q = supabase
    .from("teams")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
  if (opts?.status && opts.status !== "all") q = q.eq("status", normalizeTeamStatus(opts.status))
  if (opts?.sport && opts.sport !== "all") q = q.eq("sport", opts.sport)
  if (opts?.search) q = q.ilike("name", `%${opts.search}%`)
  const { data, error } = await q
  if (error) { console.error("[cms] getTeams:", error.message); return [] }
  return data || []
}

export async function getAllTeams() {
  return getTeams()
}

export async function publishTeam(id: string) {
  return updateTeam(id, { status: "active" })
}

export async function unpublishTeam(id: string) {
  return updateTeam(id, { status: "inactive" })
}

// ── Team roster ──────────────────────────────────────────────────────────────

export async function getTeamAthletes(teamId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("team_athletes")
    .select("*, athlete:athletes(*)")
    .eq("team_id", teamId)
    .order("display_order", { ascending: true })
  if (error) { console.error("[cms] getTeamAthletes:", error.message); return [] }
  return data || []
}

export async function addTeamAthlete(teamId: string, athleteId: string, displayOrder = 0): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("team_athletes")
    .insert({ team_id: teamId, athlete_id: athleteId, display_order: displayOrder })
    .select()
    .single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function removeTeamAthlete(teamId: string, athleteId: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("team_athletes")
    .delete()
    .eq("team_id", teamId)
    .eq("athlete_id", athleteId)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

// ── Testimonials ─────────────────────────────────────────────────────────────

export async function createTestimonial(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = {
    ...input,
    status: normalizeTestimonialStatus(input.status),
  }
  const { data, error } = await supabase.from("testimonials").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateTestimonial(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = {
    ...input,
    ...(input.status !== undefined ? { status: normalizeTestimonialStatus(input.status) } : {}),
  }
  const { data, error } = await supabase.from("testimonials").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteTestimonial(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("testimonials").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getTestimonialById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("testimonials").select("*").eq("id", id).maybeSingle()
  if (error) { console.error("[cms] getTestimonialById:", error.message); return null }
  return data
}

export async function getTestimonials(opts?: { status?: string; limit?: number; search?: string }) {
  const supabase = await createClient()
  let q = supabase
    .from("testimonials")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
  if (opts?.status && opts.status !== "all") q = q.eq("status", normalizeTestimonialStatus(opts.status))
  if (opts?.search) q = q.ilike("name", `%${opts.search}%`)
  if (opts?.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) { console.error("[cms] getTestimonials:", error.message); return [] }
  return data || []
}

export async function getAllTestimonials() {
  return getTestimonials()
}

export async function publishTestimonial(id: string) {
  return updateTestimonial(id, { status: "active" })
}

export async function unpublishTestimonial(id: string) {
  return updateTestimonial(id, { status: "inactive" })
}

// ── Gallery ──────────────────────────────────────────────────────────────────

export async function createGalleryItem(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = {
    ...input,
    status: normalizeGalleryStatus(input.status),
  }
  const { data, error } = await supabase.from("gallery").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateGalleryItem(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = {
    ...input,
    ...(input.status !== undefined ? { status: normalizeGalleryStatus(input.status) } : {}),
  }
  const { data, error } = await supabase.from("gallery").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteGalleryItem(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { data } = await supabase.from("gallery").select("image_url").eq("id", id).maybeSingle()
  // Best effort: also delete the underlying storage object when it lives in our bucket
  if (data?.image_url) {
    const marker = "/storage/v1/object/public/media/"
    const idx = data.image_url.indexOf(marker)
    if (idx !== -1) {
      const path = data.image_url.substring(idx + marker.length)
      await supabase.storage.from("media").remove([path])
    }
  }
  const { error } = await supabase.from("gallery").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getGalleryItemById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("gallery").select("*").eq("id", id).maybeSingle()
  if (error) { console.error("[cms] getGalleryItemById:", error.message); return null }
  return data
}

export async function getGalleryItems(opts?: { status?: string; category?: string; limit?: number; search?: string }) {
  const supabase = await createClient()
  let q = supabase
    .from("gallery")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
  if (opts?.status && opts.status !== "all") q = q.eq("status", normalizeGalleryStatus(opts.status))
  if (opts?.category && opts.category !== "all") q = q.eq("category", opts.category)
  if (opts?.search) q = q.ilike("title", `%${opts.search}%`)
  if (opts?.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) { console.error("[cms] getGalleryItems:", error.message); return [] }
  return data || []
}

export async function getAllGalleryItems() {
  return getGalleryItems()
}

export async function publishGalleryItem(id: string) {
  return updateGalleryItem(id, { status: "active" })
}

export async function unpublishGalleryItem(id: string) {
  return updateGalleryItem(id, { status: "inactive" })
}

// ── CMS Pages ────────────────────────────────────────────────────────────────

function normalizePageInput(input: Record<string, unknown>): Record<string, unknown> {
  const {
    meta_title,
    meta_description,
    seo_title,
    seo_description,
    featured_image,
    ...rest
  } = input
  const payload: Record<string, unknown> = {
    ...rest,
  }
  if (seo_title !== undefined || meta_title !== undefined) {
    payload.seo_title = (seo_title ?? meta_title ?? null) as unknown
  }
  if (seo_description !== undefined || meta_description !== undefined) {
    payload.seo_description = (seo_description ?? meta_description ?? null) as unknown
  }
  if (featured_image !== undefined) {
    payload.canonical_url = featured_image
  }
  return payload
}

function normalizePageRow(row: any) {
  if (!row) return null
  return {
    ...row,
    meta_title: row.seo_title || row.meta_title || null,
    meta_description: row.seo_description || row.meta_description || null,
    featured_image: row.featured_image || row.canonical_url || null,
  }
}

export async function createCmsPage(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = normalizePageInput(input)
  const { data, error } = await supabase.from("pages").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data: normalizePageRow(data), error: null }
}

export async function updateCmsPage(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = normalizePageInput(input)
  const { data, error } = await supabase.from("pages").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data: normalizePageRow(data), error: null }
}

export async function deleteCmsPage(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("pages").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getCmsPageById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("pages").select("*").eq("id", id).maybeSingle()
  if (error) { console.error("[cms] getCmsPageById:", error.message); return null }
  return normalizePageRow(data)
}

export async function getAllCmsPages() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("pages").select("*").order("updated_at", { ascending: false })
  if (error) { console.error("[cms] getAllCmsPages:", error.message); return [] }
  return (data || []).map(normalizePageRow)
}

// ── Navigation ───────────────────────────────────────────────────────────────

function normalizeNavigationInput(input: Record<string, unknown>): Record<string, unknown> {
  const { display_order, is_active, sort_order, is_visible, href, url, ...rest } = input
  const payload: Record<string, unknown> = { ...rest }
  if (sort_order !== undefined || display_order !== undefined) {
    payload.sort_order = sort_order ?? display_order
  }
  if (is_visible !== undefined || is_active !== undefined) {
    payload.is_visible = is_visible ?? is_active
  }
  if (url !== undefined || href !== undefined) {
    payload.url = url ?? href
  }
  return payload
}

function normalizeNavigationRow(row: any) {
  if (!row) return null
  return {
    ...row,
    href: row.url || row.href || "",
    url: row.url || row.href || "",
    display_order: row.sort_order ?? row.display_order ?? 0,
    is_active: row.is_visible ?? row.is_active ?? true,
  }
}

export async function createNavigationItem(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = normalizeNavigationInput(input)
  if (payload.sort_order === undefined) payload.sort_order = 0
  if (payload.is_visible === undefined) payload.is_visible = true
  const { data, error } = await supabase.from("navigation_items").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data: normalizeNavigationRow(data), error: null }
}

export async function updateNavigationItem(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = normalizeNavigationInput(input)
  const { data, error } = await supabase.from("navigation_items").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data: normalizeNavigationRow(data), error: null }
}

export async function deleteNavigationItem(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("navigation_items").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getAllNavigationItems() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("navigation_items")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) {
    // Fallback if sort_order isn't available
    const { data: fallback } = await supabase
      .from("navigation_items")
      .select("*")
      .order("created_at", { ascending: true })
    return (fallback || []).map(normalizeNavigationRow)
  }
  return (data || []).map(normalizeNavigationRow)
}

export async function updateNavigationOrder(items: { id: string; display_order: number }[]): Promise<Result<null>> {
  const supabase = await createClient()
  const results = await Promise.all(
    items.map((item) =>
      supabase.from("navigation_items").update({ sort_order: item.display_order }).eq("id", item.id),
    ),
  )
  const firstError = results.find((r) => r.error)?.error
  if (firstError) return { data: null, error: errMessage(firstError) }
  return { data: null, error: null }
}

// ── Footer ───────────────────────────────────────────────────────────────────

function normalizeFooterSectionInput(input: Record<string, unknown>): Record<string, unknown> {
  const { display_order, is_active, sort_order, is_visible, title, slug, ...rest } = input
  const payload: Record<string, unknown> = { ...rest }
  if (title !== undefined) payload.title = title
  if (sort_order !== undefined || display_order !== undefined) {
    payload.sort_order = sort_order ?? display_order
  }
  if (is_visible !== undefined || is_active !== undefined) {
    payload.is_visible = is_visible ?? is_active
  }
  if (slug !== undefined) {
    payload.slug = slug
  } else if (title !== undefined && typeof title === "string") {
    payload.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  }
  return payload
}

function normalizeFooterSectionRow(row: any) {
  if (!row) return null
  return {
    ...row,
    display_order: row.sort_order ?? row.display_order ?? 0,
    is_active: row.is_visible ?? row.is_active ?? true,
  }
}

export async function createFooterSection(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = normalizeFooterSectionInput(input)
  if (payload.sort_order === undefined) payload.sort_order = 0
  if (payload.is_visible === undefined) payload.is_visible = true
  if (!payload.slug && typeof payload.title === "string") {
    payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  }
  const { data, error } = await supabase.from("footer_sections").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data: normalizeFooterSectionRow(data), error: null }
}

export async function updateFooterSection(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = normalizeFooterSectionInput(input)
  const { data, error } = await supabase.from("footer_sections").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data: normalizeFooterSectionRow(data), error: null }
}

export async function deleteFooterSection(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("footer_sections").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getAllFooterSections() {
  const supabase = await createClient()
  let sections: any[] = []
  
  // Try sort_order first (actual DB column)
  const { data: s1, error: err1 } = await supabase
    .from("footer_sections")
    .select("*")
    .order("sort_order", { ascending: true })
  
  if (!err1 && s1) {
    sections = s1
  } else {
    // Fallback if schema changed
    const { data: s2, error: err2 } = await supabase
      .from("footer_sections")
      .select("*")
      .order("created_at", { ascending: true })
    if (!err2 && s2) sections = s2
  }

  const { data: links } = await supabase
    .from("footer_links")
    .select("*")
    .order("display_order", { ascending: true })

  return sections.map((raw) => {
    const s = normalizeFooterSectionRow(raw)!
    return {
      ...s,
      links: (links || []).filter((l) => l.section_id === s.id),
    }
  })
}

export async function createFooterLink(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("footer_links").insert(input).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateFooterLink(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("footer_links").update(input).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteFooterLink(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("footer_links").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getFooterLinks(sectionId?: string) {
  const supabase = await createClient()
  let q = supabase.from("footer_links").select("*").order("display_order", { ascending: true })
  if (sectionId) q = q.eq("section_id", sectionId)
  const { data, error } = await q
  if (error) { console.error("[cms] getFooterLinks:", error.message); return [] }
  return data || []
}

// ── Homepage ─────────────────────────────────────────────────────────────────

export async function getHomepageHero() {
  const supabase = await createClient()
  try {
    const { data: row } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "homepage_hero")
      .maybeSingle()
    if (row?.value) {
      return {
        id: "homepage_hero_singleton",
        ...row.value,
      }
    }
    return {
      id: "homepage_hero_singleton",
      heading: "Building a Stronger Ecosystem for India's Athletes.",
      subheading: "UnitedAthletes for India Foundation",
      button_text: "Explore Opportunities",
      button_url: "/programmes",
      secondary_button_text: "Donate to Athletes",
      secondary_button_url: "/donate",
      background_image: "/assets/facility.jpg",
      overlay_opacity: 0.6,
      is_enabled: true,
      stat_1_val: "14+",
      stat_1_lbl: "Sporting disciplines",
      stat_2_val: "6",
      stat_2_lbl: "Core programmes",
      stat_3_val: "1",
      stat_3_lbl: "Athlete-first promise",
    }
  } catch {
    return null
  }
}

export async function updateHomepageHero(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  try {
    const { data: existing } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "homepage_hero")
      .maybeSingle()
    const merged = {
      ...(existing?.value || {}),
      ...input,
      id: "homepage_hero_singleton",
    }
    const { error } = await supabase.from("site_settings").upsert({
      key: "homepage_hero",
      value: merged,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" })
    if (error) return { data: null, error: errMessage(error) }
    return { data: { id: "homepage_hero_singleton", ...merged }, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Failed to update homepage hero" }
  }
}

export async function getHomepageSections() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("homepage_sections")
    .select("*")
    .order("display_order", { ascending: true })
  if (error) { console.error("[cms] getHomepageSections:", error.message); return [] }
  return data || []
}

export async function updateHomepageSection(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("homepage_sections")
    .update(input)
    .eq("id", id)
    .select()
    .single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function createHomepageSection(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("homepage_sections").insert(input).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteHomepageSection(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("homepage_sections").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function updateHomepageSectionOrder(items: { id: string; display_order: number }[]): Promise<Result<null>> {
  const supabase = await createClient()
  const results = await Promise.all(
    items.map((item) =>
      supabase.from("homepage_sections").update({ display_order: item.display_order }).eq("id", item.id),
    ),
  )
  const firstError = results.find((r) => r.error)?.error
  if (firstError) return { data: null, error: errMessage(firstError) }
  return { data: null, error: null }
}

export async function getHomepageFeatured(sectionId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("homepage_featured")
    .select("*")
    .eq("section_id", sectionId)
    .maybeSingle()
  if (error) { console.error("[cms] getHomepageFeatured:", error.message); return null }
  return data
}

export async function updateHomepageFeatured(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("homepage_featured")
    .update(input)
    .eq("id", id)
    .select()
    .single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function createHomepageFeatured(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("homepage_featured").insert(input).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteHomepageFeatured(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("homepage_featured").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

// ── Enquiries ────────────────────────────────────────────────────────────────

export async function updateEnquiry(id: string, status: string, notes?: string): Promise<Result<unknown>> {
  const supabase = await createClient()
  const updateData: Record<string, unknown> = { status }
  if (notes !== undefined) updateData.admin_notes = notes
  const { data, error } = await supabase
    .from("enquiries")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteEnquiry(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("enquiries").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getEnquiries(opts?: { status?: string; limit?: number; search?: string }) {
  const supabase = await createClient()
  let q = supabase.from("enquiries").select("*").order("created_at", { ascending: false })
  if (opts?.status && opts.status !== "all") q = q.eq("status", opts.status)
  if (opts?.search) q = q.or(`name.ilike.%${opts.search}%,email.ilike.%${opts.search}%,subject.ilike.%${opts.search}%`)
  if (opts?.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) { console.error("[cms] getEnquiries:", error.message); return [] }
  return data || []
}

export async function getEnquiryById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("enquiries").select("*").eq("id", id).maybeSingle()
  if (error) { console.error("[cms] getEnquiryById:", error.message); return null }
  return data
}

export function normalizeCaseStudyStatus(status?: unknown): string {
  if (status === "published" || status === "active" || !status) return "published"
  if (status === "draft" || status === "inactive") return "draft"
  if (status === "archived") return "archived"
  return String(status)
}

export function normalizePlayerRegistrationStatus(status?: unknown): string {
  if (!status) return "new"
  return String(status)
}

// ── Case Studies ─────────────────────────────────────────────────────────────

export async function createCaseStudy(input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = {
    ...input,
    status: normalizeCaseStudyStatus(input.status),
  }
  const { data, error } = await supabase.from("case_studies").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateCaseStudy(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const payload = {
    ...input,
    ...(input.status !== undefined ? { status: normalizeCaseStudyStatus(input.status) } : {}),
  }
  const { data, error } = await supabase.from("case_studies").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteCaseStudy(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("case_studies").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getCaseStudyById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("case_studies").select("*").eq("id", id).maybeSingle()
  if (error) { console.error("[cms] getCaseStudyById:", error.message); return null }
  return data
}

export async function getCaseStudies(opts?: { status?: string; limit?: number; search?: string }) {
  const supabase = await createClient()
  let q = supabase
    .from("case_studies")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
  if (opts?.status && opts.status !== "all") q = q.eq("status", normalizeCaseStudyStatus(opts.status))
  if (opts?.search) q = q.ilike("title", `%${opts.search}%`)
  if (opts?.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) { console.error("[cms] getCaseStudies:", error.message); return [] }
  return data || []
}

export async function getAllCaseStudies() {
  return getCaseStudies()
}

// ── Player Registrations ─────────────────────────────────────────────────────

export async function updatePlayerRegistration(id: string, status: string, notes?: string): Promise<Result<unknown>> {
  const supabase = await createClient()
  const updateData: Record<string, unknown> = { status }
  if (notes !== undefined) updateData.admin_notes = notes
  const { data, error } = await supabase
    .from("player_registrations")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deletePlayerRegistration(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("player_registrations").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function getPlayerRegistrations(opts?: { status?: string; limit?: number; search?: string }) {
  const supabase = await createClient()
  let q = supabase.from("player_registrations").select("*").order("created_at", { ascending: false })
  if (opts?.status && opts.status !== "all") q = q.eq("status", opts.status)
  if (opts?.search) q = q.or(`name.ilike.%${opts.search}%,email.ilike.%${opts.search}%,sport.ilike.%${opts.search}%,city.ilike.%${opts.search}%`)
  if (opts?.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) { console.error("[cms] getPlayerRegistrations:", error.message); return [] }
  return data || []
}

export async function getPlayerRegistrationById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("player_registrations").select("*").eq("id", id).maybeSingle()
  if (error) { console.error("[cms] getPlayerRegistrationById:", error.message); return null }
  return data
}

// ── Admin users (admin_profiles view over profiles) ──────────────────────────

export async function getAllAdminProfiles() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) { console.error("[cms] getAllAdminProfiles:", error.message); return [] }
  return data || []
}

export async function updateAdminUser(id: string, input: Record<string, unknown>): Promise<Result<unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").update(input).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteAdminUser(id: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from("profiles").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

// ── Activity logs ────────────────────────────────────────────────────────────

export async function getActivityLogs(opts?: { limit?: number; action?: string }) {
  const supabase = await createClient()
  let q = supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
  if (opts?.action && opts.action !== "all") q = q.eq("action", opts.action)
  if (opts?.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) { console.error("[cms] getActivityLogs:", error.message); return [] }
  return data || []
}

// ── Dashboard stats (real counts, never fabricated) ──────────────────────────

export async function getDashboardStats() {
  const supabase = await createClient()

  const [
    articlesCount, publishedArticles, draftArticles,
    eventsCount, programmesCount, athletesCount, teamsCount,
    galleryCount, testimonialsCount, enquiriesCount, newEnquiriesCount,
    usersCount, recentArticles, recentEvents, recentEnquiries,
    caseStudiesCount, playerRegsCount, newPlayerRegsCount,
  ] = await Promise.all([
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("programmes").select("*", { count: "exact", head: true }),
    supabase.from("athletes").select("*", { count: "exact", head: true }),
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("gallery").select("*", { count: "exact", head: true }),
    supabase.from("testimonials").select("*", { count: "exact", head: true }),
    supabase.from("enquiries").select("*", { count: "exact", head: true }),
    supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("events").select("id, title, event_date, status").order("created_at", { ascending: false }).limit(5),
    supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("case_studies").select("*", { count: "exact", head: true }),
    supabase.from("player_registrations").select("*", { count: "exact", head: true }),
    supabase.from("player_registrations").select("*", { count: "exact", head: true }).eq("status", "new"),
  ])

  return {
    articles: {
      total: articlesCount.count || 0,
      published: publishedArticles.count || 0,
      draft: draftArticles.count || 0,
    },
    events: eventsCount.count || 0,
    programmes: programmesCount.count || 0,
    athletes: athletesCount.count || 0,
    teams: teamsCount.count || 0,
    gallery: galleryCount.count || 0,
    testimonials: testimonialsCount.count || 0,
    enquiries: {
      total: enquiriesCount.count || 0,
      new: newEnquiriesCount.count || 0,
    },
    users: usersCount.count || 0,
    caseStudies: caseStudiesCount.count || 0,
    playerRegistrations: playerRegsCount.count || 0,
    newPlayerRegistrations: newPlayerRegsCount.count || 0,
    recentArticles: recentArticles.data || [],
    recentEvents: recentEvents.data || [],
    recentEnquiries: recentEnquiries.data || [],
  }
}

// ── Media (Supabase Storage) ─────────────────────────────────────────────────

export async function uploadMedia(
  file: File,
  bucket = "media",
): Promise<{ data: { url: string; path: string } | null; error: string | null }> {
  const supabase = await createClient()
  const ext = file.name.split(".").pop() || "bin"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, { cacheControl: "3600", upsert: false })
  if (error) return { data: null, error: errMessage(error) }
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return { data: { url: urlData.publicUrl, path: data.path }, error: null }
}

export async function deleteMedia(path: string, bucket = "media"): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}
