import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { getCaseStudiesServer } from '@/lib/cms/server'
import PublicShell from '@/components/site/PublicShell'
import { PageHero } from '@/components/site/PageHero'
import { Reveal } from '@/components/site/Reveal'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Case Studies',
  description: 'Real stories of athlete journeys supported by UnitedAthletes for India Foundation.',
}

export default async function CaseStudiesPage() {
  const items = await getCaseStudiesServer({ status: 'published' })

  return (
    <PublicShell>
      <PageHero
        eyebrow="Case Studies"
        title={<>Stories of <span className="text-gold-gradient">impact</span></>}
        subtitle="Real journeys of athletes and communities supported by the foundation — added gradually as they become available."
        image="/assets/support.jpg"
        alt="Athletes training together"
      />

      <section className="mx-auto max-w-7xl px-5 py-24">
        {items.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">
            Case studies are on their way. Check back soon!
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((c, i) => (
              <Reveal key={c.id} delay={i * 90}>
                <Link
                  href={`/case-studies/${c.slug}`}
                  className="surface-card group flex h-full flex-col rounded-sm p-8 transition-transform duration-500 hover:-translate-y-2"
                >
                  <h2 className="text-2xl leading-tight">{c.title}</h2>
                  {c.location && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      {c.location}
                    </p>
                  )}
                  {c.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {c.excerpt}
                    </p>
                  )}
                  <span className="mt-auto inline-flex items-center gap-2 pt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
                    Read story
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  )
}
