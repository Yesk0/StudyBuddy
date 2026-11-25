import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getAuthToken } from '@/shared/api'
import { mockFetch, renderWithProviders } from '@/test/render'
import { AuthForm } from './AuthForm'

async function fillRegistration(email: string, password: string, confirm: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('University email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Repeat password'), confirm)
  await user.click(screen.getByRole('button', { name: 'Sign up' }))
}

describe('AuthForm', () => {
  it('validates before calling the server', async () => {
    const fetchMock = mockFetch(201, { access_token: 'token' })
    renderWithProviders(<AuthForm mode="register" />)

    await fillRegistration('not-an-email', 'short', 'other')

    expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
    expect(screen.getByText('Use at least 8 characters')).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('stores the token after signing up', async () => {
    const fetchMock = mockFetch(201, { access_token: 'new-token', token_type: 'bearer' })
    renderWithProviders(<AuthForm mode="register" />)

    await fillRegistration('ann@kbtu.kz', 'password123', 'password123')

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/register', expect.anything())
    expect(getAuthToken()).toBe('new-token')
  })

  it('shows the server error when signing in fails', async () => {
    mockFetch(401, { detail: 'Invalid email or password' })
    renderWithProviders(<AuthForm mode="login" />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('University email'), 'ann@kbtu.kz')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
    expect(getAuthToken()).toBeNull()
  })
})
