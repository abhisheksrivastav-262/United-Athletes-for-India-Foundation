"use client"
import { Edit, Trash2, Eye, Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useConfirm } from "@/components/admin/ConfirmDialog"
import { toast } from "@/components/ui/toast"
import {
  deleteArticle,
  deleteCategory,
  deleteEvent,
  deleteProgramme,
  deleteAthlete,
  deleteTeam,
  deleteTestimonial,
  deleteGalleryItem,
  deleteCmsPage,
  deleteCaseStudy,
  deleteEnquiry,
  deletePlayerRegistration,
  createActivityLog,
  getCurrentUser,
} from "@/lib/cms/client-actions"

interface ActionButtonsProps {
  id: string
  title: string
  editHref: string
  viewHref?: string | null
  onDelete?: () => Promise<{ error: string | null } | void>
  entityType: string
}

async function performDelete(entityType: string, id: string): Promise<{ error: string | null }> {
  switch (entityType.toLowerCase()) {
    case "page":
      return deleteCmsPage(id)
    case "programme":
    case "program":
      return deleteProgramme(id)
    case "event":
      return deleteEvent(id)
    case "athlete":
      return deleteAthlete(id)
    case "team":
      return deleteTeam(id)
    case "article":
      return deleteArticle(id)
    case "category":
    case "article-category":
      return deleteCategory(id)
    case "gallery":
    case "gallery item":
      return deleteGalleryItem(id)
    case "testimonial":
      return deleteTestimonial(id)
    case "case-study":
    case "case study":
    case "casestudy":
      return deleteCaseStudy(id)
    case "enquiry":
      return deleteEnquiry(id)
    case "player-registration":
    case "player registration":
    case "registration":
      return deletePlayerRegistration(id)
    default:
      return { error: `Unsupported entity type: ${entityType}` }
  }
}

export function ActionButtons({ id, title, editHref, viewHref, onDelete, entityType }: ActionButtonsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { confirm, dialog } = useConfirm()

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete ${entityType}`,
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      variant: "danger",
      confirmText: "Delete",
    })
    if (!ok) return
    setLoading(true)
    try {
      let error: string | null = null
      if (onDelete) {
        const result = await onDelete()
        error = result && typeof result === "object" && "error" in result ? result.error : null
      } else {
        const result = await performDelete(entityType, id)
        error = result.error
      }
      if (error) {
        toast.error(error)
        return
      }
      const user = await getCurrentUser()
      await createActivityLog({
        admin_user_id: user?.id || null,
        admin_email: user?.email || null,
        action: "delete",
        entity_type: entityType,
        entity_id: id,
        description: title,
      })
      toast.success(`${entityType} deleted`)
      router.refresh()
    } catch {
      toast.error(`Failed to delete ${entityType}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {viewHref && (
          <a
            href={viewHref}
            target="_blank"
            rel="noreferrer"
            className="h-8 w-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
            title="View on website"
          >
            <Eye size={14} />
          </a>
        )}
        <a
          href={editHref}
          className="h-8 w-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
          title="Edit"
        >
          <Edit size={14} />
        </a>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="h-8 w-8 grid place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          title="Delete"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
      {dialog}
    </>
  )
}
