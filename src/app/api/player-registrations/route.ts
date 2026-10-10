import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendPlayerWelcomeEmail,
  sendPlayerAdminNotifyEmail,
  getAdminRecipient,
} from '@/lib/email'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, age, gender, sport, city, message } = body as {
      name?: string
      email?: string
      phone?: string
      age?: number | string
      gender?: string
      sport?: string
      city?: string
      message?: string
    }

    const errors: string[] = []
    if (!name || !name.trim()) errors.push('Name is required')
    if (!email || !EMAIL_RE.test(email)) errors.push('A valid email is required')
    if (!sport || !sport.trim()) errors.push('Sport is required')
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 })
    }

    const parsedAge =
      age === undefined || age === null || age === ''
        ? null
        : Number.isNaN(Number(age))
          ? null
          : Number(age)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('player_registrations')
      .insert({
        name: name!.trim(),
        email: email!.trim(),
        phone: phone?.trim() || null,
        age: parsedAge,
        gender: gender?.trim() || null,
        sport: sport!.trim(),
        city: city?.trim() || null,
        message: message?.trim() || null,
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      console.error('[api/player-registrations] insert failed:', error.message)
      return NextResponse.json({ error: 'Could not submit your registration. Please try again.' }, { status: 500 })
    }

    // Critical: email to player + to us. Never block the response on email failure.
    try {
      await sendPlayerWelcomeEmail(data.email, data.name, data.sport)
      const adminEmail = getAdminRecipient()
      if (adminEmail) {
        await sendPlayerAdminNotifyEmail(adminEmail, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          age: data.age,
          gender: data.gender,
          sport: data.sport,
          city: data.city,
          message: data.message,
        })
      }
    } catch (e) {
      console.error('[api/player-registrations] email failed:', e)
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('[api/player-registrations] unexpected error:', err)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
