import { useState } from 'react'
import { createProfile, toProfileDto, updateProfile, type ProfileDraft } from '@/entities/profile'

export function useSaveProfile() {
  const [profileId, setProfileId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (draft: ProfileDraft): Promise<boolean> => {
    setSaving(true)
    setError(null)
    try {
      const dto = toProfileDto(draft)
      const profile = profileId === null ? await createProfile(dto) : await updateProfile(profileId, dto)
      setProfileId(profile.id)
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your profile')
      return false
    } finally {
      setSaving(false)
    }
  }

  return { save, saving, error }
}
