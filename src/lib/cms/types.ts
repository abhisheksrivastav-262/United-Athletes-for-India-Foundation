// Central type definitions for the United Sports CMS.
// Both data.ts and admin-actions.ts import from here.

export type ArticleCategory = {
  id: string; name: string; slug: string; description: string | null
  created_at: string; updated_at: string
}

export type SiteSettings = {
  id: string; site_name: string; logo_url: string | null; favicon_url: string | null
  description: string | null; email: string | null; phone: string | null; address: string | null
  whatsapp: string | null; facebook_url: string | null; instagram_url: string | null
  youtube_url: string | null; twitter_url: string | null; linkedin_url: string | null
  footer_text: string | null; primary_color: string | null; secondary_color: string | null
  created_at: string; updated_at: string
}

export type NavigationItem = {
  id: string; label: string; url: string; href: string; type: 'header' | 'footer'
  target: '_self' | '_blank'; display_order: number; is_active: boolean; is_external: boolean
  parent_id: string | null; created_at: string; updated_at: string
}

export type Article = {
  id: string; title: string; slug: string; excerpt: string | null; content: string | null
  featured_image: string | null; author_id: string | null; author: string | null
  category_id: string | null
  category?: { name: string; slug: string } | null
  status: 'draft' | 'published' | 'archived'; published_at: string | null
  meta_title: string | null; meta_description: string | null
  og_title: string | null; og_description: string | null; og_image: string | null
  canonical_url: string | null; created_at: string; updated_at: string
}

export type Category = {
  id: string; name: string; slug: string; description: string | null
  created_at: string; updated_at: string
}

export type Event = {
  id: string; title: string; slug: string; description: string | null
  event_date: string | null; start_time: string | null; end_time: string | null
  location: string | null; featured_image: string | null; registration_url: string | null
  status: 'upcoming' | 'live' | 'completed' | 'cancelled' | 'draft' | 'published' | 'archived'; created_at: string; updated_at: string
}

export type Programme = {
  id: string; title: string; slug: string; description: string | null
  image: string | null; content: string | null
  status: 'draft' | 'published' | 'archived'; display_order: number
  created_at: string; updated_at: string
}

export type Athlete = {
  id: string; name: string; slug: string; photo: string | null; sport: string | null
  category: string | null; biography: string | null; achievements: string | null
  profile_details: string | null; nationality: string | null
  status: 'active' | 'inactive' | 'retired' | 'draft' | 'published' | 'archived'; display_order: number
  created_at: string; updated_at: string
}

export type Team = {
  id: string; name: string; slug: string; sport: string | null; description: string | null
  logo: string | null; cover_image: string | null
  status: 'active' | 'inactive' | 'draft' | 'published' | 'archived'; display_order: number
  created_at: string; updated_at: string
}

export type Testimonial = {
  id: string; name: string; role: string | null; photo: string | null; quote: string | null
  status: 'active' | 'inactive' | 'archived' | 'draft' | 'published'; display_order: number
  created_at: string; updated_at: string
  slug?: string | null
}

export type GalleryItem = {
  id: string; title: string; image_url: string; description: string | null
  category: string | null; alt_text: string | null; slug?: string | null
  status: 'active' | 'inactive' | 'archived' | 'draft' | 'published'; display_order: number
  created_at: string; updated_at: string
}

export type HomepageHero = {
  id: string; heading: string; subheading: string | null; button_text: string | null
  button_url: string | null; background_image: string | null; overlay_opacity: number
  is_enabled: boolean; display_order: number
  secondary_button_text?: string | null; secondary_button_url?: string | null
  stat_1_val?: string | null; stat_1_lbl?: string | null
  stat_2_val?: string | null; stat_2_lbl?: string | null
  stat_3_val?: string | null; stat_3_lbl?: string | null
}

export type HomepageSection = {
  id: string; section_key: string; section_type: string | null; title: string | null; subtitle: string | null
  description: string | null; content: Record<string, unknown> | null
  is_visible: boolean; display_order: number; created_at: string; updated_at: string
}

export type HomepageFeatured = {
  id: string; section_id: string
  content_type: 'programmes' | 'athletes' | 'events' | 'articles' | 'testimonials' | 'gallery'
  content_ids: string[]; display_order: number
}

export type Enquiry = {
  id: string; name: string; email: string; phone: string | null; subject: string | null
  message: string; status: 'new' | 'contacted' | 'resolved'; admin_notes: string | null
  created_at: string; updated_at: string
}

export type CaseStudy = {
  id: string; title: string; slug: string; excerpt: string | null; content: string | null
  featured_image: string | null; location: string | null
  status: 'draft' | 'published' | 'archived'; display_order: number
  published_at: string | null; created_at: string; updated_at: string
}

export type PlayerRegistration = {
  id: string; name: string; email: string; phone: string | null
  age: number | null; gender: string | null; sport: string | null; city: string | null
  message: string | null; status: 'new' | 'contacted' | 'selected' | 'rejected'
  admin_notes: string | null; created_at: string; updated_at: string
}

export type AdminUser = {
  id: string; user_id: string; name: string; email: string
  role: 'super_admin' | 'admin' | 'editor'; is_active: boolean
  created_at: string; updated_at: string
}

export type CmsPage = {
  id: string; title: string; slug: string; content: string | null; excerpt: string | null
  featured_image: string | null; status: 'draft' | 'published' | 'archived'
  meta_title: string | null; meta_description: string | null
  og_title: string | null; og_description: string | null; og_image: string | null
  canonical_url: string | null; created_at: string; updated_at: string
}

export type AdminProfile = {
  id: string; user_id: string; email: string | null; full_name: string | null
  role: 'super_admin' | 'admin' | 'editor'; is_active: boolean
  created_at: string; updated_at: string
}

export type FooterSection = {
  id: string; title: string; display_order: number; is_active: boolean
  created_at: string; updated_at: string
  links?: FooterLink[]
}

export type FooterLink = {
  id: string; section_id: string; label: string; href: string; is_external: boolean
  display_order: number; created_at: string; updated_at: string
}

export type Page = {
  id: string; title: string; slug: string; content: string | null; excerpt: string | null
  featured_image: string | null; status: 'draft' | 'published' | 'archived'
  meta_title: string | null; meta_description: string | null
  og_title: string | null; og_description: string | null; og_image: string | null
  canonical_url: string | null; created_at: string; updated_at: string
}

export type DashboardStats = {
  articles: number; publishedArticles: number; draftArticles: number
  events: number; programmes: number; athletes: number; teams: number
  gallery: number; testimonials: number; enquiries: number; users: number
  caseStudies: number; playerRegistrations: number; newPlayerRegistrations: number
  recentArticles: Article[]; recentEvents: Event[]; recentEnquiries: Enquiry[]
}

// Status aliases for compatibility
export type AdminRole = "super_admin" | "admin" | "editor"

export type NavigationItemType = NavigationItem
export type CaseStudyType = CaseStudy
export type PlayerRegistrationType = PlayerRegistration
export type ArticleType = Article
export type CategoryType = Category
export type EventType = Event
export type ProgrammeType = Programme
export type AthleteType = Athlete
export type TeamType = Team
export type TestimonialType = Testimonial
export type GalleryItemType = GalleryItem
export type HomepageSectionType = HomepageSection
export type EnquiryType = Enquiry
export type AdminUserType = AdminUser
export type RazorpaySettings = {
  key_id: string
  key_secret: string
  is_enabled: boolean
  mode: "test" | "live"
  currency: string
  min_amount: number
  suggested_amounts: number[]
  tax_benefit_info?: string
  organization_name?: string
  notes?: string
}

export type DonationRecord = {
  id: string
  donor_name: string
  donor_email: string
  donor_phone?: string | null
  pan_number?: string | null
  amount: number
  currency: string
  purpose: string
  message?: string | null
  is_anonymous: boolean
  status: "pending" | "paid" | "failed"
  razorpay_order_id?: string | null
  razorpay_payment_id?: string | null
  razorpay_signature?: string | null
  payment_method?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export type CmsPageType = CmsPage
export type SiteSettingsType = SiteSettings
export type RazorpaySettingsType = RazorpaySettings
export type DonationRecordType = DonationRecord
