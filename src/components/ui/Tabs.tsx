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
}

export function TabList({ children, className = '' }: TabListProps) {
  return (
    <div className={`flex gap-1 border-b border-sepia-800/40 ${className}`}>
      {children}
    </div>
  )
}

type TabProps = {
  value: string
  children: ReactNode
  className?: string
}

export function Tab({ value, children, className = '' }: TabProps) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tab must be used inside Tabs')

  const isActive = ctx.activeTab === value

  return (
    <button
      onClick={() => ctx.setActiveTab(value)}
      className={`tab ${isActive ? 'tab-active' : 'tab-inactive'} ${className}`}
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
