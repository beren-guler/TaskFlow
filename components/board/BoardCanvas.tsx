'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, closestCorners,
  type DragStartEvent, type DragOverEvent, type DragEndEvent
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { createPortal } from 'react-dom'
import { Plus, Settings2, Share2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getLexoKey, getKeyAfter } from '@/lib/lexorank'
import { getMemberColor } from '@/lib/utils'
import ColumnComponent from './Column'
import CardComponent from './Card'
import CardModal from './CardModal'
import ShareModal from './ShareModal'
import type { Board, Column, Card, BoardMember, Profile } from '@/types'

interface Props {
  board: Board
  initialColumns: Column[]
  permission: 'viewer' | 'editor' | 'admin'
  members: BoardMember[]
  ownerProfile: Profile | null
  currentUserId: string
}

export default function BoardCanvas({ board, initialColumns, permission, members, ownerProfile, currentUserId }: Props) {
  const supabase = createClient()
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeColumn, setActiveColumn] = useState<Column | null>(null)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [editingColId, setEditingColId] = useState<string | null>(null)
  const [newColTitle, setNewColTitle] = useState('')
  const [addingCol, setAddingCol] = useState(false)
  const canEdit = permission === 'editor' || permission === 'admin'
  const isAdmin = permission === 'admin'

  // Member IDs for color assignment
  const allMemberIds = [
    board.owner_id,
    ...members.map(m => m.user_id)
  ]

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`board:${board.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => {
        refreshColumns()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${board.id}` }, () => {
        refreshColumns()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [board.id])

  const refreshColumns = async () => {
    const { data } = await supabase
      .from('columns')
      .select('*, cards(*, assignee:profiles!cards_assignee_id_fkey(*))')
      .eq('board_id', board.id)
      .order('order_key')
    if (data) {
      setColumns(data.map((col: any) => ({
        ...col,
        cards: (col.cards ?? []).sort((a: Card, b: Card) => a.order_key.localeCompare(b.order_key))
      })))
    }
  }

  const addColumn = async () => {
    if (!newColTitle.trim() || !canEdit) return
    const lastKey = columns[columns.length - 1]?.order_key ?? null
    const order_key = getKeyAfter(lastKey ?? 'n')
    const { data } = await supabase
      .from('columns')
      .insert({ board_id: board.id, title: newColTitle.trim(), order_key, color: '#253550' })
      .select()
      .single()
    if (data) setColumns(prev => [...prev, { ...data, cards: [] }])
    setNewColTitle(''); setAddingCol(false)
  }

  const updateColumnTitle = async (colId: string, title: string) => {
    if (!title.trim()) return
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, title } : c))
    await supabase.from('columns').update({ title }).eq('id', colId)
    setEditingColId(null)
  }

  const deleteColumn = async (colId: string) => {
    if (!confirm('Bu sütunu ve içindeki tüm kartları silmek istediğine emin misin?')) return
    setColumns(prev => prev.filter(c => c.id !== colId))
    await supabase.from('columns').delete().eq('id', colId)
  }

  const addCard = async (colId: string, title: string) => {
    if (!title.trim() || !canEdit) return
    const col = columns.find(c => c.id === colId)
    const lastKey = col?.cards[col.cards.length - 1]?.order_key ?? null
    const order_key = getKeyAfter(lastKey ?? 'n')
    const { data } = await supabase
      .from('cards')
      .insert({ column_id: colId, title: title.trim(), order_key, last_edited_by: currentUserId })
      .select('*, assignee:profiles!cards_assignee_id_fkey(*)')
      .single()
    if (data) {
      setColumns(prev => prev.map(c => c.id === colId ? { ...c, cards: [...c.cards, data] } : c))
    }
  }

  const updateCard = async (updated: Card) => {
    setColumns(prev => prev.map(col => ({
      ...col,
      cards: col.cards.map(c => c.id === updated.id ? updated : c)
    })))
    if (selectedCard?.id === updated.id) setSelectedCard(updated)
    await supabase.from('cards').update({
      title: updated.title,
      description: updated.description,
      due_date: updated.due_date,
      assignee_id: updated.assignee_id,
      labels: updated.labels,
      last_edited_by: currentUserId,
      last_edited_at: new Date().toISOString(),
    }).eq('id', updated.id)
  }

  const deleteCard = async (cardId: string) => {
    setColumns(prev => prev.map(col => ({ ...col, cards: col.cards.filter(c => c.id !== cardId) })))
    setSelectedCard(null)
    await supabase.from('cards').delete().eq('id', cardId)
  }

  // ── DnD Handlers ────────────────────────────────────────────────────────────
  const findColumnOfCard = (cardId: string) => columns.find(col => col.cards.some(c => c.id === cardId))
  const findCard = (cardId: string) => columns.flatMap(c => c.cards).find(c => c.id === cardId) ?? null

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === 'column') {
      setActiveColumn(columns.find(c => c.id === active.id) ?? null)
    } else {
      setActiveCard(findCard(String(active.id)))
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.data.current?.type === 'column') return
    const activeColId = findColumnOfCard(String(active.id))?.id
    const overColId = over.data.current?.type === 'column'
      ? String(over.id)
      : findColumnOfCard(String(over.id))?.id ?? String(over.id)
    if (!activeColId || activeColId === overColId) return
    setColumns(prev => {
      const card = prev.find(c => c.id === activeColId)?.cards.find(c => c.id === String(active.id))
      if (!card) return prev
      return prev.map(col => {
        if (col.id === activeColId) return { ...col, cards: col.cards.filter(c => c.id !== card.id) }
        if (col.id === overColId) return { ...col, cards: [...col.cards, { ...card, column_id: overColId }] }
        return col
      })
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null); setActiveColumn(null)
    if (!over || active.id === over.id) return

    if (active.data.current?.type === 'column') {
      // Column reorder
      const oldIdx = columns.findIndex(c => c.id === active.id)
      const newIdx = columns.findIndex(c => c.id === over.id)
      if (oldIdx === newIdx) return
      const reordered = arrayMove(columns, oldIdx, newIdx)
      setColumns(reordered)
      const prev = reordered[newIdx - 1]?.order_key ?? null
      const next = reordered[newIdx + 1]?.order_key ?? null
      const order_key = getLexoKey(prev, next)
      await supabase.from('columns').update({ order_key }).eq('id', active.id)
    } else {
      // Card reorder / move
      const col = columns.find(c => c.cards.some(card => card.id === active.id))
      if (!col) return
      const cards = col.cards
      const oldIdx = cards.findIndex(c => c.id === active.id)
      const newIdx = cards.findIndex(c => c.id === over.id)
      const finalIdx = newIdx === -1 ? cards.length - 1 : newIdx
      const reordered = arrayMove(cards, oldIdx, finalIdx)
      const prev = reordered[finalIdx - 1]?.order_key ?? null
      const next = reordered[finalIdx + 1]?.order_key ?? null
      const order_key = getLexoKey(prev, next)
      setColumns(prev2 => prev2.map(c => c.id === col.id ? { ...c, cards: reordered } : c))
      await supabase.from('cards').update({ order_key, column_id: col.id }).eq('id', active.id)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <Link href="/boards" className="p-2 rounded-lg text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-all">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="font-extrabold text-lg text-[var(--text)] flex-1">{board.title}</h1>
        
        {/* Online members */}
        <div className="flex -space-x-2">
          {[ownerProfile, ...members.map(m => m.profile)].filter(Boolean).slice(0, 5).map((p: any, i) => (
            <div
              key={p.id}
              title={p.username}
              className="w-7 h-7 rounded-full border-2 border-[var(--surface)] flex items-center justify-center text-xs font-bold text-white"
              style={{ background: getMemberColor(p.id, allMemberIds), zIndex: 10 - i }}
            >
              {p.username[0].toUpperCase()}
            </div>
          ))}
        </div>

        {isAdmin && (
          <button onClick={() => setShowShare(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-[var(--text-2)] border border-[var(--border)] hover:border-accent/40 hover:text-accent transition-all">
            <Share2 size={14} /> Paylaş
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4 h-full items-start min-w-max">
              {columns.map(col => (
                <ColumnComponent
                  key={col.id}
                  column={col}
                  canEdit={canEdit}
                  isEditing={editingColId === col.id}
                  onEditTitle={() => setEditingColId(col.id)}
                  onSaveTitle={title => updateColumnTitle(col.id, title)}
                  onCancelEdit={() => setEditingColId(null)}
                  onDelete={() => deleteColumn(col.id)}
                  onAddCard={title => addCard(col.id, title)}
                  onCardClick={card => { setSelectedCard(card); setSelectedColumnId(col.id) }}
                  memberIds={allMemberIds}
                  currentUserId={currentUserId}
                />
              ))}

              {/* Add Column */}
              {canEdit && (
                addingCol ? (
                  <div className="w-72 shrink-0 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3">
                    <input
                      autoFocus
                      value={newColTitle}
                      onChange={e => setNewColTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addColumn(); if (e.key === 'Escape') { setAddingCol(false); setNewColTitle('') } }}
                      placeholder="Sütun adı..."
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-3)] outline-none focus:border-accent"
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={addColumn} className="flex-1 py-1.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-[var(--accent-h)]">Ekle</button>
                      <button onClick={() => { setAddingCol(false); setNewColTitle('') }} className="px-3 py-1.5 rounded-lg text-[var(--text-3)] hover:bg-[var(--surface-2)] text-sm">İptal</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingCol(true)}
                    className="w-72 shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-[var(--border)] text-[var(--text-3)] hover:border-accent/40 hover:text-accent transition-all text-sm font-semibold"
                  >
                    <Plus size={16} /> Sütun Ekle
                  </button>
                )
              )}
            </div>
          </SortableContext>

          {typeof window !== 'undefined' && createPortal(
            <DragOverlay>
              {activeCard && <CardComponent card={activeCard} isDragging memberIds={allMemberIds} currentUserId={currentUserId} />}
              {activeColumn && (
                <div className="w-72 opacity-80 rotate-2 bg-[var(--surface-2)] border border-accent/30 rounded-2xl p-3">
                  <p className="font-bold text-sm text-[var(--text)]">{activeColumn.title}</p>
                </div>
              )}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          columnId={selectedColumnId!}
          canEdit={canEdit}
          members={[ownerProfile, ...members.map(m => m.profile)].filter(Boolean) as Profile[]}
          onUpdate={updateCard}
          onDelete={deleteCard}
          onClose={() => { setSelectedCard(null); setSelectedColumnId(null) }}
        />
      )}

      {/* Share Modal */}
      {showShare && (
        <ShareModal
          board={board}
          members={members}
          ownerProfile={ownerProfile}
          currentUserId={currentUserId}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
