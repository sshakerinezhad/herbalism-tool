import { InputHTMLAttributes, forwardRef } from 'react'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          className="
            w-4 h-4 rounded border border-sepia-700/50 bg-grimoire-950
            checked:bg-bronze-muted checked:border-bronze-muted
            focus:ring-1 focus:ring-bronze-muted/50 focus:ring-offset-0
            transition-colors duration-200
            accent-[#8b7355]
          "
          {...props}
        />
        {label && <span className="font-body text-vellum-200">{label}</span>}
      </label>
    )
  }
)
Checkbox.displayName = 'Checkbox'
