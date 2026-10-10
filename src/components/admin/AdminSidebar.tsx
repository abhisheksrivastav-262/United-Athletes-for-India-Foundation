"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Home,
  FileText,
  Newspaper,
  Trophy,
  Calendar,
  Users,
  MessageSquareQuote,
  Images,
  Mail,
  Settings,
  Navigation,
  PanelBottom,
  Lock,
  Activity,
  ImageIcon,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Tag,
  FileBox,
  BookOpen,
  HeartHandshake,
  CreditCard,
  IndianRupee,
  ClipboardList,
  FolderKanban,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AdminProfile } from "@/lib/cms/types"

interface NavItem {
  label: string
  href?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  children?: NavItem[]
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    label: "Website",
    icon: Home,
    children: [
      { label: "Homepage", href: "/admin/homepage", icon: Home },
      { label: "Pages (About, Contact, etc.)", href: "/admin/pages", icon: FileBox },
      { label: "Site Settings", href: "/admin/settings", icon: Settings },
      { label: "Navigation", href: "/admin/navigation", icon: Navigation },
      { label: "Footer", href: "/admin/footer", icon: PanelBottom },
    ],
  },
  {
    label: "Donations",
    icon: HeartHandshake,
    children: [
      { label: "All Donations", href: "/admin/donations", icon: IndianRupee },
      { label: "Payment Gateway", href: "/admin/donations/settings", icon: CreditCard },
    ],
  },
  {
    label: "Content",
    icon: FileText,
    children: [
      { label: "Popular Games & Sports", href: "/admin/athletes", icon: Trophy },
      { label: "Programmes", href: "/admin/programmes", icon: BookOpen },
      { label: "Events & Meets", href: "/admin/events", icon: Calendar },
      { label: "Articles & News", href: "/admin/articles", icon: Newspaper },
      { label: "Information Bulletin", href: "/admin/articles", icon: Mail },
      { label: "Categories", href: "/admin/article-categories", icon: Tag },
      { label: "Case Studies", href: "/admin/case-studies", icon: FolderKanban },
      { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
      { label: "Gallery", href: "/admin/gallery", icon: Images },
      { label: "Teams & Squads", href: "/admin/teams", icon: Users },
    ],
  },
  {
    label: "Community",
    icon: Mail,
    children: [
      { label: "Enquiries", href: "/admin/enquiries", icon: Mail },
      { label: "Player Registrations", href: "/admin/player-registrations", icon: ClipboardList },
    ],
  },
  {
    label: "Media",
    icon: ImageIcon,
    children: [
      { label: "Media Library", href: "/admin/media", icon: ImageIcon },
    ],
  },
  {
    label: "Users & Security",
    icon: Lock,
    children: [
      { label: "Admin Users", href: "/admin/users", icon: Users },
      { label: "Activity Logs", href: "/admin/activity-logs", icon: Activity },
    ],
  },
]

export function AdminSidebar({ profile, email }: { profile: AdminProfile | null; email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    // Keep Website and Content open by default so Footer, Navigation, etc. are immediately visible
    const result: Record<string, boolean> = {
      Website: true,
      Content: true,
    }
    NAV_ITEMS.forEach((item) => {
      if (item.children?.some((c) => c.href && pathname.startsWith(c.href))) {
        result[item.label] = true
      }
    })
    return result
  })

  async function handleSignOut() {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
    } catch {
      // Ignore
    }
    const c = createClient()
    if (c) {
      try {
        await c.auth.signOut()
      } catch {
        // Ignore
      }
    }
    router.push("/admin/login")
    router.refresh()
  }

  function toggleSection(label: string) {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#0B1D3A] text-white flex items-center justify-between px-4 h-14 shadow-md">
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(true)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-white/10">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm">Admin Panel</span>
        </div>
        <button onClick={handleSignOut} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-white/10">
          <LogOut size={16} />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 animate-in fade-in"
          onClick={() => setOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-[#0B1D3A] text-white flex flex-col animate-in slide-in-from-left"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent
              profile={profile}
              email={email}
              expanded={expanded}
              toggleSection={toggleSection}
              isActive={isActive}
              onNavigate={() => setOpen(false)}
              onSignOut={handleSignOut}
              onClose={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0B1D3A] text-white flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <SidebarContent
          profile={profile}
          email={email}
          expanded={expanded}
          toggleSection={toggleSection}
          isActive={isActive}
          onNavigate={() => {}}
          onSignOut={handleSignOut}
          onClose={() => {}}
        />
      </aside>
    </>
  )
}

function SidebarContent({
  profile,
  email,
  expanded,
  toggleSection,
  isActive,
  onNavigate,
  onSignOut,
  onClose,
}: {
  profile: AdminProfile | null
  email: string
  expanded: Record<string, boolean>
  toggleSection: (label: string) => void
  isActive: (href: string) => boolean
  onNavigate: () => void
  onSignOut: () => void
  onClose: () => void
}) {
  return (
    <>
      <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#C9A227] flex items-center justify-center text-[#0B1D3A] font-bold text-lg">U</div>
          <div>
            <div className="font-bold text-sm tracking-tight">United Sports</div>
            <div className="text-[10px] text-slate-400 tracking-wider uppercase">Admin CMS</div>
          </div>
        </Link>
        <button onClick={onClose} className="lg:hidden h-8 w-8 grid place-items-center rounded-lg hover:bg-white/10">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          if (!item.children) {
            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5",
                  isActive(item.href!)
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            )
          }
          const isOpen = expanded[item.label]
          const hasActiveChild = item.children.some((c) => isActive(c.href!))
          return (
            <div key={item.label} className="mb-1">
              <button
                onClick={() => toggleSection(item.label)}
                className={cn(
                  "w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  hasActiveChild ? "text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <item.icon size={16} />
                  {item.label}
                </span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isOpen && (
                <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href!}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                        isActive(child.href!)
                          ? "bg-[#C9A227] text-[#0B1D3A] font-semibold"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <child.icon size={14} />
                      <span>{child.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0">
        <div className="px-3 py-2.5 rounded-lg bg-white/5">
          <div className="text-xs text-slate-400">Signed in as</div>
          <div className="text-sm font-medium truncate" title={email}>{email}</div>
          {profile && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#C9A227] text-[#0B1D3A] font-bold">
                {profile.role}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onSignOut}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
        <Link
          href="/"
          target="_blank"
          className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          View Website →
        </Link>
      </div>
    </>
  )
}