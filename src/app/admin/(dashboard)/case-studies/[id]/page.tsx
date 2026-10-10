import { PageHeader } from "@/components/admin/PageHeader"
import { CaseStudyForm } from "@/components/admin/case-studies/CaseStudyForm"
import { getCaseStudyById } from "@/lib/cms/admin-actions"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function CaseStudyEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isNew = id === "new"
  const caseStudy = isNew ? null : await getCaseStudyById(id)
  if (!isNew && !caseStudy) notFound()

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={isNew ? "New Case Study" : "Edit Case Study"}
        back="/admin/case-studies"
      />
      <CaseStudyForm caseStudy={caseStudy} />
    </div>
  )
}
