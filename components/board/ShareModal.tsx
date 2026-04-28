'use client'
import { useState } from 'react'
import { Copy, Check, Globe, Lock, Users, Trash2, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { getMemberColor } from '@/lib/utils'
import type { Board, BoardMember, Profile } from '@/types'

interface Props {
  board: Board
  members: BoardMember[]
  ownerProfile: Profile | null
  currentUserId: string
  onClose: () => void
}

export default function ShareModal({ board, members: initialMembers, ownerProfile, currentUserId, onClose }: Props) {
  const supabase = createClient()
  const [members, setMembers] = useState(initialMembers)
  const [isPublic, setIsPublic] = useState(board.is_public)
  const [linkPerm, setLinkPerm] = useState<'viewer'|'editor'>(board.default_link_permission ?? 'viewer')
  const [copied, setCopied] = useState(false)
  const [inviteUsername, setInviteUsername] = useState('')
  const [invitePerm, setInvitePerm] = useState<'viewer'|'editor'>('editor')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')

  const allMemberIds = [board.owner_id, ...members.map(m => m.user_id)]
  const shareLink = `${location.origin}/board/${board.id}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareLink)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const updateVisibility = async (pub: boolean) => {
    setIsPublic(pub)
    await supabase.from('boards').update({ is_public: pub }).eq('id', board.id)
  }

  const updateLinkPerm = async (perm: 'viewer'|'editor') => {
    setLinkPerm(perm)
    await supabase.from('boards').update({ default_link_permission: perm }).eq('id', board.id)
  }

  const inviteMember = async () => {
    if (!inviteUsername.trim()) return
    setInviting(true); setInviteError('')
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', inviteUsername.trim().toLowerCase())
      .maybeSingle()
    if (!profile) { setInviteError('Kullanıcı bulunamadı'); setInviting(false); return }
    if (profile.id === currentUserId) { setInviteError('Kendinizi davet edemezsiniz'); setInviting(false); return }
    if (members.some(m => m.user_id === profile.id)) { setInviteError('Bu kullanıcı zaten üye'); setInviting(false); return }
    const { error } = await supabase.from('board_members').insert({
      board_id: board.id, user_id: profile.id, permission: invitePerm, invited_by: currentUserId
    })
    if (error) { setInviteError(`Davet gönderilemedi: ${error.message}`); setInviting(false); return }
    setMembers(prev => [...prev, { board_id: board.id, user_id: profile.id, permission: invitePerm, invited_by: currentUserId, created_at: new Date().toISOString(), profile }])
    setInviteUsername(''); setInviting(false)
  }

  const updatePermission = async (userId: string, permission: 'viewer'|'editor'|'admin') => {
    setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, permission } : m))
    await supabase.from('board_members').update({ permission }).eq('board_id', board.id).eq('user_id', userId)
  }

  const removeMember = async (userId: string) => {
    if (!confirm("Bu üyeyi board'dan çıkarmak istediğine emin misin?")) return
    setMembers(prev => prev.filter(m => m.user_id !== userId))
    await supabase.from('board_members').delete().eq('board_id', board.id).eq('user_id', userId)
  }

  return (
    <Modal open onClose={onClose} title="Board'u Paylaş" size="md">
      <div className="space-y-6">
        {/* Visibility */}
        <div>
          <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-3">Erişim Türü</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: false, icon: Lock, label: 'Özel', desc: 'Sadece davetliler görebilir' },
              { val: true, icon: Globe, label: 'Herkese Açık', desc: 'Link ile herkes görebilir' },
            ].map(({ val, icon: Icon, label, desc }) => (
              <button
                key={String(val)}
                onClick={() => updateVisibility(val)}
                className={['p-3 rounded-xl border text-left transition-all', isPublic === val ? 'border-accent bg-accent/5' : 'border-[var(--border)] hover:border-[var(--text-3)]'].join(' ')}
              >
                <Icon size={14} className={isPublic === val ? 'text-accent mb-1' : 'text-[var(--text-3)] mb-1'} />
                <p className={['text-sm font-semibold', isPublic === val ? 'text-accent' : 'text-[var(--text-2)]'].join(' ')}>{label}</p>
                <p className="text-xs text-[var(--text-3)] mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Link sharing */}
        <div>
          <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-3">Link ile Paylaş</p>
          <div className="flex gap-2 mb-2">
            <input readOnly value={shareLink} className="flex-1 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text-3)] outline-none" />
            <button onClick={copyLink} className={['px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2', copied ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] hover:border-accent/40 hover:text-accent'].join(' ')}>
              {copied ? <><Check size={14}/> Kopyalandı</> : <><Copy size={14}/> Kopyala</>}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-3)]">Link izni:</span>
            <select value={linkPerm} onChange={e => updateLinkPerm(e.target.value as 'viewer'|'editor')} className="px-2 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] outline-none">
              <option value="viewer">Görüntüleyici</option>
              <option value="editor">Düzenleyici</option>
            </select>
          </div>
        </div>

        {/* Invite */}
        <div>
          <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-3">Kullanıcı Davet Et</p>
          <div className="flex gap-2">
            <input
              value={inviteUsername}
              onChange={e => setInviteUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && inviteMember()}
              placeholder="kullanıcı adı..."
              className="flex-1 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-3)] outline-none focus:border-accent transition-colors"
            />
            <select value={invitePerm} onChange={e => setInvitePerm(e.target.value as 'viewer'|'editor')} className="px-2 py-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none">
              <option value="viewer">Görüntüleyici</option>
              <option value="editor">Düzenleyici</option>
            </select>
            <Button size="sm" onClick={inviteMember} loading={inviting}><UserPlus size={14}/></Button>
          </div>
          {inviteError && <p className="text-xs text-red-400 mt-1">{inviteError}</p>}
        </div>

        {/* Members list */}
        <div>
          <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-3 flex items-center gap-2"><Users size={12}/> Üyeler</p>
          <div className="space-y-2">
            {/* Owner */}
            {ownerProfile && (
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: getMemberColor(board.owner_id, allMemberIds) }}>
                  {ownerProfile.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--text)]">{ownerProfile.username}</p>
                </div>
                <span className="text-xs text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded-full">Sahip</span>
              </div>
            )}
            {members.map(member => {
              const profile = member.profile as Profile | undefined
              return (
                <div key={member.user_id} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: getMemberColor(member.user_id, allMemberIds) }}>
                    {(profile?.username ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--text)]">{profile?.username ?? member.user_id}</p>
                  </div>
                  <select
                    value={member.permission}
                    onChange={e => updatePermission(member.user_id, e.target.value as any)}
                    className="px-2 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] outline-none"
                  >
                    <option value="viewer">Görüntüleyici</option>
                    <option value="editor">Düzenleyici</option>
                    <option value="admin">Yönetici</option>
                  </select>
                  <button onClick={() => removeMember(member.user_id)} className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-red-400 hover:bg-red-400/10 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}
