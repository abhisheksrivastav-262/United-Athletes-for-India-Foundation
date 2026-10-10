import { Card, Table, THead, TBody, TR, TH, TD, Badge, EmptyState } from "@/components/ui/admin"
import { PageHeader, AddButton } from "@/components/admin/PageHeader"
import { ActionButtons } from "@/components/admin/ActionButtons"
import { getAllCaseStudies } from "@/lib/cms/admin-actions"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function CaseStudiesPage() {
  const items = await getAllCaseStudies()

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Case Studies"
        description="Insert and edit case studies shown on the website."
        action={<AddButton href="/admin/case-studies/new" label="New Case Study" />}
      />

      <Card>
        {items.length === 0 ? (
          <EmptyState
            title="No case studies yet"
            description="Add your first case study."
            action={<AddButton href="/admin/case-studies/new" label="New Case Study" />}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Title</TH>
                <TH>Location</TH>
                <TH>Status</TH>
                <TH>Order</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((c: { id: string; title: string; location?: string | null; status: string; display_order: number; slug: string }) => (
                <TR key={c.id}>
                  <TD>
                    <Link href={`/admin/case-studies/${c.id}`} className="font-medium text-slate-900 hover:text-[#0B1D3A]">
                      {c.title}
                    </Link>
                  </TD>
                  <TD className="text-xs">{c.location || "—"}</TD>
                  <TD>
                    <Badge variant={c.status === "published" ? "success" : c.status === "draft" ? "warning" : "default"}>
                      {c.status}
                    </Badge>
                  </TD>
                  <TD className="text-xs">{c.display_order}</TD>
                  <TD>
                    <ActionButtons
                      id={c.id}
                      title={c.title}
                      editHref={`/admin/case-studies/${c.id}`}
                      viewHref={`/case-studies/${c.slug}`}
                      entityType="case-study"
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
