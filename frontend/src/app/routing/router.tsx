import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage, RegisterPage } from '@/pages/auth'
import { ChatsPage } from '@/pages/chats'
import { ForumPage, ForumPostPage } from '@/pages/forum'
import { GroupPage, GroupsPage } from '@/pages/groups'
import { MatchesPage } from '@/pages/matches'
import { ProfilePage } from '@/pages/profile'
import { ProfileEditPage, ProfileSetupPage } from '@/pages/profile-setup'
import { RequestsPage } from '@/pages/requests'
import { SessionsPage } from '@/pages/sessions'
import { VerifyEmailPage } from '@/pages/verify-email'
import { ROUTES } from '@/shared/config'
import { AppLayout } from './AppLayout'
import { GuestOnly, RequireAuth, RequireProfile, RequireVerified, UnverifiedOnly } from './guards'

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.register, element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <UnverifiedOnly />,
        children: [{ path: ROUTES.verify, element: <VerifyEmailPage /> }],
      },
      {
        element: <RequireVerified />,
        children: [
          { path: ROUTES.onboarding, element: <ProfileSetupPage /> },
          {
            element: <RequireProfile />,
            children: [
              { path: ROUTES.profileEdit, element: <ProfileEditPage /> },
              {
                element: <AppLayout />,
                children: [
                  { index: true, element: <MatchesPage /> },
                  { path: ROUTES.requests, element: <RequestsPage /> },
                  { path: ROUTES.chats, element: <ChatsPage /> },
                  { path: `${ROUTES.chats}/:connectionId`, element: <ChatsPage /> },
                  { path: ROUTES.groups, element: <GroupsPage /> },
                  { path: `${ROUTES.groups}/:groupId`, element: <GroupPage /> },
                  { path: ROUTES.forum, element: <ForumPage /> },
                  { path: `${ROUTES.forum}/:postId`, element: <ForumPostPage /> },
                  { path: ROUTES.sessions, element: <SessionsPage /> },
                  { path: ROUTES.profile, element: <ProfilePage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={ROUTES.matches} replace /> },
])
