'use client'

import { useEffect, useState } from 'react'
import { Bot, Zap, Activity, Server } from 'lucide-react'

interface AgentMetrics {
  status: 'online' | 'deciding' | 'executing'
  uptime: string
  decisionsMade: number
  lastDecision: string
  model: string
  costPerDay: number
}

export function AgentStatus() {
  const [metrics, setMetrics] = useState<AgentMetrics>({
    status: 'online',
    uptime: '6h 24m',
    decisionsMade: 73,
    lastDecision: '2 min ago',
    model: 'Llama 3.1',
    costPerDay: 0
  })

  const statusColors = {
    online: 'bg-green-500',
    deciding: 'bg-yellow-500 animate-pulse',
    executing: 'bg-blue-500 animate-pulse'
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          Agent Status
        </h2>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColors[metrics.status]}`} />
          <span className="text-xs text-gray-400 capitalize">{metrics.status}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-800/30 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold">ClawDuck</p>
              <p className="text-xs text-gray-400">Sovereign Treasury Agent</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Uptime
              </p>
              <p className="font-semibold">{metrics.uptime}</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Decisions
              </p>
              <p className="font-semibold">{metrics.decisionsMade}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <Server className="w-4 h-4" /> AI Model
            </span>
            <span className="text-sm font-medium">{metrics.model}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Last Decision
            </span>
            <span className="text-sm font-medium">{metrics.lastDecision}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Daily Cost
            </span>
            <span className="text-sm font-bold text-green-400">${metrics.costPerDay.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-xl border border-primary-500/20">
          <p className="text-sm font-semibold text-primary-400 mb-1">Autonomous Mode</p>
          <p className="text-xs text-gray-400">
            Making decisions every 5 minutes without human intervention
          </p>
        </div>
      </div>
    </div>
  )
}