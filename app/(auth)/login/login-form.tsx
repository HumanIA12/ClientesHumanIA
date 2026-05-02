'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

const passwordSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const magicSchema = z.object({
  email: z.string().email('Email inválido'),
})

type Mode = 'password' | 'magic'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  const [mode, setMode] = useState<Mode>('password')
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '' },
  })

  const magicForm = useForm<z.infer<typeof magicSchema>>({
    resolver: zodResolver(magicSchema),
    defaultValues: { email: '' },
  })

  const supabase = createClient()

  async function onPassword(values: z.infer<typeof passwordSchema>) {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error) {
      setError(error.message)
      return
    }
    router.replace(next)
    router.refresh()
  }

  async function onMagic(values: z.infer<typeof magicSchema>) {
    setError(null)
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? ''
    const redirectTo = `${origin}/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) {
      setError(error.message)
      return
    }
    setMagicSent(true)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => {
            setMode('password')
            setError(null)
            setMagicSent(false)
          }}
          className={cn(
            'flex items-center justify-center gap-2 rounded-md px-3 py-2 transition-colors',
            mode === 'password'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <KeyRound className="h-4 w-4" /> Contraseña
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('magic')
            setError(null)
            setMagicSent(false)
          }}
          className={cn(
            'flex items-center justify-center gap-2 rounded-md px-3 py-2 transition-colors',
            mode === 'magic'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Mail className="h-4 w-4" /> Magic link
        </button>
      </div>

      {mode === 'password' && (
        <form
          onSubmit={passwordForm.handleSubmit(onPassword)}
          className="space-y-3"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="tu@email.com"
              {...passwordForm.register('email')}
            />
            {passwordForm.formState.errors.email && (
              <p className="text-xs text-danger">
                {passwordForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...passwordForm.register('password')}
            />
            {passwordForm.formState.errors.password && (
              <p className="text-xs text-danger">
                {passwordForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={passwordForm.formState.isSubmitting}
          >
            {passwordForm.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Entrar
          </Button>
        </form>
      )}

      {mode === 'magic' && !magicSent && (
        <form
          onSubmit={magicForm.handleSubmit(onMagic)}
          className="space-y-3"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="magic-email">Email</Label>
            <Input
              id="magic-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="tu@email.com"
              {...magicForm.register('email')}
            />
            {magicForm.formState.errors.email && (
              <p className="text-xs text-danger">
                {magicForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={magicForm.formState.isSubmitting}
          >
            {magicForm.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Enviar enlace
          </Button>
        </form>
      )}

      {mode === 'magic' && magicSent && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-primary">Revisa tu correo</p>
          <p className="text-muted-foreground mt-1">
            Te enviamos un enlace mágico. Ábrelo desde este mismo dispositivo
            para entrar.
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
        >
          {error}
        </div>
      )}
    </div>
  )
}
