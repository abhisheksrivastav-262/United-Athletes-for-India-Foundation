import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { getCaseStudiesServer, getCaseStudyBySlugServer } from '@/lib/cms/server'
import PublicShell from '@/components/site/PublicShell'
import { PageHero } from '@/components/site/PageHero'
import { Reveal } from '@/components/site/Reveal'

export const revalidate = 60

export async function generateStaticParams() {
  const items = await getCaseStudiesServer({ status: 'published' })
  return items.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = await getCaseStudyBySlugServer(slug)
  return {
    title: c?.title || 'Case Study',
    description: c?.excerpt || 'Athlete impact story from UnitedAthletes for India Foundation.',
  }
}

export default async function CaseStudyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = await getCaseStudyBySlugServer(slug)
  if (!c) notFound()

  return (
    <PublicShell>
      <PageHero
        eyebrow={c.location || 'Case Study'}
        title={<>{c.title}</>}
        subtitle={c.excerpt || undefined}
        image={c.featured_image || '/assets/support.jpg'}
        alt={c.title}
      />

      <section className="mx-auto max-w-4xl px-5 py-16">
        <Reveal>
          <Link href="/case-studies" className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> All case studies
          </Link>
          {c.location && (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /> {c.location}
            </p>
          )}
          {c.content && (
            <div className="cms-content mt-8" dangerouslySetInnerHTML={{ __html: c.content }} />
          )}
        </Reveal>
      </section>
    </PublicShell>
  )
}
