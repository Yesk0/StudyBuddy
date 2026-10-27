export const ROUTES = {
  login: '/login',
  register: '/register',
  onboarding: '/onboarding',
  matches: '/',
  requests: '/requests',
  chats: '/chats',
  chat: (connectionId: number | string) => `/chats/${connectionId}`,
  sessions: '/sessions',
  profile: '/profile',
  profileEdit: '/profile/edit',
} as const
