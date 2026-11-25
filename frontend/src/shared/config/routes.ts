export const ROUTES = {
  login: '/login',
  register: '/register',
  verify: '/verify',
  onboarding: '/onboarding',
  matches: '/',
  requests: '/requests',
  chats: '/chats',
  chat: (connectionId: number | string) => `/chats/${connectionId}`,
  groups: '/groups',
  group: (groupId: number | string) => `/groups/${groupId}`,
  newGroup: (course?: string | null) =>
    course ? `/groups?create=1&course=${encodeURIComponent(course)}` : '/groups?create=1',
  forum: '/forum',
  forumPost: (postId: number | string) => `/forum/${postId}`,
  sessions: '/sessions',
  profile: '/profile',
  profileEdit: '/profile/edit',
} as const
