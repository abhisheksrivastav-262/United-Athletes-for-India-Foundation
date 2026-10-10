"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, Mail, Phone, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Select, Textarea } from "@/components/ui/form"
import { Card, CardHeader, CardTitle, CardBody, Badge } from "@/components/ui/admin"
import { Button } from "@/components/admin/Button"
import { toast } from "@/components/ui/toast"
import { updatePlayerRegistration, createActivityLog, getCurrentUser } from "@/lib/cms/client-actions"
import { PlayerRegistration } from "@/lib/cms/types"
import { formatDate } from "@/lib/format"

export function PlayerRegistrationManager({ registration }: { registration: PlayerRegistration }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(registration.status)
  const [adminNotes, setAdminNotes] = useState(registration.admin_notes || "")

  async function save() {
    setSaving(true)
    try {
      const { error } = await updatePlayerRegistration(registration.id, status, adminNotes.trim() || undefined)
      if (error) {
        toast.error(error)
        return
      }
      const user = await getCurrentUser()
      await createActivityLog({
        admin_user_id: user?.id || null,
        admin_email: user?.email || null,
        action: "update",
        entity_type: "player_registration",
        entity_id: registration.id,
        description: `${registration.name} → ${status}`,
      })
      toast.success("Registration updated")
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-2 sticky top-14 lg:top-0 bg-slate-50 py-3 z-10 -mt-3">
        <Link href="/admin/player-registrations" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft size={14} /> Back to registrations
        </Link>
        <Button onClick={save} variant="primary" disabled={saving}>
          <Save size={14} /> {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Player Message</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{registration.message || "—"}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
            </CardHeader>
            <CardBody>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={6}
                placeholder="Internal notes (selection, trials...)..."
                hint="Only visible to administrators."
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <Select
                label="Current Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as PlayerRegistration["status"])}
                options={[
                  { value: "new", label: "New" },
                  { value: "contacted", label: "Contacted" },
                  { value: "selected", label: "Selected" },
                  { value: "rejected", label: "Rejected" },
                ]}
              />
              <div>
                <Badge variant={status === "new" ? "warning" : status === "selected" ? "success" : "info"}>
                  {status}
                </Badge>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Player Details</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Name</p>
                <p className="font-medium text-slate-900">{registration.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Email</p>
                <a href={`mailto:${registration.email}`} className="inline-flex items-center gap-1.5 text-[#0B1D3A] hover:underline">
                  <Mail size={14} /> {registration.email}
                </a>
              </div>
              {registration.phone && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Phone</p>
                  <a href={`tel:${registration.phone}`} className="inline-flex items-center gap-1.5 text-[#0B1D3A] hover:underline">
                    <Phone size={14} /> {registration.phone}
                  </a>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Age</p>
                  <p className="font-medium">{registration.age ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Gender</p>
                  <p className="font-medium">{registration.gender || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Sport</p>
                  <p className="font-medium">{registration.sport || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">City</p>
                  <p className="font-medium">{registration.city || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Received</p>
                <p className="text-slate-700">{formatDate(registration.created_at, "datetime")}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
