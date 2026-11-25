import { useNavigate, useParams } from 'react-router'
import { ROUTES } from '@/shared/config'
import { BackButton } from '@/shared/ui'
import { GroupView } from '@/widgets/group-view'
import styles from './GroupPage.module.css'

export function GroupPage() {
  const navigate = useNavigate()
  const { groupId } = useParams()

  return (
    <>
      <div className={styles.back}>
        <BackButton label="All groups" onClick={() => navigate(ROUTES.groups)} />
      </div>
      <GroupView key={groupId} groupId={Number(groupId)} />
    </>
  )
}
