import { ProfileDetails, useMyProfile } from '@/entities/profile'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import { Alert, ButtonLink, PageLoader, Page, Panel } from '@/shared/ui'

export function ProfilePage() {
  const { data: profile, isPending, isError, error } = useMyProfile()

  return (
    <Page title="My profile" subtitle="This is what we use to find your study partners.">
      {isPending && <PageLoader />}
      {isError && <Alert tone="error">{errorMessage(error)}</Alert>}
      {profile && (
        <Panel>
          <ProfileDetails
            profile={profile}
            actions={
              <ButtonLink to={ROUTES.profileEdit} variant="secondary">
                Edit profile
              </ButtonLink>
            }
          />
        </Panel>
      )}
    </Page>
  )
}
