'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  userEmail: string
  navGroups: {
    label: string
    items: { name: string; href: string; icon: React.ReactNode }[]
  }[]
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ userEmail, navGroups, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside 
      className={`bg-surface border-r border-border flex flex-col h-full fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-0 md:w-[72px] -ml-[72px] md:ml-0' : 'w-[240px]'
      }`}
    >
      {/* Botão de Toggle (Desktop apenas) */}
      <button 
        onClick={onToggle}
        className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-surface border border-border rounded-full items-center justify-center shadow-sm text-text-muted hover:text-accent z-50"
      >
        <svg 
          className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Logo */}
      <header className={`h-[72px] flex items-center mb-4 transition-all ${isCollapsed ? 'px-4 justify-center' : 'px-6'}`}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20 shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-text-primary tracking-tight whitespace-nowrap animate-in fade-in duration-500">
              Sellmetrics
            </h1>
          )}
        </div>
      </header>

      {/* Navegação */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1.5">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] animate-in fade-in duration-500">
                {group.label}
              </p>
            )}
            <div className={isCollapsed ? 'space-y-2' : ''}>
              {group.items.map((item) => {
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.name : ''}
                    className={`flex items-center rounded-lg text-sm font-medium transition-all group relative ${
                      isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                    } ${
                      isActive 
                        ? 'bg-accent-light text-accent' 
                        : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary'
                    }`}
                  >
                    <span className={`${isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'} transition-colors shrink-0`}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="whitespace-nowrap animate-in slide-in-from-left-2 duration-300">
                        {item.name}
                      </span>
                    )}
                    {isActive && !isCollapsed && (
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-accent rounded-r-full" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / User */}
      <footer className={`p-4 border-t border-border mt-auto transition-all ${isCollapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center bg-slate-50/50 rounded-xl border border-slate-100/50 overflow-hidden ${
          isCollapsed ? 'justify-center p-1.5' : 'gap-3 px-2 py-2'
        }`}>
          <div className="w-8 h-8 rounded-full bg-accent-light text-accent flex items-center justify-center font-bold text-xs shadow-sm border border-accent/10 shrink-0">
            {userEmail[0].toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden flex-1 animate-in fade-in duration-500">
              <p className="text-xs font-bold text-text-primary truncate leading-tight">
                {userEmail.split('@')[0]}
              </p>
              <form action="/auth/signout" method="POST">
                <button className="text-[10px] text-text-muted hover:text-negative font-bold uppercase tracking-widest transition-colors mt-0.5">
                  Sair
                </button>
              </form>
            </div>
          )}
        </div>
      </footer>
    </aside>
  )
}
