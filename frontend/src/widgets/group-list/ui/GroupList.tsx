import { useState } from 'react'
import { GroupCard, useGroups, type Group } from '@/entities/group'
import { JoinGroupPanel } from '@/features/join-group'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import {
  Alert,
  ButtonLink,
  Chip,
  ChipGroup,
  EmptyState,
  PageLoader,
  Panel,
  SectionLabel,
} from '@/shared/ui'
import styles from './GroupList.module.css'

function GroupItems({ groups }: { groups: Group[] }) {
  return (
    <div className={styles.list}>
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          to={ROUTES.group(group.id)}
          footer={
            group.is_member ? (
              <ButtonLink to={ROUTES.group(group.id)} size="sm">
                Open group
              </ButtonLink>
            ) : (
              <JoinGroupPanel group={group} />
            )
          }
        />
      ))}
    </div>
  )
}

export function MyGroups() {
  const { data: groups, isPending, isError, error } = useGroups('mine')
  if (isPending) return <PageLoader />
  if (isError) return <Alert tone="error">{errorMessage(error)}</Alert>
  if (groups.length === 0) return null
  return (
    <section className={styles.section}>
      <SectionLabel>My groups</SectionLabel>
      <GroupItems groups={groups} />
    </section>
  )
}

/** Open groups for the viewer's courses, best fit first. */
export function DiscoverGroups({ myCourses }: { myCourses: string[] }) {
  const [course, setCourse] = useState<string | null>(null)
  const { data: groups, isPending, isError, error } = useGroups('discover', course)

  return (
    <section className={styles.section}>
      <SectionLabel>Groups for your courses</SectionLabel>
      {myCourses.length > 1 && (
        <ChipGroup className={styles.filters} aria-label="Filter by course">
          <Chip selected={course === null} aria-pressed={course === null} onClick={() => setCourse(null)}>
            All my courses
          </Chip>
          {myCourses.map((name) => (
            <Chip key={name} selected={course === name} aria-pressed={course === name} onClick={() => setCourse(name)}>
              {name}
            </Chip>
          ))}
        </ChipGroup>
      )}
      {isPending && <PageLoader />}
      {isError && <Alert tone="error">{errorMessage(error)}</Alert>}
      {groups && groups.length === 0 && (
        <Panel>
          <EmptyState
            title="No groups yet"
            text="Nobody has started a group for these courses. Create one and invite classmates to join."
            action={
              <ButtonLink to={ROUTES.newGroup(course)} variant="secondary">
                Create a group
              </ButtonLink>
            }
          />
        </Panel>
      )}
      {groups && groups.length > 0 && <GroupItems groups={groups} />}
    </section>
  )
}
