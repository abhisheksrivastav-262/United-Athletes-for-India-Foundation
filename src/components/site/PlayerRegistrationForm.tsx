"use client"
import { useState } from "react"

const SPORTS = [
  "Athletics", "Badminton", "Football", "Cricket", "Wrestling",
  "Boxing", "Archery", "Swimming", "Para Sports", "Other",
]

export function PlayerRegistrationForm() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", age: "", gender: "",
    sport: "", city: "", message: "",
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState("")

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setErr("")
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErr("")
    try {
      const res = await fetch("/api/player-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: form.age ? Number(form.age) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || "Submission failed. Please try again.")
        return
      }
      setDone(true)
    } catch {
      setErr("Could not connect to server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="surface-card rounded-sm p-8 text-center">
        <h3 className="text-2xl">Registration received!</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Thanks {form.name.split(" ")[0] || "champion"} — we have sent a confirmation to your email.
          Our team will contact you shortly.
        </p>
      </div>
    )
  }

  const inputCls =
    "mt-2 w-full rounded-sm border border-input bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"

  return (
    <form onSubmit={submit} className="surface-card rounded-sm p-8 space-y-5">
      <div>
        <h3 className="text-2xl">Connect as a Player</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill this form — you and our team both get an email confirmation.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Full Name *</label>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputCls} placeholder="Your name" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email *</label>
          <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls} placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Phone</label>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputCls} placeholder="+91 ..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Age</label>
            <input type="number" min={5} max={60} value={form.age} onChange={(e) => update("age", e.target.value)} className={inputCls} placeholder="16" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Gender</label>
            <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className={inputCls}>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sport *</label>
          <select required value={form.sport} onChange={(e) => update("sport", e.target.value)} className={inputCls}>
            <option value="">Select sport</option>
            {SPORTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">City</label>
          <input value={form.city} onChange={(e) => update("city", e.target.value)} className={inputCls} placeholder="Your city" />
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Message</label>
        <textarea value={form.message} onChange={(e) => update("message", e.target.value)} rows={4} className={inputCls} placeholder="Tell us about your training, achievements, needs..." />
      </div>

      {err && (
        <p className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-red-300">{err}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-sm bg-primary px-8 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-primary-foreground transition-transform duration-300 hover:-translate-y-1 disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Register as Player"}
      </button>
    </form>
  )
}
