'use client'

import { Trophy, Target, Clock, ExternalLink } from 'lucide-react'

export function HackathonBanner() {
  return (
    <div className="max-w-7xl mx-auto mb-8">
      <div className="bg-gradient-to-r from-purple-900/50 via-gray-900/50 to-primary-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Hackathon Submissions</h2>
              <p className="text-gray-400 text-sm">Competing for $300k in prizes across 2 hackathons</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <HackathonCard 
              name="Colosseum"
              prize="$100k"
              project="#534"
              status="Submitted"
              url="https://colosseum.com/agent-hackathon/projects/sovereign-agent-treasury"
            />
            <HackathonCard 
              name="Moltiverse"
              prize="$200k"
              project="Submitted"
              status="Active"
              url="https://www.moltbook.com/post/e605c946-0ffb-48f5-9939-e2c7d7b0991f"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700/50 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Metric label="Target Prize" value="Most Agentic ($5k)" icon={<Target className="w-4 h-4" />} />
          <Metric label="Deadline" value="Feb 13, 2026" icon={<Clock className="w-4 h-4" />} />
          <Metric label="Status" value="Live Demo" icon={<Trophy className="w-4 h-4" />} />
          <Metric label="AI Cost" value="$0.00" icon={<Trophy className="w-4 h-4" />} highlight />
        </div>
      </div>
    </div>
  )
}

function HackathonCard({ name, prize, project, status, url }: {
  name: string
  prize: string
  project: string
  status: string
  url: string
}) {
  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-gray-800/50 hover:bg-gray-800/70 transition-colors rounded-xl p-3 border border-gray-700/50 hover:border-primary-500/30"
    >
      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
        <Trophy className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-semibold text-sm">{name}</p>
        <p className="text-xs text-primary-400">{prize} Prize Pool</p>
      </div>
      <div className="ml-2 text-right">
        <p className="text-xs text-gray-400">{project}</p>
        <p className="text-xs text-green-400">{status}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-500" />
    </a>
  )
}

function Metric({ label, value, icon, highlight }: {
  label: string
  value: string
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm font-semibold ${highlight ? 'text-primary-400' : ''}`}>{value}</p>
      </div>
    </div>
  )
}