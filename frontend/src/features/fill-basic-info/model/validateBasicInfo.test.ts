import { describe, expect, it } from 'vitest'
import { EMPTY_PROFILE_DRAFT, type ProfileDraft } from '@/entities/profile'
import { validateBasicInfo } from './validateBasicInfo'

const valid: ProfileDraft = {
  ...EMPTY_PROFILE_DRAFT,
  fullName: 'Ann Lee',
  email: 'ann@kbtu.kz',
  university: 'KBTU',
  yearOfStudy: '2',
}

describe('validateBasicInfo', () => {
  it('accepts a complete step', () => {
    expect(validateBasicInfo(valid)).toEqual({})
  })

  it('reports every missing field', () => {
    expect(Object.keys(validateBasicInfo(EMPTY_PROFILE_DRAFT)).sort()).toEqual([
      'email',
      'fullName',
      'university',
      'yearOfStudy',
    ])
  })

  it('treats whitespace as empty and checks the email shape', () => {
    const errors = validateBasicInfo({ ...valid, fullName: '   ', email: 'ann@kbtu' })
    expect(errors).toEqual({ fullName: 'Enter your name', email: 'Enter a valid email' })
  })
})
