'use client'

import { useState } from 'react'
import { ArrowUpRight, ArrowDownRight, Clock, ExternalLink } from 'lucide-react'

interface Transaction {
  id: string
  type: 'stake' | 'lend' | 'swap' | 'claim'
  amount: string
  timestamp: string
  status: 'completed' | 'pending'
  txHash: string
}

const mockTransactions: Transaction[] = [
  { id: '1', type: 'stake', amount: '2.5 SOL', timestamp: '2 min ago', status: 'completed', txHash: '0x123...abc' },
  { id: '2', type: 'lend', amount: '10 USDC', timestamp: '15 min ago', status: 'completed', txHash: '0x456...def' },
  { id: '3', type: 'claim', amount: '0.5 SOL', timestamp: '1 hour ago', status: 'completed', txHash: '0x789...ghi' },
  { id: '4', type: 'swap', amount: '5 USDC → SOL', timestamp: '2 hours ago', status: 'completed', txHash: '0xabc...jkl' },
  { id: '5', type: 'stake', amount: '1.0 SOL', timestamp: '3 hours ago', status: 'completed', txHash: '0xdef...mno' },
]

export function TransactionHistory() {
  const [filter, setFilter] = useState<'all' | 'stake' | 'lend' | 'swap'>('all')

  const filteredTransactions = filter === 'all' 
    ? mockTransactions 
    : mockTransactions.filter(t => t.type === filter)

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent-400" />
          Transaction History
        </h2>
        <div className="flex gap-2">
          {(['all', 'stake', 'lend', 'swap'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
                filter === f 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredTransactions.map((tx) => (
          <div 
            key={tx.id}
            className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === 'stake' ? 'bg-primary-500/20 text-primary-400' :
                tx.type === 'lend' ? 'bg-accent-500/20 text-accent-400' :
                tx.type === 'swap' ? 'bg-purple-500/20 text-purple-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {tx.type === 'stake' && <ArrowUpRight className="w-5 h-5" />}
                {tx.type === 'lend' && <ArrowDownRight className="w-5 h-5" />}
                {tx.type === 'swap' && <ArrowUpRight className="w-5 h-5 rotate-45" />}
                {tx.type === 'claim' && <ArrowDownRight className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-semibold capitalize">{tx.type}</p>
                <p className="text-sm text-gray-400">{tx.timestamp}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{tx.amount}</p>
              <a 
                href={`https://explorer.solana.com/tx/${tx.txHash}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-400 flex items-center gap-1 hover:underline"
              >
                View <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}