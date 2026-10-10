import Link from "next/link"
import { ArrowRight, Building2, Dumbbell, HeartHandshake, Landmark, Users } from "lucide-react"

import { getPageBySlugServer } from "@/lib/cms/server"
import PublicShell from "@/components/site/PublicShell"
import { PageHero } from "@/components/site/PageHero"
import { Reveal } from "@/components/site/Reveal"
import { PlayerRegistrationForm } from "@/components/site/PlayerRegistrationForm"

export const revalidate = 60

export async function generateMetadata() {
  const page = await getPageBySlugServer("get-involved")
  return {
    title: page?.meta_title || "Get Involved",
    description:
      page?.meta_description ||
      "Support athlete development, provide sports equipment, back facilities, partner with us, or support an athlete directly.",
  }
}

const ways = [
  { icon: HeartHandshake, title: "Support Athlete Development", text: "Help athletes access the resources, opportunities and support they need to continue their sporting journey." },
  { icon: Dumbbell, title: "Provide Sports Equipment", text: "Contribute sports equipment and resources that can directly support athletes and sporting initiatives." },
  { icon: Landmark, title: "Support Sports Facilities", text: "Help create better access to quality sports facilities and training environments." },
  { icon: Building2, title: "Partner With Us", text: "Organisations and businesses can collaborate with UnitedAthletes to support athlete-focused initiatives and sports development programmes." },
  { icon: Users, title: "Support an Athlete", text: "Help talented athletes overcome resource limitations and continue working toward their sporting goals." },
]

export default async function GetInvolvedPage() {
  const page = await getPageBySlugServer("get-involved")

  let parsed: Record<string, any> = {}
  let isHtmlContent = false
  if (typeof page?.content === "string" && page.content.trim()) {
    try {
      parsed = JSON.parse(page.content)
    } catch {
      isHtmlContent = true
    }
  }

  const waysIcons = [HeartHandshake, Dumbbell, Landmark, Building2, Users]
  const rawWays = Array.isArray(parsed.ways) && parsed.ways.length > 0 ? parsed.ways : ways
  const pageWays = rawWays.map((w: any, i: number) => ({
    ...w,
    icon: waysIcons[i % waysIcons.length],
  }))

  const waysTitle = parsed.ways_title || "Choose how you want to make a difference"
  const waysEyebrow = parsed.ways_eyebrow || "Ways to Support"
  const donationTitle = parsed.donation_title || "Donate to Athletes"
  const donationDesc = parsed.donation_desc || "Fund training, gear, nutrition, and tournament travel via Razorpay. 80G tax benefit eligible."
  const bannerHeading = parsed.banner_heading || "Every contribution becomes"
  const bannerHighlight = parsed.banner_highlight || "training time, gear, and a chance to compete."

  return (
    <PublicShell>
      <PageHero
        eyebrow={page?.excerpt || "Get Involved"}
        title={<>Be part of the <span className="text-gold-gradient">UnitedAthletes movement</span></>}
        subtitle={page?.excerpt || "Sport has the power to transform lives. UnitedAthletes brings together athletes, supporters, organisations, institutions and sports enthusiasts to create better opportunities for India's sporting talent."}
        image={page?.featured_image || "/assets/community.jpg"}
        alt="Athletes standing together in a huddle under golden light"
      />

      <section className="mx-auto max-w-7xl px-5 py-24">
        <Reveal>
          <p className="eyebrow">{waysEyebrow}</p>
          <div className="rule-gold mt-4" />
          <h2 className="mt-6 max-w-2xl text-4xl sm:text-5xl">
            {waysTitle}
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {pageWays.map((w: any, i: number) => (
            <Reveal key={w.title || i} delay={i * 90}>
              <article className="surface-card group h-full rounded-sm p-8 transition-transform duration-500 hover:-translate-y-2">
                <w.icon className="h-7 w-7 text-primary transition-transform duration-500 group-hover:-translate-y-1" />
                <h3 className="mt-6 text-2xl">{w.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {w.text}
                </p>
              </article>
            </Reveal>
          ))}
          <Reveal delay={450}>
            <Link
              href="/donate"
              className="flex h-full flex-col justify-between rounded-sm bg-[#C9A227] hover:bg-[#d8b43a] p-8 text-[#0B1D3A] transition-transform duration-500 hover:-translate-y-2 shadow-xl shadow-[#C9A227]/30"
            >
              <div>
                <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-navy-deep text-primary px-2.5 py-1 rounded-sm mb-3">
                  Online Contribution
                </span>
                <span className="font-display text-3xl leading-tight block">
                  {donationTitle}
                </span>
                <p className="mt-2 text-xs text-navy-deep/80 leading-relaxed font-semibold">
                  {donationDesc}
                </p>
              </div>
              <div className="flex items-center justify-between mt-6 pt-3 border-t border-navy-deep/20 font-black text-xs uppercase tracking-wider">
                <span>Donate Now</span>
                <ArrowRight className="h-5 w-5" />
              </div>
            </Link>
          </Reveal>
          <Reveal delay={520}>
            <Link
              href="/contact"
              className="flex h-full flex-col justify-between rounded-sm bg-primary p-8 text-primary-foreground transition-transform duration-500 hover:-translate-y-2"
            >
              <span className="font-display text-3xl leading-tight">
                Talk to us today
              </span>
              <ArrowRight className="mt-10 h-7 w-7" />
            </Link>
          </Reveal>
        </div>
      </section>

      {isHtmlContent && page?.content && (
        <section className="mx-auto max-w-4xl px-5 pb-24">
          <Reveal>
            <div
              className="cms-content"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </Reveal>
        </section>
      )}

      <section id="register" className="mx-auto max-w-4xl px-5 pb-24">
        <Reveal>
          <p className="eyebrow">Players</p>
          <div className="rule-gold mt-4" />
          <h2 className="mt-6 text-4xl sm:text-5xl">
            Are you a player? Connect with us
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Register here — you get a confirmation email and our team is notified instantly.
          </p>
        </Reveal>
        <div className="mt-10">
          <PlayerRegistrationForm />
        </div>
      </section>

      <section className="grain relative overflow-hidden border-y border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/equipment.jpg"
          alt="Premium sports equipment arranged on a dark navy surface"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
        <div className="relative mx-auto max-w-7xl px-5 py-24">
          <Reveal>
            <h2 className="max-w-3xl text-4xl sm:text-5xl">
              {bannerHeading}{" "}
              <span className="text-gold-gradient">{bannerHighlight}</span>
            </h2>
            <Link
              href="/contact"
              className="group mt-10 inline-flex items-center gap-3 rounded-sm bg-primary px-8 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-primary-foreground transition-transform duration-300 hover:-translate-y-1"
            >
              Start a conversation
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>
    </PublicShell>
  )
}
