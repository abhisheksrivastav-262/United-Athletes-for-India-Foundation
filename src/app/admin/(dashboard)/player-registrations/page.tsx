import { Card, Table, THead, TBody, TR, TH, TD, Badge, EmptyState } from "@/components/ui/admin"
import { PageHeader } from "@/components/admin/PageHeader"
import { ActionButtons } from "@/components/admin/ActionButtons"
import { getPlayerRegistrations } from "@/lib/cms/admin-actions"
import { formatDate } from "@/lib/format"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function PlayerRegistrationsPage() {
  const regs = await getPlayerRegistrations()

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Player Registrations"
        description="Players registered through the website. Payment/donation details are under Donations."
      />

      <Card>
        {regs.length === 0 ? (
          <EmptyState
            title="No registrations yet"
            description="Player connect-form submissions will appear here."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Player</TH>
                <TH>Sport / City</TH>
                <TH>Status</TH>
                <TH>Date</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {regs.map((r: { id: string; name: string; email: string; phone?: string | null; sport?: string | null; city?: string | null; status: string; created_at: string }) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/admin/player-registrations/${r.id}`} className="font-medium text-slate-900 hover:text-[#0B1D3A] block">
                      {r.name}
                    </Link>
                    <a href={`mailto:${r.email}`} className="text-xs text-slate-500 hover:text-[#0B1D3A]">
                      {r.email}
                    </a>
                  </TD>
                  <TD className="text-xs">{[r.sport, r.city].filter(Boolean).join(" • ") || "—"}</TD>
                  <TD>
                    <Badge variant={r.status === "new" ? "warning" : r.status === "selected" ? "success" : "info"}>
                      {r.status}
                    </Badge>
                  </TD>
                  <TD className="text-xs text-slate-500">{formatDate(r.created_at, "datetime")}</TD>
                  <TD>
                    <ActionButtons
                      id={r.id}
                      title={r.name}
                      editHref={`/admin/player-registrations/${r.id}`}
                      entityType="player-registration"
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
