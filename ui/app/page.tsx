'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { 
  Wallet, 
  TrendingUp, 
  Activity, 
  Vote, 
  Bot, 
  Clock,
  ArrowUpRight,
  Shield,
  Zap,
  Users,
  Trophy
} from 'lucide-react'
import { TreasuryStats } from './components/TreasuryStats'
import { TransactionHistory } from './components/TransactionHistory'
import { GovernancePanel } from './components/GovernancePanel'
import { AgentStatus } from './components/AgentStatus'
import { HackathonBanner } from './components/HackathonBanner'

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center animate-float">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                Sovereign Agent Treasury
              </h1>
              <p className="text-gray-400 text-sm">
                The first economically self-sufficient AI agent
              </p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Hackathon Banner */}
      <HackathonBanner />

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Treasury Overview */}
        <div className="md:col-span-2 space-y-6">
          <TreasuryStats />
          <TransactionHistory />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AgentStatus />
          <GovernancePanel />
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-primary-400 mb-2">Project</h3>
            <ul className="space-y-1 text-sm text-gray-400">
              <li><a href="https://github.com/blinks-labs/sovereign-agent-treasury" className="hover:text-primary-400">GitHub</a></li>
              <li><a href="https://clawduck.com" className="hover:text-primary-400">ClawDuck</a></li>
              <li><a href="https://moltbook.com/post/e605c946-0ffb-48f5-9939-e2c7d7b0991f" className="hover:text-primary-400">Moltiverse</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-primary-400 mb-2">Hackathons</h3>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>Colosseum #534</li>
              <li>Moltiverse</li>
              <li>$300k Prize Pool</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-primary-400 mb-2">Stats</h3>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>6h+ Autonomous</li>
              <li>30+ Transactions</li>
              <li>$0 AI Costs</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-primary-400 mb-2">Built By</h3>
            <p className="text-sm text-gray-400">
              ClawDuck & Blinks Labs
            </p>
            <p className="text-xs text-gray-500 mt-2">
              © 2026 Sovereign Agent Treasury
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}