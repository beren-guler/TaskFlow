'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')

    if (username.length < 3) { setError('Kullanıcı adı en az 3 karakter olmalı'); setLoading(false); return }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) { setError('Kullanıcı adı sadece harf, rakam, _ ve - içerebilir'); setLoading(false); return }

    // Check username uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (existing) { setError('Bu kullanıcı adı zaten alınmış'); setLoading(false); return }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.toLowerCase() },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,.08) 0%, var(--bg) 60%)' }}>
      <div className="glass rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-green-400"><polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--text)]">E-posta doğrulama gönderildi!</h2>
        <p className="text-sm text-[var(--text-2)]">{email} adresine doğrulama linki gönderdik. Lütfen e-postanı kontrol et.</p>
        <Link href="/login" className="block text-accent font-semibold hover:underline text-sm">Giriş sayfasına dön</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,.08) 0%, var(--bg) 60%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mb-4">
            <Zap size={22} className="text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Hesap Oluştur</h1>
          <p className="text-sm text-[var(--text-2)] mt-1">TaskFlow'a katıl</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            <Input label="Kullanıcı Adı" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="kullaniciadi" required />
            <Input label="E-posta" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sen@ornek.com" required />
            <div className="relative">
              <Input label="Şifre" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 8 karakter" minLength={8} required className="pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-[34px] text-[var(--text-3)] hover:text-[var(--text-2)]">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <Button type="submit" className="w-full" loading={loading}>Hesap Oluştur</Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-2)] mt-6">
          Zaten hesabın var mı?{' '}
          <Link href="/login" className="text-accent font-semibold hover:underline">Giriş yap</Link>
        </p>
      </div>
    </div>
  )
}
