'use client'

import { ReactNode, createContext, useContext, useState } from 'react'

type TabsContextType = {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextType | null>(null)

type TabsProps = {
  defaultTab: string
  children: ReactNode
  className?: string
  onChange?: (tab: string) => void
}

export function Tabs({ defaultTab, children, className = '', onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleChange = (tab: string) => {
    setActiveTab(tab)
    onChange?.(tab)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

type TabListProps = {
  children: ReactNode
  className?: string
  variant?: 'system' | 'sub'
}

export function TabList({ children, className = '', variant = 'system' }: TabListProps) {
  const borderClass = variant === 'sub'
    ? 'border-b border-[var(--soot)]'
    : 'border-b border-sepia-800/40'
  return (
    <div className={`flex gap-1 ${borderClass} ${className}`}>
      {children}
    </div>
  )
}

type TabProps = {
  value: string
  children: ReactNode
  className?: string
  variant?: 'system' | 'sub'
}

export function Tab({ value, children, className = '', variant = 'system' }: TabProps) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tab must be used inside Tabs')

  const isActive = ctx.activeTab === value
  const activeClass = variant === 'sub' ? 'sub-tab-active' : 'tab-active'
  const inactiveClass = variant === 'sub' ? 'sub-tab-inactive' : 'tab-inactive'

  return (
    <button
      onClick={() => ctx.setActiveTab(value)}
      className={`tab ${isActive ? activeClass : inactiveClass} ${className}`}
      role="tab"
      aria-selected={isActive}
    >
      {children}
    </button>
  )
}

type TabPanelProps = {
  value: string
  children: ReactNode
  className?: string
}

export function TabPanel({ value, children, className = '' }: TabPanelProps) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabPanel must be used inside Tabs')

  if (ctx.activeTab !== value) return null

  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  )
}
