"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save } from "lucide-react"
import { Input, Textarea, Select } from "@/components/ui/form"
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/admin"
import { Button } from "@/components/admin/Button"
import { ImageUploader } from "@/components/admin/ImageUploader"
import { toast } from "@/components/ui/toast"
import { createCaseStudy, updateCaseStudy, createActivityLog, getCurrentUser } from "@/lib/cms/client-actions"
import { slugify } from "@/lib/utils"
import { CaseStudy } from "@/lib/cms/types"

export function CaseStudyForm({ caseStudy }: { caseStudy: CaseStudy | null }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: caseStudy?.title || "",
    slug: caseStudy?.slug || "",
    excerpt: caseStudy?.excerpt || "",
    content: caseStudy?.content || "",
    featured_image: caseStudy?.featured_image || null,
    location: caseStudy?.location || "",
    status: caseStudy?.status || "draft",
    display_order: caseStudy?.display_order ?? 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!caseStudy && form.title && !form.slug) {
      setForm((f) => ({ ...f, slug: slugify(form.title) }))
    }
  }, [form.title, caseStudy, form.slug])

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: "" }))
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = "Title is required"
    if (!form.slug.trim()) errs.slug = "Slug is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function save() {
    if (!validate()) {
      toast.error("Please fix the errors before saving")
      return
    }
    setSaving(true)
    try {
      const user = await getCurrentUser()
      const payload = {
        ...form,
        excerpt: form.excerpt || null,
        content: form.content || null,
        featured_image: form.featured_image || null,
        location: form.location || null,
        published_at: form.status === "published" ? new Date().toISOString() : null,
      }
      if (caseStudy) {
        const { error } = await updateCaseStudy(caseStudy.id, payload)
        if (error) {
          toast.error(error)
          return
        }
        await createActivityLog({
          admin_user_id: user?.id || null,
          admin_email: user?.email || null,
          action: "update",
          entity_type: "case_study",
          entity_id: caseStudy.id,
          description: form.title,
        })
        toast.success("Case study updated")
        router.push("/admin/case-studies")
      } else {
        const { data, error } = await createCaseStudy(payload)
        if (error) {
          toast.error(error)
          return
        }
        await createActivityLog({
          admin_user_id: user?.id || null,
          admin_email: user?.email || null,
          action: "create",
          entity_type: "case_study",
          entity_id: data?.id || null,
          description: form.title,
        })
        toast.success("Case study created")
        router.push("/admin/case-studies")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2 sticky top-14 lg:top-0 bg-slate-50 py-3 z-10 -mt-3">
        <Button onClick={save} variant="primary" disabled={saving}>
          <Save size={14} /> {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Case Study Details</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                error={errors.title}
                required
                placeholder="e.g. From village ground to state podium"
              />
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => update("slug", e.target.value)}
                error={errors.slug}
                hint="URL-friendly identifier"
                required
              />
              <Input
                label="Location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. Nashik, Maharashtra"
              />
              <Textarea
                label="Excerpt"
                value={form.excerpt}
                onChange={(e) => update("excerpt", e.target.value)}
                rows={3}
                placeholder="Short summary shown on the listing page..."
              />
              <Textarea
                label="Content"
                value={form.content}
                onChange={(e) => update("content", e.target.value)}
                rows={12}
                placeholder="Full case study story (HTML allowed)..."
                hint="You can paste formatted HTML here."
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => update("status", e.target.value as never)}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                  { value: "archived", label: "Archived" },
                ]}
              />
              <Input
                label="Display Order"
                type="number"
                value={form.display_order}
                onChange={(e) => update("display_order", parseInt(e.target.value) || 0)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardBody>
              <ImageUploader
                value={form.featured_image}
                onChange={(url) => update("featured_image", url)}
                folder="case-studies"
                aspectRatio="wide"
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
