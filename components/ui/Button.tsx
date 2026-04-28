import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none'

const variants = {
  primary: 'bg-accent text-white hover:bg-[var(--accent-h)] active:scale-[.98]',
  ghost:   'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
  danger:  'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
  outline: 'border border-[var(--border)] text-[var(--text-2)] hover:border-[var(--text-3)] hover:text-[var(--text)] bg-transparent',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[base, variants[variant], sizes[size], className].join(' ')}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
export default Button
