import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function Button({
  children,
  variant = 'default',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive' }) {
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 cursor-pointer'
  const variants = {
    default: 'bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 shadow',
    outline: 'border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900',
    ghost: 'hover:bg-zinc-100 hover:text-zinc-900',
    destructive: 'bg-red-500 text-zinc-50 hover:bg-red-500/90 shadow-sm',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Badge({ children, variant = 'default', className = '' }: PropsWithChildren<{ variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger'; className?: string }>) {
  const variants = {
    default: 'border-transparent bg-zinc-900 text-zinc-50',
    secondary: 'border-transparent bg-zinc-100 text-zinc-900',
    outline: 'text-zinc-950 border-zinc-200',
    success: 'border-transparent bg-green-100 text-green-800',
    warning: 'border-transparent bg-orange-100 text-orange-800',
    danger: 'border-transparent bg-red-100 text-red-800',
  }
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 ${className}`}
      {...props}
    />
  )
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 ${className}`}
      {...props}
    />
  )
}
