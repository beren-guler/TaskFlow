'use client'
import { useState, useEffect } from 'react'
import { X, Trash2, Tag, CalendarDays, User, AlignLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, LABEL_COLORS } from '@/lib/utils'
import Button from '@/components/ui/Button'
import type { Card, Profile } from '@/types'

const ALL_LABELS = ['bug', 'feature', 'urgent', 'design', 'review', 'docs']

interface Props {
  card: Card
  columnId: string
  canEdit: boolean
  members: Profile[]
  onUpdate: (card: Card) => void
  onDelete: (cardId: string) => void
  onClose: () => void
}

export default function CardModal({ card, columnId, canEdit, members, onUpdate, onDelete, onClose }: Props) {
  const supabase = createClient()
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [dueDate, setDueDate] = useState(card.due_date ? card.due_date.slice(0, 10) : '')
  const [assigneeId, setAssigneeId] = useState(card.assignee_id ?? '')
  const [labels, setLabels] = useState<string[]>(card.labels ?? [])
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const mark = () => setDirty(true)

  const save = async () => {
    setSaving(true)
    const assignee = members.find(m => m.id === assigneeId) ?? null
    const updated: Card = {
      ...card,
      title,
      description: description || null,
      due_date: dueDate || null,
      assignee_id: assigneeId || null,
      labels,
      assignee,
    }
    onUpdate(updated)
    setDirty(false)
    setSaving(false)
  }

  const toggleLabel = (l: string) => {
    setLabels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])
    mark()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl card-shadow overflow-hidden"
        style={{ animation: 'modalIn .15s ease-out' }}>
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-[var(--border)]">
          <div className="flex-1">
            {canEdit ? (
              <textarea
                value={title}
                onChange={e => { setTitle(e.target.value); mark() }}
                className="w-full bg-transparent text-lg font-bold text-[var(--text)] resize-none outline-none placeholder:text-[var(--text-3)]"
                rows={1}
                onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px' }}
              />
            ) : (
              <h2 className="text-lg font-bold text-[var(--text)]">{title}</h2>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-all shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
          {/* Left: main content */}
          <div className="col-span-2 space-y-5">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">
                <AlignLeft size={12} /> Açıklama
              </label>
              {canEdit ? (
                <textarea
                  value={description}
                  onChange={e => { setDescription(e.target.value); mark() }}
                  placeholder="Kart açıklaması ekle..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-3)] resize-none outline-none focus:border-accent transition-colors"
                />
              ) : (
                <p className="text-sm text-[var(--text-2)]">{description || 'Açıklama yok'}</p>
              )}
            </div>

            {/* Labels */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">
                <Tag size={12} /> Etiketler
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_LABELS.map(l => {
                  const active = labels.includes(l)
                  return (
                    <button
                      key={l}
                      disabled={!canEdit}
                      onClick={() => toggleLabel(l)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all"
                      style={{
                        background: active ? (LABEL_COLORS[l] + '33') : 'var(--surface-2)',
                        color: active ? LABEL_COLORS[l] : 'var(--text-3)',
                        border: `1px solid ${active ? LABEL_COLORS[l] + '66' : 'var(--border)'}`,
                      }}
                    >
                      {l}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: metadata */}
          <div className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">
                <User size={12} /> Atanan
              </label>
              {canEdit ? (
                <select
                  value={assigneeId}
                  onChange={e => { setAssigneeId(e.target.value); mark() }}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-accent transition-colors"
                >
                  <option value="">Atanmamış</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.username}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-[var(--text-2)]">
                  {card.assignee?.username ?? 'Atanmamış'}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">
                <CalendarDays size={12} /> Son Tarih
              </label>
              {canEdit ? (
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => { setDueDate(e.target.value); mark() }}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-accent transition-colors"
                />
              ) : (
                <p className="text-sm text-[var(--text-2)]">{formatDate(card.due_date) || 'Belirtilmemiş'}</p>
              )}
            </div>

            {card.last_edited_at && (
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-3)]">Son düzenleme</p>
                <p className="text-xs text-[var(--text-2)] mt-0.5">{new Date(card.last_edited_at).toLocaleString('tr-TR')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {canEdit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
            <button
              onClick={() => { if (confirm('Bu kartı silmek istediğine emin misin?')) onDelete(card.id) }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-all"
            >
              <Trash2 size={14} /> Sil
            </button>
            <Button onClick={save} loading={saving} disabled={!dirty} size="sm">
              Kaydet
            </Button>
          </div>
        )}
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  )
}
