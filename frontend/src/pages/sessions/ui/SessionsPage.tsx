import { Page } from '@/shared/ui'
import { SessionList } from '@/widgets/session-list'

export function SessionsPage() {
  return (
    <Page title="Study sessions" subtitle="Sessions you planned with your study partners.">
      <SessionList />
    </Page>
  )
}
