// ============================================================================
// Unified CMS data facade.
//
// Public pages import from ./server (read-only, published only).
// Admin pages/components import from here. Client components resolve to the
// browser client (./client-actions); server components resolve to the
// cookie-bound SSR client (./admin-actions) — same function names, same
// { data, error } contract, so "admin data = Supabase data = public data".
// ============================================================================

export {
  // current user / activity
  getCurrentUser,
  createActivityLog,

  // site settings
  updateSiteSettings,

  // articles
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
  archiveArticle,

  // categories
  createCategory,
  updateCategory,
  deleteCategory,
  createArticleCategory,
  updateArticleCategory,
  deleteArticleCategory,

  // events
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,

  // programmes
  createProgramme,
  updateProgramme,
  deleteProgramme,
  publishProgramme,
  unpublishProgramme,

  // athletes
  createAthlete,
  updateAthlete,
  deleteAthlete,
  publishAthlete,
  unpublishAthlete,

  // teams
  createTeam,
  updateTeam,
  deleteTeam,
  publishTeam,
  unpublishTeam,

  // team roster
  addTeamAthlete,
  removeTeamAthlete,

  // testimonials
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  publishTestimonial,
  unpublishTestimonial,

  // gallery
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  publishGalleryItem,
  unpublishGalleryItem,

  // cms pages
  createCmsPage,
  updateCmsPage,
  deleteCmsPage,

  // navigation
  createNavigationItem,
  updateNavigationItem,
  deleteNavigationItem,

  // footer
  createFooterSection,
  updateFooterSection,
  deleteFooterSection,
  createFooterLink,
  updateFooterLink,
  deleteFooterLink,

  // homepage
  updateHomepageHero,
  updateHomepageSection,
  createHomepageSection,
  deleteHomepageSection,

  // enquiries
  updateEnquiry,
  deleteEnquiry,

  // case studies
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,

  // player registrations
  updatePlayerRegistration,
  deletePlayerRegistration,

  // admin users
  updateAdminUser,
  deleteAdminUser,
} from "./client-actions"

export {
  getCurrentUser as getCurrentUserServer,
  createActivityLog as createActivityLogServer,
  getSiteSettings,
  getArticleById,
  getArticles,
  getAllArticles,
  getCategories,
  getArticleCategories,
  getEventById,
  getEvents,
  getAllEvents,
  getProgrammeById,
  getProgrammes,
  getAllProgrammes,
  getAthleteById,
  getAthletes,
  getAllAthletes,
  getTeamById,
  getTeams,
  getAllTeams,
  getTeamAthletes,
  getTestimonialById,
  getTestimonials,
  getAllTestimonials,
  getGalleryItemById,
  getGalleryItems,
  getAllGalleryItems,
  getCmsPageById,
  getAllCmsPages,
  getAllNavigationItems,
  getAllFooterSections,
  getFooterLinks,
  getHomepageHero,
  getHomepageSections,
  getHomepageFeatured,
  getEnquiries,
  getEnquiryById,
  getCaseStudyById,
  getCaseStudies,
  getAllCaseStudies,
  getPlayerRegistrations,
  getPlayerRegistrationById,
  getAllAdminProfiles,
  getActivityLogs,
  getDashboardStats,
  uploadMedia,
  deleteMedia,
  updateHomepageSectionOrder,
  updateHomepageFeatured,
  createHomepageFeatured,
  deleteHomepageFeatured,
  updateNavigationOrder,
} from "./admin-actions"

// Convenience aliases matching the names used by admin screens.
export {
  createCmsPage as createPage,
  updateCmsPage as updatePage,
  deleteCmsPage as deletePage,
} from "./client-actions"

export {
  getAllCmsPages as getPages,
  getCmsPageById as getPageById,
} from "./admin-actions"

export type {
  Article,
  ArticleCategory,
  Category,
  SiteSettings,
  NavigationItem,
  Event,
  Programme,
  Athlete,
  Team,
  Testimonial,
  GalleryItem,
  CaseStudy,
  PlayerRegistration,
  HomepageHero,
  HomepageSection,
  HomepageFeatured,
  Enquiry,
  AdminUser,
  AdminProfile,
  CmsPage,
  Page,
  FooterSection,
  FooterLink,
  DashboardStats,
} from "./types"
