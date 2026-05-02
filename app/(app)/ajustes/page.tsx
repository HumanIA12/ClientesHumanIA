import { PageWrapper } from '@/components/layout/page-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HouseholdSettings } from '@/components/settings/household-settings'
import { ProfileSettings } from '@/components/settings/profile-settings'

export default function AjustesPage() {
  return (
    <PageWrapper
      title="Ajustes"
      description="Tu perfil y preferencias del hogar"
    >
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tu perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileSettings />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hogar</CardTitle>
          </CardHeader>
          <CardContent>
            <HouseholdSettings />
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}
