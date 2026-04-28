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

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState("")

  const searchParams = new URLSearchParams(location.search)
  const nextParam = searchParams.get("next")
  const next = nextParam ? decodeURIComponent(nextParam) : ""
  const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : ""

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
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
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="page-title text-primary">Masuk</CardTitle>
          <CardDescription className="section-subtitle">Masuk ke akun Gaslighting kamu</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
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
                autoComplete="current-password"
                className="touch-target"
                {...register("password")}
              />
            </FormField>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full touch-target" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size={18} /> : "Masuk"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link to="/auth/register" className="font-medium text-primary hover:underline">
                Daftar
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
