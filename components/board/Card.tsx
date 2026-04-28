'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarDays, Tag } from 'lucide-react'
import { formatDate, isOverdue, LABEL_COLORS, getMemberColor } from '@/lib/utils'
import type { Card } from '@/types'

interface Props {
  card: Card
  onClick?: () => void
  isDragging?: boolean
  memberIds: string[]
  currentUserId: string
}

export default function CardComponent({ card, onClick, isDragging: isDraggingProp, memberIds, currentUserId }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  const dragging = isDragging || isDraggingProp
  const overdue = isOverdue(card.due_date)

  // Show colored border for last editor
  const editorColor = card.last_edited_by ? getMemberColor(card.last_edited_by, memberIds) : null

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        borderLeftColor: editorColor || 'transparent',
        borderLeftWidth: editorColor ? '3px' : '1px',
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={[
        'bg-[var(--surface-2)] rounded-xl p-3 cursor-pointer transition-all duration-150 touch-none select-none',
        'hover:border-accent/30 hover:bg-[var(--surface-3)]',
        dragging ? 'opacity-30 scale-105 shadow-2xl rotate-1' : 'opacity-100',
        'border border-transparent'
      ].join(' ')}
    >
      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map(label => (
            <span
              key={label}
              className="px-1.5 py-0.5 rounded text-xs font-semibold capitalize"
              style={{ background: (LABEL_COLORS[label] || '#6B7280') + '22', color: LABEL_COLORS[label] || '#6B7280' }}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm font-semibold text-[var(--text)] leading-snug">{card.title}</p>

      {card.description && (
        <p className="text-xs text-[var(--text-3)] mt-1 line-clamp-2">{card.description}</p>
      )}

      {/* Footer */}
      {(card.due_date || card.assignee) && (
        <div className="flex items-center justify-between mt-3 gap-2">
          {card.due_date ? (
            <span className={['flex items-center gap-1 text-xs font-medium', overdue ? 'text-red-400' : 'text-[var(--text-3)]'].join(' ')}>
              <CalendarDays size={11} />
              {formatDate(card.due_date)}
            </span>
          ) : <span />}

          {card.assignee && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: getMemberColor(card.assignee.id, memberIds) }}
              title={card.assignee.username}
            >
              {card.assignee.username[0].toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
