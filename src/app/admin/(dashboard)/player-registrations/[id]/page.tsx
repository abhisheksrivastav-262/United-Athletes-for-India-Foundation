import { PageHeader } from "@/components/admin/PageHeader"
import { PlayerRegistrationManager } from "@/components/admin/player-registrations/PlayerRegistrationManager"
import { getPlayerRegistrationById } from "@/lib/cms/admin-actions"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function PlayerRegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const registration = await getPlayerRegistrationById(id)
  if (!registration) notFound()

  return (
    <div>
      <PageHeader
        title="Player Registration"
        description={`From ${registration.name}`}
        back="/admin/player-registrations"
      />
      <PlayerRegistrationManager registration={registration} />
    </div>
  )
}
