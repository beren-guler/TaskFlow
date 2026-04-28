'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Zap, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true); setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,.08) 0%, var(--bg) 60%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mb-4">
            <Zap size={22} className="text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Şifreni Sıfırla</h1>
          <p className="text-sm text-[var(--text-2)] mt-1">E-postana sıfırlama linki gönderelim</p>
        </div>

        {sent ? (
          <div className="glass rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-green-400"><polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-sm text-[var(--text-2)]">{email} adresine şifre sıfırlama linki gönderdik.</p>
            <Link href="/login" className="flex items-center justify-center gap-2 text-accent text-sm font-semibold hover:underline"><ArrowLeft size={14}/> Giriş sayfasına dön</Link>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
              <Input label="E-posta" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sen@ornek.com" required />
              <Button type="submit" className="w-full" loading={loading}>Sıfırlama Linki Gönder</Button>
            </form>
            <Link href="/login" className="flex items-center justify-center gap-2 text-[var(--text-3)] text-sm mt-4 hover:text-[var(--text-2)]"><ArrowLeft size={14}/> Geri dön</Link>
          </div>
        )}
      </div>
    </div>
  )
}
