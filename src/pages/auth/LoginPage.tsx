import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { login } from "@/services/auth.service"
import { loginSchema, type LoginInput } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { FormField } from "@/components/shared/FormField"
import { AppLogo } from "@/components/shared/AppLogo"
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react"
import { supabase } from "@/services/supabase"
import { useEffect } from "react"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const searchParams = new URLSearchParams(location.search)
  let safeNext = ""
  const nextParam = searchParams.get("next")
  if (nextParam) {
    try {
      const decoded = decodeURIComponent(nextParam)
      if (decoded.startsWith("/") && !decoded.startsWith("//") && !decoded.startsWith("/\\")) {
        safeNext = decoded
      }
    } catch {
      safeNext = ""
    }
  }
  const isVerified = searchParams.get("verified") === "true" || location.hash.includes("type=signup")

  useEffect(() => {
    if (isVerified) {
      void supabase.auth.signOut()
    }
  }, [isVerified])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    try {
      setError("")
      await login(data)
      navigate(safeNext || "/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk. Periksa email dan password.")
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#FBE8CE] p-4 sm:p-6 text-[#3D3D3D] select-none">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2.5">
          <AppLogo size={60} className="drop-shadow-xs" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#2D2A26]">
              Gaslighting
            </h1>
            <p className="text-xs text-[#6F6B58] mt-0.5">
              Manajemen keuangan transparan bersama pasangan
            </p>
          </div>
        </div>

        {/* Card Form */}
        <Card className="border border-[#D5CF9E] bg-[#E4DFB5]/90 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2 pt-6 px-6">
            <CardTitle className="text-lg font-bold text-[#2D2A26]">
              Selamat Datang Kembali
            </CardTitle>
            <CardDescription className="text-xs text-[#6F6B58]">
              Masukkan email dan password untuk melanjutkan
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="flex flex-col gap-4 pt-2 px-6">
              {isVerified && !error && (
                <div
                  role="status"
                  className="rounded-xl border border-success/30 bg-success/15 p-3 text-xs font-semibold text-success flex items-start gap-2 animate-fade-in"
                >
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <span>Akun Anda telah berhasil diverifikasi! Silakan masuk dengan email dan password.</span>
                </div>
              )}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive flex items-start gap-2 animate-fade-in"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Field */}
              <FormField label="Email" htmlFor="email" error={errors.email}>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6F6B58]">
                    <Mail size={16} />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    autoComplete="email"
                    className="touch-target pl-10 h-11 rounded-xl bg-background/80 border-[#C3CC9B] text-[#2D2A26] placeholder:text-[#6F6B58]/70 focus-visible:border-[#9AB17A] focus-visible:ring-2 focus-visible:ring-[#9AB17A]/40"
                    {...register("email")}
                  />
                </div>
              </FormField>

              {/* Password Field */}
              <FormField label="Password" htmlFor="password" error={errors.password}>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6F6B58]">
                    <Lock size={16} />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    autoComplete="current-password"
                    className="touch-target pl-10 pr-11 h-11 rounded-xl bg-background/80 border-[#C3CC9B] text-[#2D2A26] placeholder:text-[#6F6B58]/70 focus-visible:border-[#9AB17A] focus-visible:ring-2 focus-visible:ring-[#9AB17A]/40"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#6F6B58] hover:text-[#2D2A26] transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9AB17A] rounded-lg"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FormField>
            </CardContent>

            <CardFooter className="border-t-0 bg-transparent flex flex-col gap-3.5 px-6 pt-1 pb-6">
              <Button
                type="submit"
                className="w-full touch-target h-11 rounded-xl font-bold bg-[#9AB17A] text-[#1B2E15] hover:bg-[#8BA36B] active:scale-[0.98] transition-all shadow-xs gap-1.5 cursor-pointer text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <LoadingSpinner size={18} />
                ) : (
                  <>
                    <span>Masuk ke Akun</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>

              <p className="text-xs text-[#6F6B58] text-center">
                Belum punya akun?{" "}
                <Link
                  to="/auth/register"
                  className="font-bold text-[#446330] hover:text-[#2E4520] hover:underline underline-offset-4"
                >
                  Daftar sekarang
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Security Micro-copy */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6F6B58]">
          <ShieldCheck size={14} className="text-[#4D6B37]" />
          <span>Data finansial terenkripsi & privat</span>
        </div>
      </div>
    </div>
  )
}
