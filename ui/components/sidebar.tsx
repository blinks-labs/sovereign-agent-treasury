'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Wallet, TrendingUp, Activity, Vote, Settings, Bot, Menu, X } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: TrendingUp },
  { name: 'Treasury', href: '/treasury', icon: Wallet },
  { name: 'Transactions', href: '/transactions', icon: Activity },
  { name: 'Governance', href: '/governance', icon: Vote },
  { name: 'Agent', href: '/agent', icon: Bot },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className={cn(
      "flex flex-col border-r bg-card transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">ClawDuck</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className={cn(
          "flex items-center gap-3 rounded-lg bg-muted p-3",
          collapsed && "justify-center"
        )}>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          {!collapsed && (
            <div className="flex-1">
              <p className="text-xs font-medium">Agent Online</p>
              <p className="text-xs text-muted-foreground">6h 24m uptime</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}