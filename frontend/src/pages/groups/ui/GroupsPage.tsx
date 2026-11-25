import { useNavigate, useSearchParams } from 'react-router'
import { useMyProfile } from '@/entities/profile'
import { CreateGroupForm } from '@/features/create-group'
import { ROUTES } from '@/shared/config'
import { Button, Page } from '@/shared/ui'
import { DiscoverGroups, MyGroups } from '@/widgets/group-list'

export function GroupsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const creating = params.get('create') === '1'
  const { data: profile } = useMyProfile()
  const myCourses = profile?.courses ?? []

  return (
    <Page
      title="Study groups"
      subtitle="Small groups of 3–4 students preparing for the same course together."
      actions={
        !creating && (
          <Button size="md" onClick={() => setParams({ create: '1' })}>
            Create a group
          </Button>
        )
      }
    >
      {creating && profile && (
        <CreateGroupForm
          myCourses={myCourses}
          defaultCourse={params.get('course') ?? undefined}
          onCreated={(group) => navigate(ROUTES.group(group.id))}
          onCancel={() => setParams({})}
        />
      )}
      <MyGroups />
      <DiscoverGroups myCourses={myCourses} />
    </Page>
  )
}
