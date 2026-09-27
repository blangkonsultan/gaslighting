import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { registerUser } from "@/services/auth.service"
import { registerSchema, type RegisterInput } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { FormField } from "@/components/shared/FormField"
import { AppLogo } from "@/components/shared/AppLogo"

export default function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterInput) {
    try {
      setError("")
      setSuccess("")
      const result = await registerUser(data)
      if (result.user && !result.session) {
        setSuccess("Pendaftaran berhasil! Silakan cek email untuk verifikasi.")
      } else {
        navigate("/dashboard")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendaftar. Coba lagi.")
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

        <Card className="border border-[#D5CF9E] bg-[#E4DFB5]/90 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="text-lg font-bold text-[#2D2A26]">
              Buat Akun Baru
            </CardTitle>
            <CardDescription className="text-xs text-[#6F6B58]">
              Daftar untuk mengelola anggaran dan rekening bersama
            </CardDescription>
          </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
                {success}
              </div>
            )}
            <FormField label="Nama Lengkap" htmlFor="full_name" error={errors.full_name}>
              <Input
                id="full_name"
                placeholder="Nama lengkap"
                autoComplete="name"
                className="touch-target"
                {...register("full_name")}
              />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email}>
              <Input
                id="email"
                type="email"
                placeholder="kamu@email.com"
                autoComplete="email"
                className="touch-target"
                {...register("email")}
              />
            </FormField>
            <FormField label="Password" htmlFor="password" error={errors.password}>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                className="touch-target"
                {...register("password")}
              />
            </FormField>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full touch-target" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size={18} /> : "Daftar"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link to="/auth/login" className="font-medium text-primary hover:underline">
                Masuk
              </Link>
            </p>
          </CardFooter>
        </form>
        </Card>
      </div>
    </div>
  )
}
