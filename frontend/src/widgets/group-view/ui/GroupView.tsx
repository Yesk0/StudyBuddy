import { useState } from 'react'
import { MessageList, useThreadMessages, type Thread } from '@/entities/connection'
import { GroupCard, useGroup, type GroupDetail } from '@/entities/group'
import { yearLabel } from '@/entities/profile'
import { SessionCard } from '@/entities/study-session'
import { useViewer } from '@/entities/viewer'
import { AddToCalendarButton } from '@/features/export-session-ics'
import { JoinGroupPanel } from '@/features/join-group'
import { JoinRequestActions, LeaveGroupButton, RemoveMemberButton } from '@/features/manage-group'
import { ProposeSessionForm } from '@/features/propose-session'
import { SessionActions } from '@/features/respond-to-session'
import { MessageComposer } from '@/features/send-message'
import { errorMessage } from '@/shared/api'
import { Alert, Avatar, Button, EmptyState, PageLoader, Panel, SectionLabel, Tag } from '@/shared/ui'
import styles from './GroupView.module.css'

function GroupChat({ group, viewerId }: { group: GroupDetail; viewerId: number }) {
  const thread: Thread = { kind: 'group', id: group.id }
  const messages = useThreadMessages(thread)
  const [scheduling, setScheduling] = useState(false)
  const names = new Map(group.members.map((member) => [member.user_id, member.full_name]))
  const nameOf = (userId: number) => names.get(userId) ?? 'Former member'

  if (messages.isPending) return <PageLoader />
  if (messages.isError) return <Alert tone="error">{errorMessage(messages.error)}</Alert>

  return (
    <Panel padded={false} className={styles.chat}>
      <h2 className={styles.chatTitle}>Group chat</h2>
      <MessageList
        messages={messages.data.messages}
        hasMore={messages.data.hasMore}
        loadingEarlier={messages.loadingEarlier}
        onLoadEarlier={messages.loadEarlier}
        viewerId={viewerId}
        senderName={nameOf}
        emptyText="Say hi to your group and pick a time to meet."
        renderSession={(message, mine) => (
          <SessionCard
            className={styles.session}
            session={message.session!}
            eyebrow={mine ? 'You scheduled a session' : `${nameOf(message.sender_id)} scheduled a session`}
            actions={
              <>
                <SessionActions
                  session={message.session!}
                  viewerId={viewerId}
                  groupOwnerId={group.owner.user_id}
                />
                <AddToCalendarButton session={message.session!} withWhom={`group “${group.name}”`} />
              </>
            }
          />
        )}
      />
      <div className={styles.bottom}>
        {scheduling ? (
          <ProposeSessionForm
            thread={thread}
            defaultTitle={`${group.course} group session`}
            onDone={() => setScheduling(false)}
          />
        ) : (
          <div>
            <Button variant="secondary" size="sm" onClick={() => setScheduling(true)}>
              Schedule a group session
            </Button>
          </div>
        )}
        <MessageComposer thread={thread} />
      </div>
    </Panel>
  )
}

export function GroupView({ groupId }: { groupId: number }) {
  const { data: viewer } = useViewer()
  const { data: group, isPending, isError, error } = useGroup(groupId)
  const viewerId = viewer?.id ?? -1

  if (isPending) return <PageLoader />
  if (isError) return <Alert tone="error">{errorMessage(error)}</Alert>

  return (
    <div className={styles.layout}>
      <div className={styles.side}>
        <GroupCard
          group={group}
          footer={
            group.is_member ? (
              <LeaveGroupButton groupId={group.id} lastMember={group.member_count === 1} />
            ) : (
              <JoinGroupPanel group={group} />
            )
          }
        />

        <Panel>
          <SectionLabel>
            Members · {group.member_count}/{group.max_members}
          </SectionLabel>
          <ul className={styles.people}>
            {group.members.map((member) => (
              <li key={member.user_id} className={styles.person}>
                <Avatar name={member.full_name} size={36} />
                <div className={styles.personText}>
                  <span className={styles.personName}>
                    {member.full_name}
                    {member.user_id === viewerId && ' (you)'}
                  </span>
                  <span className={styles.personMeta}>
                    {[yearLabel(member.year_of_study), member.major].filter(Boolean).join(' · ')}
                  </span>
                </div>
                {member.is_owner ? (
                  <Tag tone="primary">Organiser</Tag>
                ) : (
                  group.is_owner && <RemoveMemberButton groupId={group.id} userId={member.user_id} />
                )}
              </li>
            ))}
          </ul>
        </Panel>

        {group.is_owner && group.pending_requests.length > 0 && (
          <Panel>
            <SectionLabel>Want to join</SectionLabel>
            <ul className={styles.people}>
              {group.pending_requests.map((request) => (
                <li key={request.id} className={styles.request}>
                  <div className={styles.person}>
                    <Avatar name={request.user.full_name} size={36} />
                    <div className={styles.personText}>
                      <span className={styles.personName}>{request.user.full_name}</span>
                      <span className={styles.personMeta}>
                        {[yearLabel(request.user.year_of_study), request.user.major].join(' · ')}
                      </span>
                    </div>
                  </div>
                  {request.message && <p className={styles.requestMessage}>{request.message}</p>}
                  <div className={styles.requestActions}>
                    <JoinRequestActions requestId={request.id} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      {group.is_member ? (
        <GroupChat group={group} viewerId={viewerId} />
      ) : (
        <Panel className={styles.locked}>
          <EmptyState
            title="Join to see the group chat"
            text="Members talk and plan their study sessions here."
          />
        </Panel>
      )}
    </div>
  )
}
