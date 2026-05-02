'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUpdateProfile } from '@/hooks/use-household'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

const COLORS = [
  '#6C63FF',
  '#FF6B9D',
  '#1E6B4A',
  '#2D9CDB',
  '#F4A823',
  '#E05A5A',
  '#27AE60',
  '#1A1A1A',
] as const

export function ProfileSettings() {
  const supabase = createClient()
  const update = useUpdateProfile()
  const [loading, setLoading] = useState(true)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarColor, setAvatarColor] = useState<string>('#6C63FF')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (mounted) setLoading(false)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_color, email')
        .eq('id', user.id)
        .maybeSingle()
      if (!mounted) return
      setProfileId(user.id)
      setEmail(user.email ?? data?.email ?? '')
      setDisplayName(data?.display_name ?? '')
      setAvatarColor(data?.avatar_color ?? '#6C63FF')
      setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [supabase])

  if (loading) return <Skeleton className="h-56 rounded-lg" />
  if (!profileId) {
    return (
      <p className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
        No hay sesión activa.
      </p>
    )
  }

  async function handleSave() {
    setError(null)
    if (!displayName.trim()) {
      setError('El nombre no puede estar vacío')
      return
    }
    try {
      await update.mutateAsync({
        id: profileId!,
        patch: {
          display_name: displayName.trim(),
          avatar_color: avatarColor,
        },
      })
      setSavedAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" value={email} disabled />
        <p className="text-xs text-muted-foreground">
          El email se administra desde Supabase Auth.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Tu nombre</Label>
        <Input
          id="profile-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.currentTarget.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Color de tu avatar</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => {
            const selected = avatarColor.toLowerCase() === color.toLowerCase()
            return (
              <button
                key={color}
                type="button"
                aria-label={`Color ${color}`}
                aria-pressed={selected}
                onClick={() => setAvatarColor(color)}
                className={cn(
                  'h-9 w-9 rounded-full transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  selected
                    ? 'scale-110 ring-2 ring-foreground ring-offset-2'
                    : 'hover:scale-105'
                )}
                style={{ backgroundColor: color }}
              />
            )
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar
        </Button>
        {savedAt && Date.now() - savedAt < 4000 && (
          <span className="text-xs text-success">Guardado</span>
        )}
      </div>
    </div>
  )
}
