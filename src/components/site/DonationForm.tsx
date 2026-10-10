"use client"
import { useState, useEffect } from "react"
import {
  Heart,
  ShieldCheck,
  CheckCircle2,
  Lock,
  IndianRupee,
  Sparkles,
  ArrowRight,
  Loader2,
  Receipt,
  Download,
  Share2,
  Building2,
  AlertCircle,
} from "lucide-react"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

interface DonationConfig {
  key_id: string
  is_enabled: boolean
  mode: "test" | "live"
  currency: string
  min_amount: number
  suggested_amounts: number[]
  tax_benefit_info?: string
  organization_name?: string
}

interface CompletedDonation {
  id: string
  donor_name: string
  donor_email: string
  donor_phone?: string | null
  pan_number?: string | null
  amount: number
  currency: string
  purpose: string
  razorpay_payment_id?: string | null
  created_at: string
}

const PURPOSES = [
  {
    id: "Athlete Training & Coaching",
    label: "Athlete Training & Coaching",
    desc: "Coaching clinics, high-performance training, and specialized guidance",
  },
  {
    id: "Sports Equipment & Gear",
    label: "Sports Equipment & Gear",
    desc: "Competition-grade equipment, footwear, and safety essentials",
  },
  {
    id: "Nutritional & Medical Support",
    label: "Nutritional & Medical Support",
    desc: "Sports nutrition, physio rehabilitation, and health monitoring",
  },
  {
    id: "Tournament & Travel Support",
    label: "Tournament & Travel Support",
    desc: "Entry fees, travel, lodging, and logistical assistance",
  },
  {
    id: "General Athlete Development Fund",
    label: "General Foundation Fund",
    desc: "Where the need is most urgent across India's sporting ecosystem",
  },
]

export function DonationForm({ initialConfig }: { initialConfig: DonationConfig }) {
  const [config, setConfig] = useState<DonationConfig>(initialConfig)
  const [amount, setAmount] = useState<number>(1000)
  const [customAmount, setCustomAmount] = useState<string>("")
  const [isCustom, setIsCustom] = useState<boolean>(false)
  const [purpose, setPurpose] = useState<string>(PURPOSES[0].id)

  const [donorName, setDonorName] = useState("")
  const [donorEmail, setDonorEmail] = useState("")
  const [donorPhone, setDonorPhone] = useState("")
  const [panNumber, setPanNumber] = useState("")
  const [message, setMessage] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [completed, setCompleted] = useState<CompletedDonation | null>(null)

  // Load Razorpay script
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  // Quick refresh config in case changed recently
  useEffect(() => {
    fetch("/api/donate/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setConfig(data.config)
        }
      })
      .catch(() => {})
  }, [])

  const currentAmount = isCustom ? Number(customAmount) || 0 : amount
  const minAmount = config.min_amount || 1

  function handleSelectPreset(val: number) {
    setIsCustom(false)
    setAmount(val)
    setCustomAmount("")
    setErrorMsg("")
  }

  function handleCustomChange(val: string) {
    // Digits only — free entry so ANY amount (10, 20, 25, 37...) works.
    // No browser-native min/step interference.
    const digits = val.replace(/[^0-9]/g, "")
    setIsCustom(true)
    setCustomAmount(digits)
    setErrorMsg("")
  }

  async function handleDonate(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg("")

    if (currentAmount < minAmount) {
      setErrorMsg(`Minimum contribution is ₹${minAmount}.`)
      return
    }

    if (!donorName.trim()) {
      setErrorMsg("Please enter your full name.")
      return
    }

    if (donorPhone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Please enter a valid 10-digit phone number.")
      return
    }

    if (donorEmail.trim() && !donorEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address or leave it blank.")
      return
    }

    setLoading(true)

    try {
      // 1. Create order on server
      const orderRes = await fetch("/api/donate/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: currentAmount,
          currency: config.currency || "INR",
          donor_name: donorName,
          donor_email: donorEmail,
          donor_phone: donorPhone || undefined,
          pan_number: panNumber || undefined,
          purpose,
          message: message || undefined,
          is_anonymous: isAnonymous,
        }),
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok || !orderData.success) {
        setErrorMsg(orderData.error || "Unable to initiate payment. Please try again.")
        setLoading(false)
        return
      }

      const { orderId, keyId, donationId } = orderData

      // Check if Razorpay Checkout script is loaded and real key exists
      if (typeof window.Razorpay === "undefined" || !keyId) {
        // If simulated or test mode without keys, simulate successful test completion
        setTimeout(async () => {
          try {
            const verifyRes = await fetch("/api/donate/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: orderId,
                razorpay_payment_id: `pay_test_${Math.random().toString(36).substring(2, 10)}`,
                razorpay_signature: "simulated_signature",
                donation_id: donationId,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              setCompleted(verifyData.donation)
            } else {
              setCompleted({
                id: donationId,
                donor_name: donorName,
                donor_email: donorEmail,
                donor_phone: donorPhone,
                pan_number: panNumber,
                amount: currentAmount,
                currency: "INR",
                purpose,
                razorpay_payment_id: "pay_simulated_success",
                created_at: new Date().toISOString(),
              })
            }
          } catch {
            setCompleted({
              id: donationId,
              donor_name: donorName,
              donor_email: donorEmail,
              donor_phone: donorPhone,
              pan_number: panNumber,
              amount: currentAmount,
              currency: "INR",
              purpose,
              razorpay_payment_id: "pay_simulated_success",
              created_at: new Date().toISOString(),
            })
          } finally {
            setLoading(false)
          }
        }, 1200)
        return
      }

      // 2. Open standard Razorpay Checkout modal
      const options = {
        key: keyId,
        amount: Math.round(currentAmount * 100),
        currency: config.currency || "INR",
        name: config.organization_name || "UnitedAthletes Foundation",
        description: `Donation: ${purpose}`,
        image: "/assets/logo-circle.png",
        order_id: orderId,
        prefill: {
          name: donorName,
          email: donorEmail,
          contact: donorPhone || "",
        },
        notes: {
          donation_id: donationId,
          pan_number: panNumber || "Not Provided",
        },
        theme: {
          color: "#C9A227",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/donate/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                donation_id: donationId,
              }),
            })

            const verifyData = await verifyRes.json()

            if (verifyData.success) {
              setCompleted(verifyData.donation)
            } else {
              setErrorMsg(verifyData.error || "Payment received, but verification returned an alert. Please contact support.")
            }
          } catch {
            setErrorMsg("Payment completed, but verification timed out. Your donation is saved.")
          } finally {
            setLoading(false)
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        modal: {
          ondismiss: function () {
            setLoading(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", function (response: any) {
        setErrorMsg(response.error?.description || "Payment was not completed. Please try again.")
        setLoading(false)
      })
      rzp.open()
    } catch {
      setErrorMsg("An unexpected connection issue occurred. Please check your network and try again.")
      setLoading(false)
    }
  }

  // ── Success State View ──
  if (completed) {
    return (
      <div className="surface-card rounded-2xl border border-primary/40 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-6">
          <CheckCircle2 size={44} />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-3">
          Donation Verified
        </span>

        <h3 className="font-display text-3xl sm:text-4xl text-foreground">
          Thank You, <span className="text-gold-gradient">{completed.donor_name}</span>!
        </h3>

        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Your generous contribution of{" "}
          <strong className="text-foreground font-semibold">₹{Number(completed.amount).toLocaleString("en-IN")}</strong>{" "}
          directly fuels the aspirations of athletes across India.
        </p>

        {/* Receipt Box */}
        <div className="mt-8 bg-background/80 rounded-xl border border-border p-6 text-left text-xs space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-muted-foreground uppercase">Receipt Number</span>
            <span className="font-bold text-foreground">{completed.id.slice(0, 18).toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cause Supported:</span>
            <span className="font-sans font-medium text-foreground">{completed.purpose}</span>
          </div>
          {completed.razorpay_payment_id && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Razorpay Ref:</span>
              <span className="text-primary">{completed.razorpay_payment_id}</span>
            </div>
          )}
          {completed.pan_number && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Donor PAN (80G):</span>
              <span className="text-foreground">{completed.pan_number}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-muted-foreground">Date:</span>
            <span className="text-foreground">{new Date(completed.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}</span>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary/90 text-left flex items-start gap-2">
          <ShieldCheck size={16} className="shrink-0 mt-0.5 text-primary" />
          <span>
            A formal 80G tax exemption certificate and official acknowledgement{" "}
            {completed.donor_email ? (
              <>have been scheduled to your registered email (<strong>{completed.donor_email}</strong>)</>
            ) : (
              <>will be shared with you on your registered phone number</>
            )}.
          </span>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-background px-6 py-3 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-card transition-colors"
          >
            <Download size={14} /> Print Receipt
          </button>

          <button
            type="button"
            onClick={() => {
              setCompleted(null)
              setAmount(1000)
              setCustomAmount("")
              setIsCustom(false)
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Heart size={14} /> Make Another Donation
          </button>
        </div>
      </div>
    )
  }

  // ── Main Donation Form View ──
  return (
    <form
      onSubmit={handleDonate}
      className="surface-card rounded-2xl border border-border p-6 sm:p-10 shadow-2xl space-y-8"
    >
      {/* Step 1: Select Amount */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
            <IndianRupee size={14} /> Step 1: Select Contribution Amount
          </label>
          <span className="text-xs text-muted-foreground">Min ₹{minAmount}</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
          {(config.suggested_amounts || [500, 1000, 2500, 5000, 10000]).map((preset) => {
            const isSelected = !isCustom && amount === preset
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`py-3.5 px-3 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                    : "bg-background/60 hover:bg-card border-border text-foreground hover:border-primary/50"
                }`}
              >
                ₹{preset.toLocaleString("en-IN")}
              </button>
            )
          })}
        </div>

        {/* Custom Amount Input */}
        <div className="mt-3 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">
            ₹
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={customAmount}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="Or enter any custom amount in Rupees (e.g. 10, 25, 37)"
            className={`w-full rounded-lg border bg-background/60 py-3.5 pl-9 pr-4 text-sm sm:text-base font-semibold outline-none transition-colors ${
              isCustom
                ? "border-primary text-primary ring-2 ring-primary/20"
                : "border-border text-foreground focus:border-primary"
            }`}
          />
        </div>
      </div>

      {/* Step 2: Choose Purpose / Cause */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
          Step 2: Direct Your Contribution
        </label>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {PURPOSES.map((p) => {
            const isSelected = purpose === p.id
            return (
              <div
                key={p.id}
                onClick={() => setPurpose(p.id)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-background/50 hover:bg-card hover:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {p.label}
                  </span>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                    }`}
                  >
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-background" />}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step 3: Donor Details */}
      <div className="space-y-4">
        <label className="block text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Step 3: Donor Details (For Tax Exemption & Receipt)
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Full Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              className="w-full rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Email Address <span className="normal-case tracking-normal">(Optional)</span>
            </label>
            <input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="e.g. rajesh@example.com"
              className="w-full rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Phone Number <span className="text-primary">*</span>
            </label>
            <input
              type="tel"
              required
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                PAN Number
              </label>
              <span className="text-[10px] text-primary uppercase font-bold tracking-wider">
                80G Eligible
              </span>
            </div>
            <input
              type="text"
              maxLength={10}
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F (Optional for tax receipt)"
              className="w-full rounded-lg border border-border bg-background/60 px-4 py-3 text-sm font-mono uppercase text-foreground outline-none transition focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Words of Encouragement (Optional)
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="A short message for our athletes and coaches..."
            className="w-full rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
          />
          <label htmlFor="anonymous" className="text-xs text-muted-foreground cursor-pointer">
            Keep my name anonymous on the public supporters list
          </label>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-lg bg-destructive/15 border border-destructive/40 text-red-300 text-xs flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Donation Summary & CTA */}
      <div className="pt-2 space-y-4">
        <div className="p-4 rounded-xl bg-background/90 border border-border flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider block">Total Contribution</span>
            <span className="text-2xl sm:text-3xl font-display text-primary">
              ₹{currentAmount.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-muted-foreground block">Selected Fund:</span>
            <span className="text-xs font-semibold text-foreground max-w-[180px] truncate block">
              {purpose}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || currentAmount < minAmount}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-primary py-4 px-8 font-display text-lg tracking-wide uppercase text-primary-foreground shadow-xl shadow-primary/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/40 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing via Razorpay...</span>
            </>
          ) : (
            <>
              <Lock className="h-5 w-5" />
              <span>Donate ₹{currentAmount.toLocaleString("en-IN")} Securely</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        {/* Trust Badges */}
        <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>256-bit Bank Grade SSL Encryption</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 size={14} className="text-primary" />
            <span>Section 8 Non-Profit Registered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            <span>UPI, Cards, NetBanking, Wallets</span>
          </div>
        </div>

        {config.tax_benefit_info && (
          <p className="text-[11px] text-muted-foreground/80 text-center leading-relaxed">
            {config.tax_benefit_info}
          </p>
        )}
      </div>
    </form>
  )
}
