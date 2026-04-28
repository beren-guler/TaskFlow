'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Layout, Trash2, Users, Globe, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import type { Board } from '@/types'

interface BoardsClientProps {
  myBoards: Board[]
  sharedBoards: (Board & { _permission: string })[]
  userId: string
}

export default function BoardsClient({ myBoards: initial, sharedBoards, userId }: BoardsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [myBoards, setMyBoards] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const createBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    setCreateError('')
    const { data, error } = await supabase
      .from('boards')
      .insert({ title: title.trim(), owner_id: userId })
      .select()
      .single()
    if (error) {
      setCreateError(error.message)
      setCreating(false)
      return
    }
    if (data) {
      setMyBoards(prev => [data, ...prev])
      setCreating(false); setShowCreate(false); setTitle('')
      router.push(`/board/${data.id}`)
    }
  }

  const deleteBoard = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm("Bu board'u silmek istediğine emin misin?")) return
    await supabase.from('boards').delete().eq('id', id)
    setMyBoards(prev => prev.filter(b => b.id !== id))
  }

  const BoardCard = ({ board, permission }: { board: Board, permission?: string }) => (
    <Link href={`/board/${board.id}`}>
      <div className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-accent/40 hover:bg-[var(--surface-2)] transition-all duration-200 card-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: board.background_color || '#172031' }}>
            <Layout size={18} className="text-[var(--text-2)]" />
          </div>
          <div className="flex items-center gap-1">
            {board.is_public ? <Globe size={12} className="text-[var(--text-3)]" /> : <Lock size={12} className="text-[var(--text-3)]" />}
            {permission && <span className="text-xs text-[var(--text-3)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full capitalize">{permission}</span>}
            {!permission && (
              <button onClick={e => deleteBoard(board.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-3)] hover:text-red-400 hover:bg-red-400/10 transition-all">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
        <h3 className="font-bold text-[var(--text)] mb-1 truncate">{board.title}</h3>
        {board.description && <p className="text-xs text-[var(--text-2)] line-clamp-2">{board.description}</p>}
        <p className="text-xs text-[var(--text-3)] mt-3">{new Date(board.updated_at).toLocaleDateString('tr-TR')}</p>
      </div>
    </Link>
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Board'larım</h1>
          <p className="text-sm text-[var(--text-2)] mt-1">Projelerini yönet ve takımınla çalış</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Yeni Board
        </Button>
      </div>

      {/* My Boards */}
      {myBoards.length === 0 && sharedBoards.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
            <Layout size={28} className="text-[var(--text-3)]" />
          </div>
          <h3 className="font-bold text-[var(--text)] mb-2">Henüz board yok</h3>
          <p className="text-sm text-[var(--text-2)] mb-6">İlk board'unu oluştur ve görevlerini yönetmeye başla</p>
          <Button onClick={() => setShowCreate(true)}><Plus size={16}/> Board Oluştur</Button>
        </div>
      ) : (
        <>
          {myBoards.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-bold text-[var(--text-2)] uppercase tracking-wider mb-4">Benim Boardlarım</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {myBoards.map(b => <BoardCard key={b.id} board={b} />)}
              </div>
            </section>
          )}
          {sharedBoards.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[var(--text-2)] uppercase tracking-wider mb-4 flex items-center gap-2"><Users size={14}/> Benimle Paylaşılanlar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sharedBoards.map(b => <BoardCard key={b.id} board={b} permission={b._permission} />)}
              </div>
            </section>
          )}
        </>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Yeni Board Oluştur" size="sm">
        <form onSubmit={createBoard} className="space-y-4">
          {createError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{createError}</div>}
          <Input label="Board Adı" value={title} onChange={e => setTitle(e.target.value)} placeholder="Proje adını gir..." required autoFocus />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowCreate(false)}>İptal</Button>
            <Button className="flex-1" type="submit" loading={creating}>Oluştur</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
