"use client"
import { useState } from "react"
import {
  Save,
  Loader2,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
  CreditCard,
  Sparkles,
} from "lucide-react"
import { Input, Textarea } from "@/components/ui/form"
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/admin"
import { Button } from "@/components/admin/Button"
import { toast } from "@/components/ui/toast"
import { RazorpaySettings } from "@/lib/cms/types"

export function RazorpaySettingsForm({ initialSettings }: { initialSettings: RazorpaySettings }) {
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showSecret, setShowSecret] = useState(false)

  const [form, setForm] = useState({
    key_id: initialSettings.key_id || "",
    key_secret: initialSettings.key_secret || "",
    is_enabled: initialSettings.is_enabled ?? true,
    mode: initialSettings.mode || "test",
    currency: initialSettings.currency || "INR",
    min_amount: initialSettings.min_amount || 1,
    suggested_amounts: (initialSettings.suggested_amounts || [500, 1000, 2500, 5000, 10000]).join(", "),
    tax_benefit_info:
      initialSettings.tax_benefit_info ||
      "Donations to UnitedAthletes for India Foundation may be eligible for tax exemption under Section 80G.",
    organization_name: initialSettings.organization_name || "UnitedAthletes for India Foundation",
    notes: initialSettings.notes || "",
  })

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Auto-detect mode based on Key ID prefix
  const detectedMode = form.key_id.startsWith("rzp_live")
    ? "live"
    : form.key_id.startsWith("rzp_test")
    ? "test"
    : form.mode

  async function handleTestConnection() {
    if (!form.key_id.trim()) {
      toast.error("Please enter a Razorpay Key ID first")
      return
    }
    if (!form.key_secret.trim()) {
      toast.error("Please enter a Razorpay Key Secret first")
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const res = await fetch("/api/admin/donations/verify-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key_id: form.key_id.trim(),
          key_secret: form.key_secret.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: "Razorpay credentials are valid and connected successfully!",
        })
        toast.success("Credentials verified with Razorpay")
      } else {
        setTestResult({
          success: false,
          message: data.error || "Failed to authenticate with Razorpay. Check your key & secret.",
        })
        toast.error(data.error || "Verification failed")
      }
    } catch {
      setTestResult({
        success: false,
        message: "Network error while connecting to Razorpay verification service.",
      })
      toast.error("Could not test credentials")
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const parsedAmounts = form.suggested_amounts
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0)

      const payload = {
        key_id: form.key_id.trim(),
        key_secret: form.key_secret.trim(),
        is_enabled: form.is_enabled,
        mode: detectedMode,
        currency: form.currency.trim().toUpperCase() || "INR",
        min_amount: Number(form.min_amount) || 1,
        suggested_amounts: parsedAmounts.length > 0 ? parsedAmounts : [500, 1000, 2500, 5000, 10000],
        tax_benefit_info: form.tax_benefit_info.trim(),
        organization_name: form.organization_name.trim(),
        notes: form.notes.trim(),
      }

      const res = await fetch("/api/admin/donations/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to save settings")
        return
      }

      toast.success("Razorpay settings updated successfully")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Sticky Top Bar */}
      <div className="flex items-center justify-between gap-4 sticky top-14 lg:top-0 bg-slate-50 py-3 z-10 -mt-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              detectedMode === "live"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-amber-100 text-amber-800 border border-amber-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                detectedMode === "live" ? "bg-emerald-600 animate-pulse" : "bg-amber-500"
              }`}
            />
            {detectedMode.toUpperCase()} MODE
          </span>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              form.is_enabled ? "bg-slate-200 text-slate-800" : "bg-red-100 text-red-700"
            }`}
          >
            {form.is_enabled ? "Donations Active" : "Donations Disabled"}
          </span>
        </div>

        <Button onClick={handleSave} variant="primary" disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving Changes..." : "Save Settings"}
        </Button>
      </div>

      {/* Main Form Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* API Credentials Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-600" />
                  Razorpay API Keys
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Obtain your API Key and Secret from the Razorpay Dashboard (Settings → API Keys).
                </p>
              </div>
              <a
                href="https://dashboard.razorpay.com/app/keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#0B1D3A] hover:underline font-medium"
              >
                Razorpay Dashboard <ExternalLink size={12} />
              </a>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Razorpay Key ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.key_id}
                  onChange={(e) => update("key_id", e.target.value)}
                  placeholder="rzp_test_... or rzp_live_..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Prefix indicates environment: <code className="text-slate-700">rzp_test_</code> for sandbox or{" "}
                  <code className="text-slate-700">rzp_live_</code> for live production payments.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Razorpay Key Secret <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={form.key_secret}
                    onChange={(e) => update("key_secret", e.target.value)}
                    placeholder="Enter your Razorpay Secret Key"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm font-mono text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showSecret ? "Hide secret" : "Show secret"}
                  >
                    {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Server-only secret used for cryptographically verifying payment signatures.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !form.key_id || !form.key_secret}
                  className="w-full sm:w-auto"
                >
                  {testing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  {testing ? "Testing Connection..." : "Test Connection with Razorpay"}
                </Button>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-lg text-sm flex items-start gap-2.5 ${
                    testResult.success
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-medium">
                      {testResult.success ? "Connection Verified" : "Connection Failed"}
                    </strong>
                    <span className="text-xs">{testResult.message}</span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Donation Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Donation Experience & Presets
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Currency Code"
                  value={form.currency}
                  onChange={(e) => update("currency", e.target.value.toUpperCase())}
                  placeholder="INR"
                  hint="Standard currency code (INR for Indian Rupee)"
                />
                <Input
                  label="Minimum Donation Amount (₹)"
                  type="number"
                  value={String(form.min_amount)}
                  onChange={(e) => update("min_amount", Number(e.target.value))}
                  placeholder="100"
                  hint="Lowest allowable contribution"
                />
              </div>

              <Input
                label="Suggested Preset Amounts"
                value={form.suggested_amounts}
                onChange={(e) => update("suggested_amounts", e.target.value)}
                placeholder="500, 1000, 2500, 5000, 10000"
                hint="Comma-separated rupee values shown as quick-pick buttons on the donation page"
              />

              <Input
                label="Organization Display Name"
                value={form.organization_name}
                onChange={(e) => update("organization_name", e.target.value)}
                placeholder="UnitedAthletes for India Foundation"
                hint="Name displayed on the Razorpay checkout modal"
              />

              <Textarea
                label="80G Tax Exemption Notice"
                value={form.tax_benefit_info}
                onChange={(e) => update("tax_benefit_info", e.target.value)}
                rows={2}
                placeholder="Notice regarding tax deductions..."
                hint="Shown beneath the donation form to inform donors about tax benefits"
              />
            </CardBody>
          </Card>
        </div>

        {/* Sidebar Info & Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gateway Status</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="block text-sm font-medium text-slate-800">Accept Online Donations</span>
                  <span className="block text-xs text-slate-500">
                    When off, the donation page shows an unavailable notice
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={form.is_enabled}
                  onChange={(e) => update("is_enabled", e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Detected Mode
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      detectedMode === "live" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span className="text-sm font-bold text-slate-800">
                    {detectedMode === "live" ? "Live Production Mode" : "Test / Sandbox Mode"}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {detectedMode === "live"
                    ? "Real transactions will be charged and credited to your bank account."
                    : "No real money is charged. Use test cards and UPI handles provided in Razorpay documentation."}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Quick Setup Guide
              </CardTitle>
            </CardHeader>
            <CardBody className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                <strong>1.</strong> Log in to your{" "}
                <a
                  href="https://dashboard.razorpay.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-700 underline"
                >
                  Razorpay Dashboard
                </a>
                .
              </p>
              <p>
                <strong>2.</strong> Navigate to <strong>Settings → API Keys</strong>.
              </p>
              <p>
                <strong>3.</strong> Click <strong>Generate Key</strong> (or copy your existing Test or Live key).
              </p>
              <p>
                <strong>4.</strong> Paste both the <strong>Key ID</strong> and <strong>Key Secret</strong> into the fields on this page.
              </p>
              <p>
                <strong>5.</strong> Click <strong>Test Connection</strong> to confirm everything works, then click <strong>Save Settings</strong>.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
