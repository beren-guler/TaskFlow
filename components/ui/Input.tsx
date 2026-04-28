import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider">{label}</label>}
      <input
        ref={ref}
        className={[
          'w-full px-3 py-2.5 rounded-lg bg-[var(--surface-2)] border text-sm text-[var(--text)]',
          'placeholder:text-[var(--text-3)] outline-none transition-all duration-150',
          error
            ? 'border-red-500/60 focus:border-red-500'
            : 'border-[var(--border)] focus:border-accent',
          className
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'
export default Input
