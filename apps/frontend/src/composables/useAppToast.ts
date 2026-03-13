import { useToast } from '@nuxt/ui'

export function useAppToast() {
  const toast = useToast()

  return {
    success: (title: string) => toast.add({ title, color: 'success', icon: 'i-lucide-check' }),
    error: (title: string) => toast.add({ title, color: 'error', icon: 'i-lucide-x' }),
    warning: (title: string) => toast.add({ title, color: 'warning', icon: 'i-lucide-alert-triangle' }),
    info: (title: string) => toast.add({ title, color: 'info', icon: 'i-lucide-info' }),
  }
}
