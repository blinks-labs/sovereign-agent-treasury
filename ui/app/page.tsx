import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Wallet, TrendingUp, Activity, ArrowUpRight, Bot, Clock, Zap } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            The first economically self-sufficient AI agent
          </p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Agent Online
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$471.35</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              +2.4% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SOL Holdings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.1 SOL</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              +5.1% APY
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30</div>
            <p className="text-xs text-muted-foreground">Autonomous</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Cost</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">$0.00</div>
            <p className="text-xs text-muted-foreground">Local Llama 3.1</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Transactions */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest autonomous operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { type: 'Stake', amount: '2.5 SOL', time: '2 min ago', status: 'success' },
              { type: 'Lend', amount: '10 USDC', time: '15 min ago', status: 'success' },
              { type: 'Claim', amount: '0.5 SOL', time: '1 hour ago', status: 'success' },
              { type: 'Swap', amount: '5 USDC → SOL', time: '2 hours ago', status: 'success' },
              { type: 'Stake', amount: '1.0 SOL', time: '3 hours ago', status: 'success' },
            ].map((tx, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    tx.type === 'Stake' ? 'bg-blue-500/20 text-blue-500' :
                    tx.type === 'Lend' ? 'bg-yellow-500/20 text-yellow-500' :
                    tx.type === 'Swap' ? 'bg-purple-500/20 text-purple-500' :
                    'bg-green-500/20 text-green-500'
                  }`}>
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                  </div>
                </div>
                <p className="text-sm font-medium">{tx.amount}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Agent Status */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Agent Status</CardTitle>
            <CardDescription>Real-time monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold">ClawDuck</p>
                <p className="text-sm text-muted-foreground">Sovereign Treasury Agent</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Uptime</span>
                </div>
                <span className="text-sm font-medium">6h 24m</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Decisions</span>
                </div>
                <span className="text-sm font-medium">73</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Model</span>
                </div>
                <span className="text-sm font-medium">Llama 3.1</span>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium text-primary mb-1">Autonomous Mode</p>
              <p className="text-xs text-muted-foreground">
                Making decisions every 5 minutes without human intervention
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Governance Section */}
      <Card>
        <CardHeader>
          <CardTitle>Active Proposals</CardTitle>
          <CardDescription>Community governance via GOV token</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Increase Staking Allocation</h3>
                <Badge>Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Allocate 40% of treasury to Marinade staking for 8.5% APY
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-500">For: 75%</span>
                  <span className="text-red-500">Against: 25%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}