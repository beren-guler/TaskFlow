'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Şifreler eşleşmiyor'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/boards')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,.08) 0%, var(--bg) 60%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mb-4">
            <Zap size={22} className="text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Yeni Şifre Belirle</h1>
        </div>
        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            <div className="relative">
              <Input label="Yeni Şifre" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 8 karakter" minLength={8} required className="pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-[34px] text-[var(--text-3)] hover:text-[var(--text-2)]">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <Input label="Şifreyi Onayla" type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Şifreyi tekrar gir" minLength={8} required />
            <Button type="submit" className="w-full" loading={loading}>Şifreyi Güncelle</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
