// ============================================================================
// Browser-side admin CRUD actions ("use client" safe).
//
// Client admin components import from here. Every action runs under the
// signed-in admin's Supabase session; RLS enforces permissions server-side.
// Same { data, error } contract as the server admin-actions module.
// ============================================================================

import { createClient } from "@/lib/supabase/client"

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

// ── Who am I / activity logging ──────────────────────────────────────────────

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
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

export async function createActivityLog(input: {
  admin_user_id: string | null
  admin_email: string | null
  action: string
  entity_type: string
  entity_id: string | null
  description?: string | null
}) {
  try {
    const supabase = createClient()
    await supabase.from("activity_logs").insert({
      admin_user_id: input.admin_user_id,
      admin_email: input.admin_email,
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      description: input.description || null,
    })
  } catch {
    // best-effort
  }
}

// ── Site settings ────────────────────────────────────────────────────────────

export async function updateSiteSettings(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
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

    return { data: { id: "site_settings_unified", ...input } as any, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Failed to update site settings" }
  }
}

// ── Articles ─────────────────────────────────────────────────────────────────

export async function createArticle(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const { data, error } = await supabase.from("articles").insert(input).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateArticle(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const { data, error } = await supabase.from("articles").update(input).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteArticle(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("articles").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
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

export async function createCategory(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const { data, error } = await supabase.from("categories").insert(input).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateCategory(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const { data, error } = await supabase.from("categories").update(input).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteCategory(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
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

export async function createEvent(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = {
    ...input,
    status: normalizeEventStatus(input.status),
  }
  const { data, error } = await supabase.from("events").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateEvent(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = {
    ...input,
    ...(input.status !== undefined ? { status: normalizeEventStatus(input.status) } : {}),
  }
  const { data, error } = await supabase.from("events").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteEvent(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("events").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function publishEvent(id: string) {
  return updateEvent(id, { status: "upcoming" })
}

export async function unpublishEvent(id: string) {
  return updateEvent(id, { status: "cancelled" })
}

// ── Programmes ───────────────────────────────────────────────────────────────

export async function createProgramme(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const { data, error } = await supabase.from("programmes").insert(input).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateProgramme(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const { data, error } = await supabase.from("programmes").update(input).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteProgramme(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("programmes").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function publishProgramme(id: string) {
  return updateProgramme(id, { status: "published" })
}

export async function unpublishProgramme(id: string) {
  return updateProgramme(id, { status: "draft" })
}

// ── Athletes ─────────────────────────────────────────────────────────────────

export async function createAthlete(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = {
    ...input,
    status: normalizeAthleteStatus(input.status),
  }
  const { data, error } = await supabase.from("athletes").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateAthlete(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = {
    ...input,
    ...(input.status !== undefined ? { status: normalizeAthleteStatus(input.status) } : {}),
  }
  const { data, error } = await supabase.from("athletes").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteAthlete(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("athletes").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function publishAthlete(id: string) {
  return updateAthlete(id, { status: "active" })
}

export async function unpublishAthlete(id: string) {
  return updateAthlete(id, { status: "inactive" })
}

// ── Teams ────────────────────────────────────────────────────────────────────

export async function createTeam(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = {
    ...input,
    status: normalizeTeamStatus(input.status),
  }
  const { data, error } = await supabase.from("teams").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateTeam(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = {
    ...input,
    ...(input.status !== undefined ? { status: normalizeTeamStatus(input.status) } : {}),
  }
  const { data, error } = await supabase.from("teams").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteTeam(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("teams").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function publishTeam(id: string) {
  return updateTeam(id, { status: "active" })
}

export async function unpublishTeam(id: string) {
  return updateTeam(id, { status: "inactive" })
}

// ── Team roster ──────────────────────────────────────────────────────────────

export async function addTeamAthlete(teamId: string, athleteId: string, displayOrder = 0): Promise<Result> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("team_athletes")
    .insert({ team_id: teamId, athlete_id: athleteId, display_order: displayOrder })
    .select()
    .single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function removeTeamAthlete(teamId: string, athleteId: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase
    .from("team_athletes")
    .delete()
    .eq("team_id", teamId)
    .eq("athlete_id", athleteId)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

// ── Testimonials ─────────────────────────────────────────────────────────────

export async function createTestimonial(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = {
    ...input,
    status: normalizeTestimonialStatus(input.status),
  }
  const { data, error } = await supabase.from("testimonials").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateTestimonial(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = {
    ...input,
    ...(input.status !== undefined ? { status: normalizeTestimonialStatus(input.status) } : {}),
  }
  const { data, error } = await supabase.from("testimonials").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteTestimonial(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("testimonials").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function publishTestimonial(id: string) {
  return updateTestimonial(id, { status: "active" })
}

export async function unpublishTestimonial(id: string) {
  return updateTestimonial(id, { status: "inactive" })
}

// ── Gallery ──────────────────────────────────────────────────────────────────

export async function createGalleryItem(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = {
    ...input,
    status: normalizeGalleryStatus(input.status),
  }
  const { data, error } = await supabase.from("gallery").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateGalleryItem(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = {
    ...input,
    ...(input.status !== undefined ? { status: normalizeGalleryStatus(input.status) } : {}),
  }
  const { data, error } = await supabase.from("gallery").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteGalleryItem(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("gallery").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
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

export async function createCmsPage(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = normalizePageInput(input)
  const { data, error } = await supabase.from("pages").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateCmsPage(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = normalizePageInput(input)
  const { data, error } = await supabase.from("pages").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteCmsPage(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("pages").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
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

export async function createNavigationItem(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = normalizeNavigationInput(input)
  if (payload.sort_order === undefined) payload.sort_order = 0
  if (payload.is_visible === undefined) payload.is_visible = true
  const { data, error } = await supabase.from("navigation_items").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateNavigationItem(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = normalizeNavigationInput(input)
  const { data, error } = await supabase.from("navigation_items").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteNavigationItem(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("navigation_items").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
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

export async function createFooterSection(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = normalizeFooterSectionInput(input)
  if (payload.sort_order === undefined) payload.sort_order = 0
  if (payload.is_visible === undefined) payload.is_visible = true
  if (!payload.slug && typeof payload.title === "string") {
    payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  }
  const { data, error } = await supabase.from("footer_sections").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateFooterSection(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = normalizeFooterSectionInput(input)
  const { data, error } = await supabase.from("footer_sections").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteFooterSection(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("footer_sections").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

export async function createFooterLink(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const { data, error } = await supabase.from("footer_links").insert(input).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateFooterLink(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const { data, error } = await supabase.from("footer_links").update(input).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteFooterLink(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("footer_links").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

// ── Homepage ─────────────────────────────────────────────────────────────────

export async function updateHomepageHero(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
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
    return { data: { id: "homepage_hero_singleton", ...merged } as any, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Failed to update homepage hero" }
  }
}

export async function updateHomepageSection(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("homepage_sections")
    .update(input)
    .eq("id", id)
    .select()
    .single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function createHomepageSection(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const { data, error } = await supabase.from("homepage_sections").insert(input).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteHomepageSection(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("homepage_sections").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

// ── Enquiries ────────────────────────────────────────────────────────────────

export async function updateEnquiry(id: string, status: string, notes?: string): Promise<Result> {
  const supabase = createClient()
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

export async function deleteEnquiry(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("enquiries").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

// ── Case Studies ─────────────────────────────────────────────────────────────

function normalizeCaseStudyStatusClient(status?: unknown): string {
  if (status === "published" || status === "active" || !status) return "published"
  if (status === "draft" || status === "inactive") return "draft"
  if (status === "archived") return "archived"
  return String(status)
}

export async function createCaseStudy(input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = { ...input, status: normalizeCaseStudyStatusClient(input.status) }
  const { data, error } = await supabase.from("case_studies").insert(payload).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function updateCaseStudy(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const payload = {
    ...input,
    ...(input.status !== undefined ? { status: normalizeCaseStudyStatusClient(input.status) } : {}),
  }
  const { data, error } = await supabase.from("case_studies").update(payload).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteCaseStudy(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("case_studies").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

// ── Player Registrations ─────────────────────────────────────────────────────

export async function updatePlayerRegistration(id: string, status: string, notes?: string): Promise<Result> {
  const supabase = createClient()
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

export async function deletePlayerRegistration(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("player_registrations").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}

// ── Admin users ──────────────────────────────────────────────────────────────

export async function updateAdminUser(id: string, input: Record<string, unknown>): Promise<Result> {
  const supabase = createClient()
  const { data, error } = await supabase.from("profiles").update(input).eq("id", id).select().single()
  if (error) return { data: null, error: errMessage(error) }
  return { data, error: null }
}

export async function deleteAdminUser(id: string): Promise<Result<never>> {
  const supabase = createClient()
  const { error } = await supabase.from("profiles").delete().eq("id", id)
  if (error) return { data: null, error: errMessage(error) }
  return { data: null, error: null }
}
