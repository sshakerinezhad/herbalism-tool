import { InputHTMLAttributes, forwardRef } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="font-ui text-xs tracking-wider text-vellum-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 rounded-lg font-body
            bg-grimoire-950 border border-sepia-700/50 text-vellum-50
            placeholder:text-vellum-400/50
            focus:outline-none focus:border-bronze-muted
            focus:shadow-[0_0_0_1px_rgba(201,166,107,0.3)]
            transition-all duration-200
            ${error ? 'border-red-700/50' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-red-400 text-xs font-body">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
