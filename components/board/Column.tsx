'use client'
import { useState, useRef, useEffect } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical } from 'lucide-react'
import CardComponent from './Card'
import type { Column, Card } from '@/types'

interface Props {
  column: Column
  canEdit: boolean
  isEditing: boolean
  onEditTitle: () => void
  onSaveTitle: (title: string) => void
  onCancelEdit: () => void
  onDelete: () => void
  onAddCard: (title: string) => void
  onCardClick: (card: Card) => void
  memberIds: string[]
  currentUserId: string
}

export default function ColumnComponent({
  column, canEdit, isEditing, onEditTitle, onSaveTitle, onCancelEdit, onDelete, onAddCard, onCardClick, memberIds, currentUserId
}: Props) {
  const [adding, setAdding] = useState(false)
  const [cardTitle, setCardTitle] = useState('')
  const [titleVal, setTitleVal] = useState(column.title)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column' },
    disabled: !canEdit,
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setShowMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const submitCard = () => {
    if (cardTitle.trim()) onAddCard(cardTitle.trim())
    setCardTitle(''); setAdding(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="w-72 shrink-0 flex flex-col rounded-2xl bg-[var(--surface)] border border-[var(--border)] max-h-[calc(100vh-160px)]"
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-[var(--border)]">
        {canEdit && (
          <button {...attributes} {...listeners} className="text-[var(--text-3)] hover:text-[var(--text-2)] cursor-grab active:cursor-grabbing p-0.5 touch-none">
            <GripVertical size={14} />
          </button>
        )}

        {isEditing ? (
          <input
            autoFocus
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSaveTitle(titleVal); if (e.key === 'Escape') onCancelEdit() }}
            onBlur={() => onSaveTitle(titleVal)}
            className="flex-1 bg-transparent text-sm font-bold text-[var(--text)] outline-none border-b border-accent"
          />
        ) : (
          <h3
            className="flex-1 text-sm font-bold text-[var(--text)] truncate"
            onDoubleClick={canEdit ? onEditTitle : undefined}
          >
            {column.title}
          </h3>
        )}

        <span className="text-xs text-[var(--text-3)] font-mono bg-[var(--surface-2)] px-1.5 py-0.5 rounded">
          {column.cards.length}
        </span>

        {canEdit && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-all"
            >
              <MoreHorizontal size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 w-40 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-1 shadow-xl z-20">
                <button onClick={() => { onEditTitle(); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-all">
                  <Pencil size={12} /> Yeniden Adlandır
                </button>
                <button onClick={() => { onDelete(); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 size={12} /> Sütunu Sil
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <SortableContext items={column.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.map(card => (
            <CardComponent
              key={card.id}
              card={card}
              onClick={() => onCardClick(card)}
              memberIds={memberIds}
              currentUserId={currentUserId}
            />
          ))}
        </SortableContext>

        {adding && (
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-2 space-y-2">
            <textarea
              autoFocus
              value={cardTitle}
              onChange={e => setCardTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitCard() }; if (e.key === 'Escape') { setAdding(false); setCardTitle('') } }}
              placeholder="Kart başlığı..."
              rows={2}
              className="w-full bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-3)] resize-none outline-none"
            />
            <div className="flex gap-2">
              <button onClick={submitCard} className="flex-1 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-[var(--accent-h)]">Ekle</button>
              <button onClick={() => { setAdding(false); setCardTitle('') }} className="px-3 py-1.5 rounded-lg text-[var(--text-3)] hover:bg-[var(--surface-3)] text-xs">İptal</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Card Button */}
      {canEdit && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 m-2 px-3 py-2 rounded-xl text-[var(--text-3)] hover:text-accent hover:bg-accent/5 transition-all text-xs font-semibold"
        >
          <Plus size={14} /> Kart Ekle
        </button>
      )}
    </div>
  )
}
