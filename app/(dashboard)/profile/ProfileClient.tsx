'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Copy, Check, ShieldCheck, Trash2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import type { Profile, Role } from '@/types'

const ROLES: { value: Role; label: string }[] = [
  { value: 'intern', label: 'Stajyer' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
]

interface Props { profile: Profile; email: string }

export default function ProfileClient({ profile: initial, email }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState(initial)
  const [username, setUsername] = useState(initial.username)
  const [fullName, setFullName] = useState(initial.full_name ?? '')
  const [role, setRole] = useState<Role | ''>(initial.role ?? '')
  const [saving, setSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Password section
  const [showPw, setShowPw] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  // Delete account
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const saveProfile = async () => {
    if (!role) { setProfileError('Lütfen bir rol seçin'); return }
    if (username.length < 3) { setProfileError('Kullanıcı adı en az 3 karakter olmalı'); return }
    setSaving(true); setProfileError(''); setProfileSuccess(false)

    // Username uniqueness check (excluding self)
    if (username !== initial.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle()
      if (existing) { setProfileError('Bu kullanıcı adı zaten alınmış'); setSaving(false); return }
    }

    const { error } = await supabase.from('profiles').update({
      username: username.toLowerCase(),
      full_name: fullName || null,
      role: role || null,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id)

    if (error) { setProfileError(error.message); setSaving(false); return }
    setProfileSuccess(true); setSaving(false)
    setTimeout(() => setProfileSuccess(false), 3000)
    router.refresh()
  }

  const changePassword = async () => {
    if (newPw !== confirmPw) { setPwError('Şifreler eşleşmiyor'); return }
    if (newPw.length < 8) { setPwError('Şifre en az 8 karakter olmalı'); return }
    setPwLoading(true); setPwError(''); setPwSuccess(false)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) { setPwError(error.message); setPwLoading(false); return }
    setPwSuccess(true); setPwLoading(false); setNewPw(''); setConfirmPw('')
    setTimeout(() => setPwSuccess(false), 3000)
  }

  const deleteAccount = async () => {
    setDeleteLoading(true)
    // Call edge function or use admin API - for now sign out
    await supabase.auth.signOut()
    router.push('/login')
  }

  const copyEmail = async () => {
    await navigator.clipboard.writeText(email)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--text)]">Profilim</h1>
        <p className="text-sm text-[var(--text-2)] mt-1">Hesap bilgilerini yönet</p>
      </div>

      {/* Avatar + basic info */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 border-2 border-accent/30 flex items-center justify-center text-accent font-extrabold text-2xl">
            {(profile.username ?? 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-[var(--text)] text-lg">{profile.username}</p>
            <p className="text-sm text-[var(--text-2)]">{email}</p>
            {profile.role && <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full font-semibold capitalize mt-1 inline-block">{profile.role}</span>}
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-5 space-y-4">
          {profileError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{profileError}</div>}
          {profileSuccess && <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">Profil güncellendi!</div>}

          <Input label="Kullanıcı Adı" value={username} onChange={e => setUsername(e.target.value)} />
          <Input label="Ad Soyad (opsiyonel)" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Adın ve soyadın" />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider">Rol</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={['px-4 py-2 rounded-xl text-sm font-semibold border transition-all', role === r.value ? 'border-accent bg-accent/10 text-accent' : 'border-[var(--border)] text-[var(--text-2)] hover:border-[var(--text-3)]'].join(' ')}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={saveProfile} loading={saving} className="w-full">
            <Save size={14} /> Profili Kaydet
          </Button>
        </div>
      </div>

      {/* Email */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-[var(--text)] flex items-center gap-2"><ShieldCheck size={16} className="text-accent" /> Hesap Güvenliği</h2>
        <div>
          <label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider block mb-1.5">E-posta</label>
          <div className="flex gap-2">
            <input readOnly value={email} className="flex-1 px-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-2)] outline-none" />
            <button onClick={copyEmail} className={['px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2', copied ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-[var(--border)] text-[var(--text-2)] hover:border-accent/40 hover:text-accent'].join(' ')}>
              {copied ? <Check size={14}/> : <Copy size={14}/>}
            </button>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-[var(--text)]">Şifre Değiştir</h2>
        {pwError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{pwError}</div>}
        {pwSuccess && <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">Şifre güncellendi!</div>}
        <div className="relative">
          <Input
            label="Yeni Şifre"
            type={showPw ? 'text' : 'password'}
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            placeholder="En az 8 karakter"
            className="pr-10"
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-[34px] text-[var(--text-3)] hover:text-[var(--text-2)]">
            {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
        </div>
        <Input label="Yeni Şifreyi Onayla" type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Şifreyi tekrar gir" />
        <Button onClick={changePassword} loading={pwLoading} variant="outline" className="w-full">Şifreyi Güncelle</Button>
      </div>

      {/* Danger zone */}
      <div className="border border-red-500/20 rounded-2xl p-6 space-y-4 bg-red-500/5">
        <h2 className="font-bold text-red-400">Tehlikeli Bölge</h2>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-all">
            <Trash2 size={14} /> Hesabı Sil
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-300">Hesabını silmek istediğine emin misin? Bu işlem geri alınamaz ve tüm board'larını, kartlarını siler.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-2)] text-sm font-semibold hover:border-[var(--text-3)] transition-all">İptal</button>
              <button onClick={deleteAccount} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50">
                {deleteLoading ? 'Siliniyor...' : 'Evet, Hesabı Sil'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
