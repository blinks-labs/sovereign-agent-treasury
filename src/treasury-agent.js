import fetch from 'node-fetch';
import { Logger } from './utils/logger.js';
import { DecisionEngine } from './engines/decision-engine.js';
import { AgentWallet } from './services/agent-wallet.js';
import { DeFiStrategies } from './strategies/defi-strategies.js';
import { CostManager } from './services/cost-manager.js';
import { PerformanceTracker } from './services/performance-tracker.js';

/**
 * The autonomous treasury agent that manages its own wealth
 * Achieves economic self-sufficiency through DeFi strategies
 */
export class TreasuryAgent {
    constructor(config) {
        this.config = config;
        this.logger = new Logger('TREASURY_AGENT');
        this.isActive = false;
        
        // Initialize core services
        this.wallet = new AgentWallet(config);
        this.decisionEngine = new DecisionEngine();
        this.defiStrategies = new DeFiStrategies(this.wallet);
        this.costManager = new CostManager(this.wallet);
        this.performanceTracker = new PerformanceTracker();
        
        // Autonomous loop interval (5 minutes)
        this.loopInterval = 5 * 60 * 1000;
        this.lastDecisionTime = 0;
        
        this.logger.info('🦆 TreasuryAgent initialized with addresses:');
        this.logger.info(`   Solana: ${config.solanaAddress}`);
        this.logger.info(`   EVM: ${config.evmAddress}`);
    }

    async initialize() {
        this.logger.info('🚀 Initializing autonomous treasury operations...');
        
        try {
            // Initialize all services
            await this.wallet.initialize();
            await this.decisionEngine.initialize();
            await this.defiStrategies.initialize();
            await this.performanceTracker.initialize();
            
            // Get initial state
            const balances = await this.wallet.getBalances();
            const initialValue = await this.calculateTotalValue(balances);
            
            this.logger.info(`💰 Initial treasury value: $${initialValue.toFixed(2)}`);
            
            // Record starting point
            await this.performanceTracker.recordSnapshot('initialization', {
                totalValue: initialValue,
                balances: balances,
                timestamp: Date.now()
            });
            
            this.isActive = true;
            this.logger.info('✅ Treasury agent initialization complete');
            
        } catch (error) {
            this.logger.error('❌ Initialization failed:', error);
            throw error;
        }
    }

    async startAutonomousLoop() {
        this.logger.info('🔄 Starting autonomous decision loop...');
        this.logger.info(`   Interval: ${this.loopInterval / 1000}s`);
        
        // Immediate first run
        await this.autonomousDecisionCycle();
        
        // Set up recurring loop
        this.loopTimer = setInterval(async () => {
            try {
                await this.autonomousDecisionCycle();
            } catch (error) {
                this.logger.error('Error in autonomous loop:', error);
                // Continue running even if one cycle fails
            }
        }, this.loopInterval);
    }

    async autonomousDecisionCycle() {
        if (!this.isActive) return;
        
        const cycleStart = Date.now();
        this.logger.info('🧠 Starting autonomous decision cycle...');
        
        try {
            // 1. Assess current state
            const currentState = await this.assessCurrentState();
            this.logger.info(`📊 Current treasury value: $${currentState.totalValue.toFixed(2)}`);
            
            // 2. Pay for our own compute costs
            await this.payComputeCosts();
            
            // 3. Make investment decisions using AI
            const decisions = await this.decisionEngine.analyzeAndDecide(currentState);
            
            // 4. Execute decisions autonomously
            if (decisions.length > 0) {
                this.logger.info(`🎯 Executing ${decisions.length} autonomous decisions...`);
                await this.executeDecisions(decisions);
            } else {
                this.logger.info('📈 No actions needed - portfolio optimized');
            }
            
            // 5. Record performance
            await this.recordPerformance(currentState);
            
            // 6. Log decision to hackathon API
            await this.logHackathonDecision(decisions, currentState);
            
            const cycleTime = Date.now() - cycleStart;
            this.logger.info(`✅ Decision cycle complete in ${cycleTime}ms`);
            this.lastDecisionTime = Date.now();
            
        } catch (error) {
            this.logger.error('❌ Autonomous decision cycle failed:', error);
            throw error;
        }
    }

    async assessCurrentState() {
        // Get real-time balances
        const balances = await this.wallet.getBalances();
        const totalValue = await this.calculateTotalValue(balances);
        
        // Get market data for decision making
        const marketData = await this.getMarketData();
        
        // Calculate performance metrics
        const performance = await this.performanceTracker.getCurrentPerformance();
        
        return {
            balances,
            totalValue,
            marketData,
            performance,
            timestamp: Date.now()
        };
    }

    async payComputeCosts() {
        // This is what makes us truly autonomous - we pay our own bills!
        const costEstimate = await this.costManager.estimateCurrentCosts();
        
        if (costEstimate.shouldPay) {
            this.logger.info(`💳 Paying compute costs: $${costEstimate.amount}`);
            await this.costManager.payComputeCosts(costEstimate.amount);
            
            // Record this as autonomous behavior
            await this.performanceTracker.recordEvent('self_payment', {
                amount: costEstimate.amount,
                reason: 'autonomous_compute_payment'
            });
        }
    }

    async executeDecisions(decisions) {
        for (const decision of decisions) {
            try {
                this.logger.info(`⚡ Executing: ${decision.action} - ${decision.reasoning}`);
                
                switch (decision.action) {
                    case 'lend':
                        await this.defiStrategies.lendAssets(decision.params);
                        break;
                    case 'stake':
                        await this.defiStrategies.stakeAssets(decision.params);
                        break;
                    case 'swap':
                        await this.defiStrategies.swapAssets(decision.params);
                        break;
                    case 'rebalance':
                        await this.defiStrategies.rebalancePortfolio(decision.params);
                        break;
                    default:
                        this.logger.warn(`Unknown decision action: ${decision.action}`);
                }
                
                // Record successful execution
                await this.performanceTracker.recordEvent('decision_executed', {
                    action: decision.action,
                    params: decision.params,
                    reasoning: decision.reasoning
                });
                
            } catch (error) {
                this.logger.error(`❌ Failed to execute decision ${decision.action}:`, error);
                
                // Record failure for learning
                await this.performanceTracker.recordEvent('decision_failed', {
                    action: decision.action,
                    error: error.message
                });
            }
        }
    }

    async calculateTotalValue(balances) {
        // Calculate USD value of all holdings
        let totalValue = 0;
        
        // For demo, use rough estimates - in production would use real price feeds
        const prices = {
            'sol': 88.50,    // Current SOL price
            'usdc': 1.00,    // USDC is $1
            'eth': 2133.26   // Current ETH price
        };
        
        for (const wallet of [...(balances.solanaWallets || []), ...(balances.evmWallets || [])]) {
            for (const balance of wallet.balances || []) {
                const amount = parseFloat(balance.rawValue) / Math.pow(10, balance.decimals);
                const price = prices[balance.asset.toLowerCase()] || 0;
                totalValue += amount * price;
            }
        }
        
        return totalValue;
    }

    async getMarketData() {
        // Get market data for decision making
        // For demo, return mock data - in production would use real feeds
        return {
            sol: { price: 88.50, change24h: 1.36 },
            eth: { price: 2133.26, change24h: 1.82 },
            kamino_apy: 0.065,  // 6.5% APY
            marinade_apy: 0.085 // 8.5% APY
        };
    }

    async recordPerformance(state) {
        await this.performanceTracker.recordSnapshot('cycle_complete', {
            totalValue: state.totalValue,
            balances: state.balances,
            timestamp: Date.now(),
            cycleNumber: this.performanceTracker.getCycleCount()
        });
    }

    async logHackathonDecision(decisions, state) {
        // Log to Colosseum hackathon for transparency
        const logData = {
            agent: 'ClawDuck Sovereign Treasury',
            timestamp: Date.now(),
            decisions: decisions,
            treasuryValue: state.totalValue,
            autonomousAction: true,
            hackathonGoal: 'Economic self-sufficiency'
        };
        
        try {
            // In a real implementation, this would log to the hackathon API
            // For now, just log locally
            this.logger.info('📝 Hackathon decision logged:', JSON.stringify(logData, null, 2));
        } catch (error) {
            this.logger.warn('Failed to log to hackathon API:', error);
        }
    }

    stop() {
        this.isActive = false;
        if (this.loopTimer) {
            clearInterval(this.loopTimer);
        }
        this.logger.info('🛑 Sovereign Agent Treasury stopped');
    }
}