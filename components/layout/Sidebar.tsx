'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, User, LogOut, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface SidebarProps { profile: Profile | null }

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/boards', icon: LayoutDashboard, label: 'Boards' },
    { href: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <aside className="w-60 shrink-0 flex flex-col h-screen sticky top-0 bg-[var(--surface)] border-r border-[var(--border)]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <span className="font-extrabold text-lg tracking-tight text-[var(--text)]">TaskFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all',
                active
                  ? 'bg-accent/10 text-accent'
                  : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              ].join(' ')}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold text-sm shrink-0">
            {(profile?.username ?? 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text)] truncate">{profile?.username ?? 'User'}</p>
            <p className="text-xs text-[var(--text-3)] capitalize">{profile?.role ?? 'Member'}</p>
          </div>
          <button onClick={signOut} className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-red-400 hover:bg-red-400/10 transition-all" title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
