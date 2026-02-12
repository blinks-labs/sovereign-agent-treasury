'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, Clock, Activity } from 'lucide-react'

interface TreasuryData {
  totalBalance: number
  solBalance: number
  usdcBalance: number
  transactions: number
  uptime: string
  roi: number
}

export function TreasuryStats() {
  const [data, setData] = useState<TreasuryData>({
    totalBalance: 471.35,
    solBalance: 5.1,
    usdcBalance: 20,
    transactions: 30,
    uptime: '6h 24m',
    roi: 0.5
  })

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary-400" />
          Treasury Overview
        </h2>
        <span className="text-xs text-gray-500">Devnet Mode</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Balance"
          value={`$${data.totalBalance.toFixed(2)}`}
          icon={<Wallet className="w-4 h-4" />}
          trend="+2.4%"
        />
        <StatCard 
          label="SOL Holdings"
          value={`${data.solBalance} SOL`}
          icon={<TrendingUp className="w-4 h-4" />}
          trend="+5.1%"
        />
        <StatCard 
          label="USDC Holdings"
          value={`${data.usdcBalance} USDC`}
          icon={<Activity className="w-4 h-4" />}
          trend="Stable"
        />
        <StatCard 
          label="Transactions"
          value={data.transactions.toString()}
          icon={<Clock className="w-4 h-4" />}
          trend="Autonomous"
        />
      </div>

      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Treasury Address</p>
            <p className="text-xs font-mono text-gray-500 mt-1">
              9cnWNADTkSWGdtWTNhGA3YRJa5tEgtsu6MAaHJSQonjV
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">AI Cost</p>
            <p className="text-xl font-bold text-primary-400">$0.00</p>
            <p className="text-xs text-gray-500">Using Local Llama 3.1</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, trend }: { 
  label: string
  value: string
  icon: React.ReactNode
  trend: string
}) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-primary-400 mt-1">{trend}</p>
    </div>
  )
}