import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { mockFetch, renderWithProviders } from '@/test/render'
import { VerifyEmailForm } from './VerifyEmailForm'

describe('VerifyEmailForm', () => {
  it('keeps only digits and sends the code', async () => {
    const fetchMock = mockFetch(204, null)
    renderWithProviders(<VerifyEmailForm email="ann@kbtu.kz" onSwitchAccount={vi.fn()} />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Verification code'), '12a34-56')
    expect(screen.getByLabelText('Verification code')).toHaveValue('123456')
    await user.click(screen.getByRole('button', { name: 'Verify' }))

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/verify')
    expect(init?.body).toBe(JSON.stringify({ code: '123456' }))
  })

  it('asks for six digits before calling the server', async () => {
    const fetchMock = mockFetch(204, null)
    renderWithProviders(<VerifyEmailForm email="ann@kbtu.kz" onSwitchAccount={vi.fn()} />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Verification code'), '123')
    await user.click(screen.getByRole('button', { name: 'Verify' }))

    expect(screen.getByText('Enter the 6-digit code from the email')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows a wrong code error and lets the user switch accounts', async () => {
    mockFetch(400, { detail: 'Wrong code. Check the email and try again.' })
    const onSwitchAccount = vi.fn()
    renderWithProviders(<VerifyEmailForm email="ann@kbtu.kz" onSwitchAccount={onSwitchAccount} />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Verification code'), '000000')
    await user.click(screen.getByRole('button', { name: 'Verify' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong code')

    await user.click(screen.getByRole('button', { name: 'Use another account' }))
    expect(onSwitchAccount).toHaveBeenCalled()
  })

  it('does not allow a new code until the cooldown ends', () => {
    renderWithProviders(<VerifyEmailForm email="ann@kbtu.kz" onSwitchAccount={vi.fn()} />)
    expect(screen.getByRole('button', { name: /send a new code in 60s/ })).toBeDisabled()
  })
})
