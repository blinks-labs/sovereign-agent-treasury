'use client'

import { useState } from 'react'
import { Vote, CheckCircle, Clock, Users } from 'lucide-react'

interface Proposal {
  id: string
  title: string
  description: string
  status: 'active' | 'passed' | 'failed'
  votesFor: number
  votesAgainst: number
  endTime: string
  executed: boolean
}

const mockProposals: Proposal[] = [
  {
    id: '1',
    title: 'Increase Staking Allocation',
    description: 'Allocate 40% of treasury to Marinade staking for 8.5% APY',
    status: 'active',
    votesFor: 75,
    votesAgainst: 25,
    endTime: '2 days',
    executed: false
  },
  {
    id: '2',
    title: 'Add USDC Lending Strategy',
    description: 'Integrate Kamino Finance for 12% APY on USDC deposits',
    status: 'passed',
    votesFor: 89,
    votesAgainst: 11,
    endTime: 'Ended',
    executed: true
  },
]

export function GovernancePanel() {
  const [activeTab, setActiveTab] = useState<'active' | 'passed'>('active')

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Vote className="w-5 h-5 text-purple-400" />
          Governance
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users className="w-4 h-4" />
          <span>GOV Token</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            activeTab === 'active'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveTab('passed')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            activeTab === 'passed'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          History
        </button>
      </div>

      <div className="space-y-4">
        {mockProposals
          .filter(p => activeTab === 'active' ? p.status === 'active' : p.status !== 'active')
          .map((proposal) => (
          <div 
            key={proposal.id}
            className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm">{proposal.title}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                proposal.status === 'active' ? 'bg-purple-500/20 text-purple-400' :
                proposal.status === 'passed' ? 'bg-green-500/20 text-green-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {proposal.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{proposal.description}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-green-400">For: {proposal.votesFor}%</span>
                <span className="text-red-400">Against: {proposal.votesAgainst}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-red-500 rounded-full"
                  style={{ 
                    background: `linear-gradient(to right, #22c55e ${proposal.votesFor}%, #ef4444 ${proposal.votesFor}%)` 
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {proposal.endTime}
              </span>
              {proposal.executed && (
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Executed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 text-center">
          Connect wallet to vote with GOV tokens
        </p>
      </div>
    </div>
  )
}