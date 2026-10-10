"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2, Image as ImageIcon } from "lucide-react"
import { Card } from "@/components/ui/admin"
import { AddButton } from "@/components/admin/PageHeader"
import { useConfirm } from "@/components/admin/ConfirmDialog"
import { toast } from "@/components/ui/toast"
import { deleteGalleryItem, createActivityLog, getCurrentUser } from "@/lib/cms/client-actions"
import { GalleryItem } from "@/lib/cms/types"
import Link from "next/link"

export function MediaGrid({ items }: { items: GalleryItem[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()

  async function remove(item: GalleryItem) {
    const ok = await confirm({
      title: "Delete media",
      message: `Delete "${item.title || "Untitled"}"? This cannot be undone.`,
      variant: "danger",
      confirmText: "Delete",
    })
    if (!ok) return
    setBusy(item.id)
    try {
      const { error } = await deleteGalleryItem(item.id)
      if (error) {
        toast.error(error)
        return
      }
    } finally {
      setBusy(null)
    }
    const user = await getCurrentUser()
    await createActivityLog({
      admin_user_id: user?.id || null,
      admin_email: user?.email || null,
      action: "delete",
      entity_type: "media",
      entity_id: item.id,
      description: item.title || "Untitled",
    })
    toast.success("Media deleted")
    router.refresh()
  }

  if (items.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <ImageIcon size={36} className="mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-semibold text-slate-900">No media yet</h3>
          <p className="text-sm text-slate-500 mt-1">Upload images to your gallery.</p>
          <div className="mt-4">
            <AddButton href="/admin/gallery/new" label="Upload Media" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <div key={item.id} className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt={item.title || "Media"}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <Link
                    href={`/admin/gallery/${item.id}`}
                    className="h-9 w-9 grid place-items-center rounded-lg bg-white text-slate-700 hover:bg-slate-100"
                    title="Edit"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => remove(item)}
                    disabled={busy === item.id}
                    className="h-9 w-9 grid place-items-center rounded-lg bg-white text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="Delete"
                  >
                    {busy === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium text-slate-900 truncate">{item.title || "Untitled"}</p>
              {item.category && <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.category}</p>}
            </div>
          </div>
        ))}
      </div>
      {dialog}
    </>
  )
}