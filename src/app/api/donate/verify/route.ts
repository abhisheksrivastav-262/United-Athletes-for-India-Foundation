import { NextRequest, NextResponse } from "next/server"
import { verifyDonationPayment } from "@/lib/cms/donations"
import { sendDonationReceiptEmail } from "@/lib/email"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donation_id } = body

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json(
        { success: false, error: "Missing required payment verification details" },
        { status: 400 }
      )
    }

    const result = await verifyDonationPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature: razorpay_signature || "",
      donation_id,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    // Donation receipt email (best-effort)
    try {
      const d = result.donation as { donor_email?: string; donor_name?: string; amount?: number; razorpay_payment_id?: string } | undefined
      if (d?.donor_email) {
        await sendDonationReceiptEmail(d.donor_email, d.donor_name || "Donor", Number(d.amount || 0), d.razorpay_payment_id)
      }
    } catch (e) {
      console.error("[api/donate/verify] receipt email failed:", e)
    }

    return NextResponse.json({
      success: true,
      donation: result.donation,
      message: "Payment successfully verified. Thank you for supporting our athletes!",
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment verification error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
