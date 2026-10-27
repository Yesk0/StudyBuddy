import { Page } from '@/shared/ui'
import { RequestList } from '@/widgets/request-list'

export function RequestsPage() {
  return (
    <Page title="Study requests" subtitle="Accept a request to start chatting with a study partner.">
      <RequestList />
    </Page>
  )
}
