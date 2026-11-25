import { postJson, request } from '@/shared/api'
import type { Viewer } from '../model/types'

type TokenResponse = { access_token: string; token_type: string }

export type Credentials = { email: string; password: string }

export function register(credentials: Credentials): Promise<TokenResponse> {
  return postJson<TokenResponse>('/auth/register', credentials)
}

export function login(credentials: Credentials): Promise<TokenResponse> {
  return postJson<TokenResponse>('/auth/login', credentials)
}

export function getViewer(): Promise<Viewer> {
  return request<Viewer>('/auth/me')
}

export function verifyEmail(code: string): Promise<void> {
  return postJson<void>('/auth/verify', { code })
}

export function resendVerificationCode(): Promise<void> {
  return postJson<void>('/auth/verify/resend')
}
