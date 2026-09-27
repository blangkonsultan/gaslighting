import { useMutation, useQuery } from "@tanstack/react-query"
import { queryClient, queryKeys } from "@/lib/query-client"
import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  type CreateTemplateInput,
} from "@/services/transaction-templates.service"

export function useTransactionTemplates(userId: string) {
  return useQuery({
    queryKey: queryKeys.templates.all(userId),
    queryFn: () => getTemplates(userId),
    enabled: Boolean(userId),
  })
}

export function useCreateTemplate() {
  return useMutation({
    mutationFn: (input: CreateTemplateInput) => createTemplate(input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.templates.all(variables.user_id),
      })
    },
  })
}

export function useDeleteTemplate() {
  return useMutation({
    mutationFn: ({ userId, templateId }: { userId: string; templateId: string }) =>
      deleteTemplate(userId, templateId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.templates.all(variables.userId),
      })
    },
  })
}
