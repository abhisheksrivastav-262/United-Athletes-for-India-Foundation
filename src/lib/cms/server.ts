// ============================================================================
// Public + shared server-side CMS reads.
// Every public page renders through these functions — no Supabase calls in JSX.
// All queries run under the caller's cookie session so RLS decides visibility:
// anonymous visitors only ever see published rows.
// Built-in graceful fallbacks ensure the website renders even if Supabase
// is still being configured or during cold starts.
// ============================================================================

import { createPublicClient } from "@/lib/supabase/server"
import type {
  SiteSettings,
  Page,
  Article,
  ArticleCategory,
  Event,
  Programme,
  Athlete,
  Team,
  Testimonial,
  GalleryItem,
  CaseStudy,
  HomepageSection,
  HomepageHero,
  HomepageFeatured,
  NavigationItem,
  FooterSection,
} from "./types"

// ── Default Fallback Data ───────────────────────────────────────────────────

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: "default-settings",
  site_name: "UnitedAthletes for India Foundation",
  logo_url: "/assets/logo-circle.png",
  favicon_url: "/favicon.ico",
  description: "An athlete-focused organisation committed to creating a stronger ecosystem for athletes across India.",
  email: "contact@unitedathletes.org",
  phone: "+91 98765 43210",
  address: "New Delhi, India",
  whatsapp: "+91 98765 43210",
  facebook_url: "https://facebook.com",
  instagram_url: "https://instagram.com",
  youtube_url: "https://youtube.com",
  twitter_url: "https://twitter.com",
  linkedin_url: "https://linkedin.com",
  footer_text: "Empowering Athletes. Enabling Dreams.",
  primary_color: "#C9A227",
  secondary_color: "#0B1D3A",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const DEFAULT_HOMEPAGE_HERO: HomepageHero = {
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
  display_order: 1,
  stat_1_val: "14+",
  stat_1_lbl: "Sporting disciplines",
  stat_2_val: "6",
  stat_2_lbl: "Core programmes",
  stat_3_val: "1",
  stat_3_lbl: "Athlete-first promise",
}

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    id: "sec-mission",
    section_key: "mission",
    section_type: "mission",
    title: "Dedicated to empowering athletes across India with opportunities, facilities, equipment and support.",
    subtitle: "Our Mission",
    description: "Empowering athletes. Enabling dreams.",
    content: null,
    is_visible: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sec-about",
    section_key: "about",
    section_type: "about",
    title: "Building a stronger sporting ecosystem",
    subtitle: "About Us",
    description: "UnitedAthletes for India Foundation works to identify, support, and develop sporting talent across India, providing athletes with the resources, equipment, and facilities they need.",
    content: null,
    is_visible: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sec-programmes",
    section_key: "programmes",
    section_type: "programmes",
    title: "Our Programmes",
    subtitle: "What We Do",
    description: "Structured initiatives designed to support athletes at every stage of their journey.",
    content: null,
    is_visible: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sec-athletes",
    section_key: "athletes",
    section_type: "athletes",
    title: "Popular Sports & Disciplines",
    subtitle: "Games We Support",
    description: "Explore the sporting disciplines, athletic divisions, and grassroots training programs supported by UnitedAthletes across India.",
    content: null,
    is_visible: true,
    display_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sec-events",
    section_key: "events",
    section_type: "events",
    title: "Upcoming Events & Tournaments",
    subtitle: "National Meets",
    description: "Join us at championships, selection trials, and sporting meets across premier stadiums.",
    content: null,
    is_visible: true,
    display_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sec-news",
    section_key: "news",
    section_type: "news",
    title: "Latest News & Updates",
    subtitle: "News",
    description: "Stories and announcements from our sports community.",
    content: null,
    is_visible: true,
    display_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sec-testimonials",
    section_key: "testimonials",
    section_type: "testimonials",
    title: "Voices of our Community",
    subtitle: "Testimonials",
    description: "",
    content: null,
    is_visible: true,
    display_order: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sec-gallery",
    section_key: "gallery",
    section_type: "gallery",
    title: "Moments Captured",
    subtitle: "Gallery",
    description: "",
    content: null,
    is_visible: true,
    display_order: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sec-cta",
    section_key: "cta",
    section_type: "cta",
    title: "Ready to make a difference?",
    subtitle: "Join Us",
    description: "Support an athlete today and become part of India's sporting journey.",
    content: {
      button_text: "Get Involved",
      button_href: "/get-involved",
      background_image: "/assets/community.jpg",
    },
    is_visible: true,
    display_order: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
  { id: "nav-1", label: "Home", url: "/", href: "/", type: "header", target: "_self", display_order: 1, is_active: true, is_external: false, parent_id: null, created_at: "", updated_at: "" },
  { id: "nav-2", label: "About", url: "/about", href: "/about", type: "header", target: "_self", display_order: 2, is_active: true, is_external: false, parent_id: null, created_at: "", updated_at: "" },
  { id: "nav-3", label: "Programmes", url: "/programmes", href: "/programmes", type: "header", target: "_self", display_order: 3, is_active: true, is_external: false, parent_id: null, created_at: "", updated_at: "" },
  { id: "nav-4", label: "Get Involved", url: "/get-involved", href: "/get-involved", type: "header", target: "_self", display_order: 4, is_active: true, is_external: false, parent_id: null, created_at: "", updated_at: "" },
  { id: "nav-5", label: "News", url: "/news", href: "/news", type: "header", target: "_self", display_order: 5, is_active: true, is_external: false, parent_id: null, created_at: "", updated_at: "" },
  { id: "nav-6", label: "Events", url: "/events", href: "/events", type: "header", target: "_self", display_order: 6, is_active: true, is_external: false, parent_id: null, created_at: "", updated_at: "" },
  { id: "nav-7", label: "Athletes", url: "/athletes", href: "/athletes", type: "header", target: "_self", display_order: 7, is_active: true, is_external: false, parent_id: null, created_at: "", updated_at: "" },
  { id: "nav-8", label: "Gallery", url: "/gallery", href: "/gallery", type: "header", target: "_self", display_order: 8, is_active: true, is_external: false, parent_id: null, created_at: "", updated_at: "" },
  { id: "nav-9", label: "Contact", url: "/contact", href: "/contact", type: "header", target: "_self", display_order: 9, is_active: true, is_external: false, parent_id: null, created_at: "", updated_at: "" },
  { id: "nav-10", label: "Donate", url: "/donate", href: "/donate", type: "header", target: "_self", display_order: 10, is_active: true, is_external: false, parent_id: null, created_at: "", updated_at: "" },
]

export const DEFAULT_FOOTER_SECTIONS: FooterSection[] = [
  {
    id: "foot-explore",
    title: "Explore",
    display_order: 1,
    is_active: true,
    created_at: "",
    updated_at: "",
    links: [
      { id: "fl-1", section_id: "foot-explore", label: "Home", href: "/", is_external: false, display_order: 1, created_at: "", updated_at: "" },
      { id: "fl-2", section_id: "foot-explore", label: "About Us", href: "/about", is_external: false, display_order: 2, created_at: "", updated_at: "" },
      { id: "fl-3", section_id: "foot-explore", label: "Programmes", href: "/programmes", is_external: false, display_order: 3, created_at: "", updated_at: "" },
      { id: "fl-4", section_id: "foot-explore", label: "News", href: "/news", is_external: false, display_order: 4, created_at: "", updated_at: "" },
      { id: "fl-5", section_id: "foot-explore", label: "Events", href: "/events", is_external: false, display_order: 5, created_at: "", updated_at: "" },
      { id: "fl-6", section_id: "foot-explore", label: "Athletes", href: "/athletes", is_external: false, display_order: 6, created_at: "", updated_at: "" },
      { id: "fl-7", section_id: "foot-explore", label: "Gallery", href: "/gallery", is_external: false, display_order: 7, created_at: "", updated_at: "" },
      { id: "fl-8", section_id: "foot-explore", label: "Contact", href: "/contact", is_external: false, display_order: 8, created_at: "", updated_at: "" },
    ],
  },
  {
    id: "foot-involved",
    title: "Get Involved",
    display_order: 2,
    is_active: true,
    created_at: "",
    updated_at: "",
    links: [
      { id: "fl-9", section_id: "foot-involved", label: "Support Athletes", href: "/get-involved", is_external: false, display_order: 1, created_at: "", updated_at: "" },
      { id: "fl-10", section_id: "foot-involved", label: "Provide Equipment", href: "/get-involved", is_external: false, display_order: 2, created_at: "", updated_at: "" },
      { id: "fl-11", section_id: "foot-involved", label: "Partner With Us", href: "/get-involved", is_external: false, display_order: 3, created_at: "", updated_at: "" },
      { id: "fl-12", section_id: "foot-involved", label: "Contact Us", href: "/contact", is_external: false, display_order: 4, created_at: "", updated_at: "" },
    ],
  },
]

export const DEFAULT_PROGRAMMES: Programme[] = [
  {
    id: "prog-1",
    title: "Facility Access & Infrastructure",
    slug: "facility-access-infrastructure",
    description: "Opening doors to modern sports complexes, tracks, and courts so athletes never lack a place to train.",
    image: "/assets/facility.jpg",
    content: "<p>Access to quality sporting infrastructure is the foundation of athletic excellence. We partner with top academies and facilities across India to ensure our athletes have regular access to world-class grounds, courts, and training environments.</p>",
    status: "published",
    display_order: 1,
    created_at: "",
    updated_at: "",
  },
  {
    id: "prog-2",
    title: "Equipment & Gear Grants",
    slug: "equipment-gear-grants",
    description: "Providing high-grade equipment, competition gear, and athletic footwear to promising talent.",
    image: "/assets/equipment.jpg",
    content: "<p>No athlete should have their potential limited by equipment costs. We provide direct gear grants and specialized sporting equipment to ensure athletes can compete on an equal footing.</p>",
    status: "published",
    display_order: 2,
    created_at: "",
    updated_at: "",
  },
  {
    id: "prog-3",
    title: "Athlete Mentorship & Coaching",
    slug: "athlete-mentorship-coaching",
    description: "Connecting athletes with experienced coaches, mentors, and sports science specialists.",
    image: "/assets/support.jpg",
    content: "<p>Guided coaching and mental conditioning are crucial for long-term athletic success. Our mentorship network links emerging athletes with certified coaches and seasoned professionals.</p>",
    status: "published",
    display_order: 3,
    created_at: "",
    updated_at: "",
  },
]

export const DEFAULT_ATHLETES: Athlete[] = [
  {
    id: "ath-1",
    name: "Athletics (Track & Field)",
    slug: "athletics-track-and-field",
    photo: "/assets/about-athlete.jpg",
    sport: "Track & Field",
    category: "Sprints, Relays, Jumps & Throws",
    biography: "Comprehensive training and grassroots support for track and field events, fostering next-generation athletic talent across India.",
    achievements: "National Youth Podium Finishes, Grassroots Development in 12+ States",
    profile_details: null,
    nationality: "India",
    status: "active",
    display_order: 1,
    created_at: "",
    updated_at: "",
  },
  {
    id: "ath-2",
    name: "Badminton",
    slug: "badminton",
    photo: "/assets/hero-athletes.jpg",
    sport: "Racquet Sports",
    category: "Singles, Doubles & Mixed Doubles",
    biography: "Elite coaching and equipment grants for promising badminton talent preparing for national circuits and international opens.",
    achievements: "All-India Junior Finalists, State Championships",
    profile_details: null,
    nationality: "India",
    status: "active",
    display_order: 2,
    created_at: "",
    updated_at: "",
  },
  {
    id: "ath-3",
    name: "Football",
    slug: "football",
    photo: "/assets/community.jpg",
    sport: "Team Sports",
    category: "Youth Academy & Grassroots Leagues",
    biography: "Grassroots academies and tactical training camps empowering aspiring footballers across regional talent hubs.",
    achievements: "Inter-District Youth Champions, Academy Development",
    profile_details: null,
    nationality: "India",
    status: "active",
    display_order: 3,
    created_at: "",
    updated_at: "",
  },
  {
    id: "ath-4",
    name: "Cricket",
    slug: "cricket",
    photo: "/assets/equipment.jpg",
    sport: "Team Sports",
    category: "Youth Development & Pace Bowling Camp",
    biography: "Structured youth clinics, gear distribution, and coaching masterclasses nurturing grassroots cricket talent.",
    achievements: "State Junior League Champions, Grassroots Outreach",
    profile_details: null,
    nationality: "India",
    status: "active",
    display_order: 4,
    created_at: "",
    updated_at: "",
  },
  {
    id: "ath-5",
    name: "Wrestling",
    slug: "wrestling",
    photo: "/assets/facility.jpg",
    sport: "Combat Sports",
    category: "Freestyle & Greco-Roman",
    biography: "Specialized mats, strength conditioning, and nutritional support for emerging wrestlers across India training centers.",
    achievements: "Cadet National Medals, Inter-State Tournament Gold",
    profile_details: null,
    nationality: "India",
    status: "active",
    display_order: 5,
    created_at: "",
    updated_at: "",
  },
  {
    id: "ath-6",
    name: "Boxing",
    slug: "boxing",
    photo: "/assets/para-athlete.jpg",
    sport: "Combat Sports",
    category: "Olympic Divisions & Youth Training",
    biography: "Precision footwork, tactical spar conditioning, and tournament sponsorship for grassroots pugilists.",
    achievements: "Youth National Finalists, Regional Boxing Cups",
    profile_details: null,
    nationality: "India",
    status: "active",
    display_order: 6,
    created_at: "",
    updated_at: "",
  },
  {
    id: "ath-7",
    name: "Archery",
    slug: "archery",
    photo: "/assets/programme-hero.jpg",
    sport: "Precision Sports",
    category: "Recurve & Compound",
    biography: "High-grade bow kits, mental conditioning, and target training facilities supporting dedicated junior archers.",
    achievements: "National School Games Gold, State Archery Ranking",
    profile_details: null,
    nationality: "India",
    status: "active",
    display_order: 7,
    created_at: "",
    updated_at: "",
  },
  {
    id: "ath-8",
    name: "Para Sports",
    slug: "para-sports",
    photo: "/assets/support.jpg",
    sport: "Inclusive Sports",
    category: "Para Athletics, Badminton & Powerlifting",
    biography: "Dedicated sports wheelchairs, prosthetic maintenance, and equal training access for extraordinary para-athletes across India.",
    achievements: "Asian Para Games Medalists, National Para Gold",
    profile_details: null,
    nationality: "India",
    status: "active",
    display_order: 8,
    created_at: "",
    updated_at: "",
  },
]

export const DEFAULT_EVENTS: Event[] = [
  {
    id: "ev-1",
    title: "National Youth Athletics Championship 2026",
    slug: "national-youth-athletics-championship-2026",
    description: "Premier national track & field championship featuring 100m, 200m, 400m, hurdles, long jump, and javelin throw competitions for junior and senior talents across Indian states.",
    event_date: "2026-10-28",
    start_time: "08:00",
    end_time: "18:00",
    location: "Jawaharlal Nehru Stadium, New Delhi",
    featured_image: "/assets/facility.jpg",
    registration_url: "/contact",
    status: "upcoming",
    created_at: "",
    updated_at: "",
  },
  {
    id: "ev-2",
    title: "All-India Grassroots Badminton Open 2026",
    slug: "all-india-grassroots-badminton-open-2026",
    description: "State-of-the-art badminton tournament featuring singles and doubles categories with professional grade synthetic courts and electronic scoring.",
    event_date: "2026-11-15",
    start_time: "09:00",
    end_time: "19:00",
    location: "Major Dhyan Chand National Stadium, New Delhi",
    featured_image: "/assets/facility.jpg",
    registration_url: "/contact",
    status: "upcoming",
    created_at: "",
    updated_at: "",
  },
  {
    id: "ev-3",
    title: "National Inter-State Boxing & Combat Cup",
    slug: "national-inter-state-boxing-combat-cup",
    description: "Championship boxing bouts across Olympic weight divisions with certified judges, medical supervision, and high-performance talent scouts.",
    event_date: "2026-12-05",
    start_time: "10:00",
    end_time: "18:30",
    location: "Shree Shiv Chhatrapati Sports Complex (Balewadi), Pune",
    featured_image: "/assets/facility.jpg",
    registration_url: "/contact",
    status: "upcoming",
    created_at: "",
    updated_at: "",
  },
  {
    id: "ev-4",
    title: "All-India Para Sports Invitational 2027",
    slug: "all-india-para-sports-invitational-2027",
    description: "Inclusive national sporting event celebrating para athletics, seated javelin, wheelchair racing, and para badminton.",
    event_date: "2027-01-12",
    start_time: "08:30",
    end_time: "17:30",
    location: "Kalinga Stadium, Bhubaneswar, Odisha",
    featured_image: "/assets/facility.jpg",
    registration_url: "/contact",
    status: "upcoming",
    created_at: "",
    updated_at: "",
  },
  {
    id: "ev-5",
    title: "National Youth Wrestling Trials 2027",
    slug: "national-youth-wrestling-trials-2027",
    description: "Freestyle and Greco-Roman wrestling selection trials for upcoming international youth camps and foundation sponsorships.",
    event_date: "2027-02-20",
    start_time: "08:00",
    end_time: "17:00",
    location: "Indira Gandhi Indoor Arena, New Delhi",
    featured_image: "/assets/facility.jpg",
    registration_url: "/contact",
    status: "upcoming",
    created_at: "",
    updated_at: "",
  },
]

export const DEFAULT_ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "Foundation Launches Elite Athlete Support Program",
    slug: "foundation-launches-elite-athlete-support-program",
    excerpt: "Comprehensive funding and training support announced for 50 promising athletes across India.",
    content: "<p>UnitedAthletes for India Foundation today announced the launch of its 2026-27 Elite Support Cohort, offering direct financial aid, equipment access, and sports science guidance to talented youngsters across multiple states.</p>",
    featured_image: "/assets/support.jpg",
    author_id: null,
    author: "UnitedAthletes Editorial",
    category_id: null,
    category: { name: "Announcements", slug: "announcements" },
    status: "published",
    published_at: "2026-08-15T10:00:00Z",
    meta_title: null,
    meta_description: null,
    og_title: null,
    og_description: null,
    og_image: null,
    canonical_url: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "art-2",
    title: "Grassroots Scouting Campaign Reaches 12 Districts",
    slug: "grassroots-scouting-campaign-reaches-12-districts",
    excerpt: "Over 800 young athletes screened in the latest regional development phase.",
    content: "<p>Our scout team has completed regional fitness assessments and talent identification trials across rural and semi-urban districts, identifying exceptional promise in track and field and racquet sports.</p>",
    featured_image: "/assets/community.jpg",
    author_id: null,
    author: "UnitedAthletes Editorial",
    category_id: null,
    category: { name: "Grassroots", slug: "grassroots" },
    status: "published",
    published_at: "2026-08-28T14:30:00Z",
    meta_title: null,
    meta_description: null,
    og_title: null,
    og_description: null,
    og_image: null,
    canonical_url: null,
    created_at: "",
    updated_at: "",
  },
]

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    name: "National Sports Development Panel",
    role: "Coaching & Mentorship Council",
    photo: null,
    quote: "UnitedAthletes provides the exact infrastructure, nutritional support, and consistent backing that emerging sports talents need across India to compete at the highest level.",
    status: "active",
    display_order: 1,
    created_at: "",
    updated_at: "",
  },
  {
    id: "test-2",
    name: "Grassroots Academy Director",
    role: "Regional Talent Scout",
    photo: null,
    quote: "Having access to professional equipment and tournament grants without financial burden enables athletes to focus entirely on their performance and dream big.",
    status: "active",
    display_order: 2,
    created_at: "",
    updated_at: "",
  },
]

export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  { id: "gal-1", title: "Training Session", image_url: "/assets/facility.jpg", alt_text: "Indoor sports arena", description: "Indoor training facilities", category: "Facilities", status: "active", display_order: 1, created_at: "", updated_at: "" },
  { id: "gal-2", title: "Equipment Distribution", image_url: "/assets/equipment.jpg", alt_text: "Athletic equipment", description: "Equipment and gear distribution", category: "Gear", status: "active", display_order: 2, created_at: "", updated_at: "" },
  { id: "gal-3", title: "Coaching Session", image_url: "/assets/support.jpg", alt_text: "Athlete mentorship and coaching session", description: "Mentorship and training", category: "Coaching", status: "active", display_order: 3, created_at: "", updated_at: "" },
  { id: "gal-4", title: "Community Huddle", image_url: "/assets/community.jpg", alt_text: "Community sporting initiative", description: "Community gatherings", category: "Community", status: "active", display_order: 4, created_at: "", updated_at: "" },
]

// ── Site settings (single row) ───────────────────────────────────────────────

export async function getSiteSettingsServer(): Promise<SiteSettings | null> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_SITE_SETTINGS
    const { data: rows, error } = await c
      .from("site_settings")
      .select("*")
    if (error || !rows || rows.length === 0) return DEFAULT_SITE_SETTINGS

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
      site_name: general.site_name || DEFAULT_SITE_SETTINGS.site_name,
      description: general.footer_blurb || seo.default_description || DEFAULT_SITE_SETTINGS.description,
      logo_url: general.logo_url || DEFAULT_SITE_SETTINGS.logo_url,
      favicon_url: general.favicon_url || DEFAULT_SITE_SETTINGS.favicon_url,
      email: contact.email || DEFAULT_SITE_SETTINGS.email,
      phone: contact.phone || DEFAULT_SITE_SETTINGS.phone,
      address: contact.address || DEFAULT_SITE_SETTINGS.address,
      whatsapp: whatsapp.phone_number || DEFAULT_SITE_SETTINGS.whatsapp,
      facebook_url: social.facebook || DEFAULT_SITE_SETTINGS.facebook_url,
      instagram_url: social.instagram || DEFAULT_SITE_SETTINGS.instagram_url,
      youtube_url: social.youtube || DEFAULT_SITE_SETTINGS.youtube_url,
      twitter_url: social.twitter || DEFAULT_SITE_SETTINGS.twitter_url,
      linkedin_url: social.linkedin || DEFAULT_SITE_SETTINGS.linkedin_url,
      primary_color: general.primary_color || DEFAULT_SITE_SETTINGS.primary_color,
      secondary_color: general.secondary_color || DEFAULT_SITE_SETTINGS.secondary_color,
      footer_text: general.footer_blurb || DEFAULT_SITE_SETTINGS.footer_text,
      created_at: "",
      updated_at: new Date().toISOString(),
    }
  } catch (err) {
    console.error("[cms] getSiteSettingsServer error:", err)
    return DEFAULT_SITE_SETTINGS
  }
}

// ── Pages ────────────────────────────────────────────────────────────────────

function sanitizePageContent(raw: unknown): string | null {
  if (typeof raw === "string") {
    const trimmed = raw.trim()
    return trimmed && trimmed !== "[object Object]" ? trimmed : null
  }
  if (raw && typeof raw === "object") {
    const html = (raw as Record<string, unknown>).html
    if (typeof html === "string" && html.trim() && html.trim() !== "[object Object]") {
      return html.trim()
    }
    try {
      return JSON.stringify(raw)
    } catch {
      return null
    }
  }
  return null
}

function normalizeServerPage(row: any): Page {
  return {
    ...row,
    meta_title: row.seo_title || row.meta_title || null,
    meta_description: row.seo_description || row.meta_description || null,
    featured_image: row.featured_image || row.canonical_url || null,
    content: sanitizePageContent(row.content),
  }
}

export async function getPagesServer(): Promise<Page[]> {
  try {
    const c = createPublicClient()
    if (!c) return []
    const { data, error } = await c
      .from("pages")
      .select("*")
      .order("updated_at", { ascending: false })
    if (error || !data) return []
    return (data as any[]).map(normalizeServerPage)
  } catch {
    return []
  }
}

export async function getPageBySlugServer(slug: string): Promise<Page | null> {
  try {
    const c = createPublicClient()
    if (!c) return null
    const { data, error } = await c
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
    if (error || !data) return null
    return normalizeServerPage(data)
  } catch {
    return null
  }
}

// ── Articles ─────────────────────────────────────────────────────────────────

export async function getArticlesServer(opts?: {
  status?: string
  limit?: number
  categoryId?: string
}): Promise<Article[]> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_ARTICLES.slice(0, opts?.limit || 10)
    let q = c
      .from("articles")
      .select("*, category:categories(name, slug)")
      .order("published_at", { ascending: false, nullsFirst: false })
    if (opts?.status) q = q.eq("status", opts.status)
    if (opts?.categoryId) q = q.eq("category_id", opts.categoryId)
    if (opts?.limit) q = q.limit(opts.limit)
    const { data, error } = await q
    if (error || !data || data.length === 0) return DEFAULT_ARTICLES.slice(0, opts?.limit || 10)
    return data as unknown as Article[]
  } catch {
    return DEFAULT_ARTICLES.slice(0, opts?.limit || 10)
  }
}

export async function getArticleBySlugServer(slug: string): Promise<Article | null> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_ARTICLES.find((a) => a.slug === slug) || null
    const { data, error } = await c
      .from("articles")
      .select("*, category:categories(name, slug)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
    if (error || !data) return DEFAULT_ARTICLES.find((a) => a.slug === slug) || null
    return data as unknown as Article
  } catch {
    return DEFAULT_ARTICLES.find((a) => a.slug === slug) || null
  }
}

export async function getArticleCategoriesServer(): Promise<ArticleCategory[]> {
  try {
    const c = createPublicClient()
    if (!c) return []
    const { data, error } = await c
      .from("categories")
      .select("*")
      .order("name")
    if (error) return []
    return (data as ArticleCategory[]) || []
  } catch {
    return []
  }
}

// ── Events ───────────────────────────────────────────────────────────────────

export async function getEventsServer(opts?: {
  status?: string
  limit?: number
  upcoming?: boolean
}): Promise<Event[]> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_EVENTS.slice(0, opts?.limit || 10)
    let q = c
      .from("events")
      .select("*")
      .order("event_date", { ascending: true })
    if (opts?.status) {
      if (opts.status === "published" || opts.status === "upcoming") {
        q = q.in("status", ["upcoming", "live", "published"])
      } else {
        q = q.eq("status", opts.status)
      }
    }
    if (opts?.upcoming) q = q.gte("event_date", new Date().toISOString().split("T")[0])
    if (opts?.limit) q = q.limit(opts.limit)
    const { data, error } = await q
    if (error || !data || data.length === 0) return DEFAULT_EVENTS.slice(0, opts?.limit || 10)
    return data as Event[]
  } catch {
    return DEFAULT_EVENTS.slice(0, opts?.limit || 10)
  }
}

export async function getEventBySlugServer(slug: string): Promise<Event | null> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_EVENTS.find((e) => e.slug === slug) || null
    const { data, error } = await c
      .from("events")
      .select("*")
      .eq("slug", slug)
      .in("status", ["upcoming", "live", "completed", "published"])
      .maybeSingle()
    if (error || !data) return DEFAULT_EVENTS.find((e) => e.slug === slug) || null
    return data as Event
  } catch {
    return DEFAULT_EVENTS.find((e) => e.slug === slug) || null
  }
}

// ── Programmes ───────────────────────────────────────────────────────────────

export async function getProgrammesServer(opts?: {
  status?: string
  limit?: number
}): Promise<Programme[]> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_PROGRAMMES.slice(0, opts?.limit || 10)
    let q = c
      .from("programmes")
      .select("*")
      .order("display_order", { ascending: true })
    if (opts?.status) q = q.eq("status", opts.status)
    if (opts?.limit) q = q.limit(opts.limit)
    const { data, error } = await q
    if (error || !data || data.length === 0) return DEFAULT_PROGRAMMES.slice(0, opts?.limit || 10)
    return data as Programme[]
  } catch {
    return DEFAULT_PROGRAMMES.slice(0, opts?.limit || 10)
  }
}

export async function getProgrammeBySlugServer(slug: string): Promise<Programme | null> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_PROGRAMMES.find((p) => p.slug === slug) || null
    const { data, error } = await c
      .from("programmes")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
    if (error || !data) return DEFAULT_PROGRAMMES.find((p) => p.slug === slug) || null
    return data as Programme
  } catch {
    return DEFAULT_PROGRAMMES.find((p) => p.slug === slug) || null
  }
}

// ── Athletes ─────────────────────────────────────────────────────────────────

export async function getAthletesServer(opts?: {
  status?: string
  limit?: number
  sport?: string
}): Promise<Athlete[]> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_ATHLETES.slice(0, opts?.limit || 10)
    let q = c
      .from("athletes")
      .select("*")
      .order("display_order", { ascending: true })
    if (opts?.status) {
      if (opts.status === "published" || opts.status === "active") {
        q = q.in("status", ["active", "published"])
      } else {
        q = q.eq("status", opts.status)
      }
    }
    if (opts?.sport) q = q.eq("sport", opts.sport)
    if (opts?.limit) q = q.limit(opts.limit)
    const { data, error } = await q
    if (error || !data || data.length === 0) return DEFAULT_ATHLETES.slice(0, opts?.limit || 10)
    return data as Athlete[]
  } catch {
    return DEFAULT_ATHLETES.slice(0, opts?.limit || 10)
  }
}

export async function getAthleteBySlugServer(slug: string): Promise<Athlete | null> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_ATHLETES.find((a) => a.slug === slug) || null
    const { data, error } = await c
      .from("athletes")
      .select("*")
      .eq("slug", slug)
      .in("status", ["active", "published"])
      .maybeSingle()
    if (error || !data) return DEFAULT_ATHLETES.find((a) => a.slug === slug) || null
    return data as Athlete
  } catch {
    return DEFAULT_ATHLETES.find((a) => a.slug === slug) || null
  }
}

// ── Teams ────────────────────────────────────────────────────────────────────

export async function getTeamsServer(opts?: {
  status?: string
  limit?: number
}): Promise<Team[]> {
  try {
    const c = createPublicClient()
    if (!c) return []
    let q = c
      .from("teams")
      .select("*")
      .order("display_order", { ascending: true })
    if (opts?.status) {
      if (opts.status === "published" || opts.status === "active") {
        q = q.in("status", ["active", "published"])
      } else {
        q = q.eq("status", opts.status)
      }
    }
    if (opts?.limit) q = q.limit(opts.limit)
    const { data, error } = await q
    if (error) return []
    return (data as Team[]) || []
  } catch {
    return []
  }
}

export async function getTeamBySlugServer(slug: string): Promise<Team | null> {
  try {
    const c = createPublicClient()
    if (!c) return null
    const { data, error } = await c
      .from("teams")
      .select("*")
      .eq("slug", slug)
      .in("status", ["active", "published"])
      .maybeSingle()
    if (error) return null
    return (data as Team) ?? null
  } catch {
    return null
  }
}

/** Roster rows for a team with the athlete record joined in. */
export async function getTeamAthletesServer(teamId: string) {
  try {
    const c = createPublicClient()
    if (!c) return []
    const { data, error } = await c
      .from("team_athletes")
      .select("*, athlete:athletes(*)")
      .eq("team_id", teamId)
      .order("display_order", { ascending: true })
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

// ── Testimonials ─────────────────────────────────────────────────────────────

export async function getTestimonialsServer(opts?: {
  status?: string
  limit?: number
}): Promise<Testimonial[]> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_TESTIMONIALS.slice(0, opts?.limit || 10)
    let q = c
      .from("testimonials")
      .select("*")
      .order("display_order", { ascending: true })
    if (opts?.status) {
      if (opts.status === "published" || opts.status === "active") {
        q = q.in("status", ["active", "published"])
      } else {
        q = q.eq("status", opts.status)
      }
    }
    if (opts?.limit) q = q.limit(opts.limit)
    const { data, error } = await q
    if (error || !data || data.length === 0) return DEFAULT_TESTIMONIALS.slice(0, opts?.limit || 10)
    return data as Testimonial[]
  } catch {
    return DEFAULT_TESTIMONIALS.slice(0, opts?.limit || 10)
  }
}

// ── Gallery ──────────────────────────────────────────────────────────────────

export async function getGalleryItemsServer(opts?: {
  status?: string
  limit?: number
  category?: string
}): Promise<GalleryItem[]> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_GALLERY_ITEMS.slice(0, opts?.limit || 10)
    let q = c
      .from("gallery")
      .select("*")
      .order("display_order", { ascending: true })
    if (opts?.status) {
      if (opts.status === "published" || opts.status === "active") {
        q = q.in("status", ["active", "published"])
      } else {
        q = q.eq("status", opts.status)
      }
    }
    if (opts?.category) q = q.eq("category", opts.category)
    if (opts?.limit) q = q.limit(opts.limit)
    const { data, error } = await q
    if (error || !data || data.length === 0) return DEFAULT_GALLERY_ITEMS.slice(0, opts?.limit || 10)
    return data as GalleryItem[]
  } catch {
    return DEFAULT_GALLERY_ITEMS.slice(0, opts?.limit || 10)
  }
}

// ── Case Studies ─────────────────────────────────────────────────────────────

export const DEFAULT_CASE_STUDIES: CaseStudy[] = []

export async function getCaseStudiesServer(opts?: {
  status?: string
  limit?: number
}): Promise<CaseStudy[]> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_CASE_STUDIES
    let q = c
      .from("case_studies")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
    if (opts?.status) {
      q = q.eq("status", opts.status)
    } else {
      q = q.eq("status", "published")
    }
    if (opts?.limit) q = q.limit(opts.limit)
    const { data, error } = await q
    if (error || !data) return DEFAULT_CASE_STUDIES
    return data as CaseStudy[]
  } catch {
    return DEFAULT_CASE_STUDIES
  }
}

export async function getCaseStudyBySlugServer(slug: string): Promise<CaseStudy | null> {
  try {
    const c = createPublicClient()
    if (!c) return null
    const { data, error } = await c
      .from("case_studies")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
    if (error) return null
    return (data as CaseStudy) || null
  } catch {
    return null
  }
}

// ── Homepage ─────────────────────────────────────────────────────────────────

export async function getHomepageHeroServer(): Promise<HomepageHero | null> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_HOMEPAGE_HERO
    const { data: row } = await c
      .from("site_settings")
      .select("value")
      .eq("key", "homepage_hero")
      .maybeSingle()
    if (row?.value) {
      return {
        ...DEFAULT_HOMEPAGE_HERO,
        ...row.value,
        id: row.value.id || "homepage_hero_singleton",
      } as HomepageHero
    }
    return DEFAULT_HOMEPAGE_HERO
  } catch {
    return DEFAULT_HOMEPAGE_HERO
  }
}

export async function getHomepageSectionsServer(): Promise<HomepageSection[]> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_HOMEPAGE_SECTIONS
    const { data, error } = await c
      .from("homepage_sections")
      .select("*")
      .order("display_order", { ascending: true })
    if (error || !data || data.length === 0) return DEFAULT_HOMEPAGE_SECTIONS
    return data as HomepageSection[]
  } catch {
    return DEFAULT_HOMEPAGE_SECTIONS
  }
}

export async function getHomepageFeaturedServer(
  sectionId: string,
): Promise<HomepageFeatured | null> {
  try {
    const c = createPublicClient()
    if (!c) return null
    const { data, error } = await c
      .from("homepage_featured")
      .select("*")
      .eq("section_id", sectionId)
      .maybeSingle()
    if (error) return null
    return (data as HomepageFeatured) ?? null
  } catch {
    return null
  }
}

// ── Navigation ───────────────────────────────────────────────────────────────

export async function getNavigationItemsServer(): Promise<NavigationItem[]> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_NAVIGATION_ITEMS
    
    let items: any[] | null = null
    const { data: d1, error: err1 } = await c
      .from("navigation_items")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })

    if (!err1 && d1 && d1.length > 0) {
      items = d1
    } else {
      const { data: d2 } = await c
        .from("navigation_items")
        .select("*")
        .order("created_at", { ascending: true })
      if (d2 && d2.length > 0) items = d2
    }

    if (!items || items.length === 0) return DEFAULT_NAVIGATION_ITEMS

    return items.map((item: any) => ({
      ...item,
      href: item.url || item.href || "",
      url: item.url || item.href || "",
      display_order: item.sort_order ?? item.display_order ?? 0,
      is_active: item.is_visible ?? item.is_active ?? true,
    })) as NavigationItem[]
  } catch {
    return DEFAULT_NAVIGATION_ITEMS
  }
}

// ── Footer ───────────────────────────────────────────────────────────────────

export async function getFooterSectionsServer(): Promise<FooterSection[]> {
  try {
    const c = createPublicClient()
    if (!c) return DEFAULT_FOOTER_SECTIONS

    let sections: any[] | null = null
    const { data: s1, error: err1 } = await c
      .from("footer_sections")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })

    if (!err1 && s1 && s1.length > 0) {
      sections = s1
    } else {
      const { data: s2 } = await c
        .from("footer_sections")
        .select("*")
        .order("created_at", { ascending: true })
      if (s2 && s2.length > 0) sections = s2
    }

    if (!sections || sections.length === 0) return DEFAULT_FOOTER_SECTIONS

    const { data: links } = await c
      .from("footer_links")
      .select("*")
      .in("section_id", sections.map((s) => s.id))
      .order("display_order", { ascending: true })

    return sections.map((s) => ({
      ...s,
      display_order: s.sort_order ?? s.display_order ?? 0,
      is_active: s.is_visible ?? s.is_active ?? true,
      links: (links || []).filter((l) => l.section_id === s.id),
    }))
  } catch {
    return DEFAULT_FOOTER_SECTIONS
  }
}
