export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}

export function formatDate(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function isOverdue(date: string | null): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

export const LABEL_COLORS: Record<string, string> = {
  bug:     '#EF4444',
  feature: '#3B82F6',
  urgent:  '#F97316',
  design:  '#8B5CF6',
  review:  '#10B981',
  docs:    '#F59E0B',
}

export const MEMBER_COLORS = [
  '#F97316','#3B82F6','#10B981','#8B5CF6',
  '#EC4899','#F59E0B','#06B6D4','#84CC16',
]

export function getMemberColor(userId: string, memberIds: string[]): string {
  const idx = memberIds.indexOf(userId)
  return MEMBER_COLORS[idx % MEMBER_COLORS.length] ?? '#6B7280'
}
