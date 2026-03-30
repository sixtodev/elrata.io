'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    const supabase = createClient()

    if (isRegister) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setError(signUpError.message)
      } else {
        setSuccessMessage('Revisa tu email para confirmar tu cuenta.')
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
      } else {
        router.push('/dashboard')
      }
    }

    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setError(null)
    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <Link
          href="/"
          className="block text-center mb-8 no-underline font-title text-[28px] text-foreground"
        >
          El<span className="text-green">Rata</span>.io
        </Link>

        {/* Card */}
        <div className="bg-bg2 border border-border rounded-2xl p-8">
          <h1 className="font-title text-2xl text-foreground mb-6 text-center">
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </h1>

          {/* Google OAuth */}
          <Button
            type="button"
            variant="secondary"
            className="w-full mb-6 text-foreground"
            onClick={handleGoogleLogin}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            Continuar con Google
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted text-xs">o</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>

            <div className="mb-5">
              <Input
                type="password"
                label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {error && (
              <div className="px-3.5 py-2.5 bg-red/10 border border-red/30 rounded-lg text-red text-[13px] mb-4">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="px-3.5 py-2.5 bg-green/10 border border-green/30 rounded-lg text-green text-[13px] mb-4">
                {successMessage}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full"
            >
              {loading
                ? 'Cargando...'
                : isRegister
                  ? 'Crear cuenta'
                  : 'Iniciar sesión'}
            </Button>
          </form>

          <p className="text-center mt-5 text-muted text-[13px]">
            {isRegister ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setError(null)
                setSuccessMessage(null)
              }}
              className="bg-transparent border-none text-green cursor-pointer text-[13px] underline"
            >
              {isRegister ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </p>
        </div>

        <p className="text-center mt-5">
          <Link href="/" className="text-muted text-[13px] no-underline">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  )
}
