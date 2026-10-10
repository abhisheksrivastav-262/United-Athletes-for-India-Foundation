import nodemailer from "nodemailer"

// Gmail SMTP configuration.
// Required env:
//   GMAIL_USER          e.g. unitedathletesindia@gmail.com (the UAI Foundation sender ID)
//   GMAIL_APP_PASSWORD  16-char App Password (Google Account -> Security -> 2-Step -> App passwords)
// Optional:
//   ADMIN_NOTIFY_EMAIL  where "us" gets notified (defaults to GMAIL_USER)
//   EMAIL_FROM_NAME     defaults to "UnitedAthletes for India Foundation"

function getTransporter() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) return null
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  })
}

export function isEmailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}

export function getSender() {
  const name = process.env.EMAIL_FROM_NAME || "UnitedAthletes for India Foundation"
  const user = process.env.GMAIL_USER || "no-reply@unitedathletes.in"
  return `"${name}" <${user}>`
}

export function getAdminRecipient(fallback?: string | null) {
  return process.env.ADMIN_NOTIFY_EMAIL || fallback || process.env.GMAIL_USER || ""
}

async function send(to: string, subject: string, html: string, text?: string) {
  const transporter = getTransporter()
  if (!transporter) {
    console.warn("[email] skipped (Gmail SMTP not configured):", subject, "->", to)
    return { sent: false, reason: "not-configured" as const }
  }
  try {
    await transporter.sendMail({ from: getSender(), to, subject, html, text: text || undefined })
    return { sent: true as const }
  } catch (err) {
    console.error("[email] send failed:", err instanceof Error ? err.message : err)
    return { sent: false as const, reason: "send-failed" as const }
  }
}

const shell = (title: string, body: string) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#0B1D3A;color:#fff;padding:20px 24px">
      <div style="font-size:18px;font-weight:bold">UnitedAthletes for India Foundation</div>
      <div style="font-size:12px;color:#C9A227;letter-spacing:2px">UNITED • TRAIN • TRIUMPH</div>
    </div>
    <div style="padding:24px">
      <h2 style="margin:0 0 12px;font-size:20px;color:#0B1D3A">${title}</h2>
      ${body}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="font-size:12px;color:#6b7280">This is an automated message from UnitedAthletes for India Foundation. Reply to this email if you need help.</p>
    </div>
  </div>
`

export async function sendPlayerWelcomeEmail(to: string, name: string, sport?: string | null) {
  const subject = `We received your registration, ${name.split(" ")[0] || "Champion"}!`
  const html = shell(
    "Thanks for connecting with us!",
    `<p>Hi ${name},</p>
     <p>We have received your player registration${sport ? ` for <strong>${sport}</strong>` : ""}. Our team will review it and contact you shortly about trials, training and next steps.</p>
     <p style="font-size:14px;color:#374151">Keep training hard — we are excited to be part of your journey.</p>
     <p><strong>— Team UnitedAthletes for India Foundation</strong></p>`
  )
  return send(to, subject, html)
}

export async function sendPlayerAdminNotifyEmail(adminEmail: string, data: Record<string, unknown>) {
  const subject = `New player registration: ${String(data.name || "Unknown")} (${String(data.sport || "—")})`
  const rows = (["name", "email", "phone", "age", "gender", "sport", "city", "message"] as const)
    .map((k) => `<tr><td style="padding:6px 10px;color:#6b7280;font-size:13px">${k}</td><td style="padding:6px 10px;font-size:13px"><strong>${String(data[k] ?? "—")}</strong></td></tr>`)
    .join("")
  const html = shell(
    "New player connected",
    `<p>A new player just registered through the website:</p><table>${rows}</table>
     <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/player-registrations">Open Player Registrations dashboard</a></p>`
  )
  return send(adminEmail, subject, html)
}

export async function sendEnquiryWelcomeEmail(to: string, name: string) {
  const subject = `Thanks for reaching out, ${name.split(" ")[0] || "friend"}!`
  const html = shell(
    "Message received!",
    `<p>Hi ${name},</p><p>Thanks for contacting <strong>UnitedAthletes for India Foundation</strong>. We have received your message and will reply within 2-3 working days.</p>`
  )
  return send(to, subject, html)
}

export async function sendEnquiryAdminNotifyEmail(adminEmail: string, data: Record<string, unknown>) {
  const subject = `New enquiry: ${String(data.subject || data.name || "Website enquiry")}`
  const rows = (["name", "email", "phone", "subject", "message"] as const)
    .map((k) => `<tr><td style="padding:6px 10px;color:#6b7280;font-size:13px">${k}</td><td style="padding:6px 10px;font-size:13px"><strong>${String(data[k] ?? "—")}</strong></td></tr>`)
    .join("")
  const html = shell("New website enquiry", `<table>${rows}</table>`)
  return send(adminEmail, subject, html)
}

export async function sendDonationReceiptEmail(to: string, donorName: string, amount: number, paymentId?: string | null) {
  const subject = `Thank you for your donation of ₹${amount}!`
  const html = shell(
    "Donation received — thank you!",
    `<p>Hi ${donorName},</p>
     <p>Thank you for supporting <strong>UnitedAthletes for India Foundation</strong> with your generous donation of <strong>₹${amount}</strong>.</p>
     ${paymentId ? `<p style="font-size:13px;color:#374151">Payment ID: <code>${paymentId}</code></p>` : ""}
     <p style="font-size:13px;color:#374151">80G receipt details will be shared separately. Keep this email for your records.</p>`
  )
  return send(to, subject, html)
}
