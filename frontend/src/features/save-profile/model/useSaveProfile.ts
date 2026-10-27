import { useMutation, useQueryClient } from '@tanstack/react-query'
import { matchKeys } from '@/entities/match'
import { profileKeys, saveMyProfile, toProfileDto, type ProfileDraft } from '@/entities/profile'
import { viewerKeys } from '@/entities/viewer'
import { errorMessage } from '@/shared/api'

export function useSaveProfile() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (draft: ProfileDraft) => saveMyProfile(toProfileDto(draft)),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.me, profile)
      queryClient.invalidateQueries({ queryKey: viewerKeys.me })
      queryClient.invalidateQueries({ queryKey: matchKeys.all })
    },
  })

  return {
    save: async (draft: ProfileDraft): Promise<boolean> => {
      try {
        await mutation.mutateAsync(draft)
        return true
      } catch {
        return false
      }
    },
    saving: mutation.isPending,
    error: mutation.isError ? errorMessage(mutation.error, 'Could not save your profile') : null,
  }
}
