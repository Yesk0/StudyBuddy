import { Page } from '@/shared/ui'
import { MatchList } from '@/widgets/match-list'

export function MatchesPage() {
  return (
    <Page
      title="Find study partners"
      subtitle="Students who take your courses, ranked by shared courses, common days and study format."
    >
      <MatchList />
    </Page>
  )
}
