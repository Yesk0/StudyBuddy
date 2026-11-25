import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { StudySession } from '@/entities/study-session'
import { mockFetch, renderWithProviders } from '@/test/render'
import { SessionActions } from './SessionActions'

const PROPOSER = 1
const PARTNER = 2

function session(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: 9,
    connection_id: 4,
    group_id: null,
    proposer_id: PROPOSER,
    title: 'Prep',
    starts_at: new Date(Date.now() + 86_400_000).toISOString(),
    duration_minutes: 60,
    format: 'online',
    location: '',
    status: 'proposed',
    created_at: new Date().toISOString(),
    responded_at: null,
    ...overrides,
  }
}

const buttons = () => screen.queryAllByRole('button').map((button) => button.textContent)

describe('SessionActions', () => {
  it('lets the partner answer a proposal', async () => {
    const fetchMock = mockFetch(200, session({ status: 'accepted' }))
    renderWithProviders(<SessionActions session={session()} viewerId={PARTNER} />)
    expect(buttons()).toEqual(['Accept', 'Decline'])

    await userEvent.setup().click(screen.getByRole('button', { name: 'Accept' }))
    expect(fetchMock).toHaveBeenCalledWith('/api/sessions/9/accept', expect.anything())
  })

  it('lets the proposer withdraw instead', () => {
    renderWithProviders(<SessionActions session={session()} viewerId={PROPOSER} />)
    expect(buttons()).toEqual(['Withdraw proposal'])
  })

  it('offers no actions once the session has started', () => {
    const started = session({ status: 'accepted', starts_at: new Date(Date.now() - 60_000).toISOString() })
    renderWithProviders(<SessionActions session={started} viewerId={PARTNER} />)
    expect(buttons()).toEqual([])
  })

  it('lets only the organiser or the group owner cancel a group session', () => {
    const groupSession = session({ connection_id: null, group_id: 3, status: 'accepted' })
    const { unmount } = renderWithProviders(
      <SessionActions session={groupSession} viewerId={PARTNER} groupOwnerId={7} />,
    )
    expect(buttons()).toEqual([])
    unmount()

    renderWithProviders(<SessionActions session={groupSession} viewerId={7} groupOwnerId={7} />)
    expect(buttons()).toEqual(['Cancel session'])
  })
})
