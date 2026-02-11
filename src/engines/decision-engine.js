import { Logger } from '../utils/logger.js';
import { OpenRouterClient } from './openrouter-client.js';

/**
 * AI-powered decision engine using local Llama 3.1
 * Makes autonomous investment decisions based on market data and performance
 */
export class DecisionEngine {
    constructor() {
        this.logger = new Logger('DECISION_ENGINE');
        this.ollamaUrl = 'http://ollama-service.trai-voice:80';
        this.model = 'llama3.1:latest';
        this.decisionHistory = [];
        this.riskTolerance = 0.7; // Moderate risk
        
        // OpenRouter as fallback for free model access
        this.openRouter = new OpenRouterClient();
        this.useLocalFirst = true; // Prefer local Llama for true autonomy
    }

    async initialize() {
        this.logger.info('🧠 Initializing AI decision engine...');
        
        // Test connection to local Llama 3.1 (preferred for true autonomy)
        let localLlamaAvailable = false;
        try {
            const response = await fetch(`${this.ollamaUrl}/api/tags`);
            const models = await response.json();
            const hasLlama = models.models.some(m => m.name.includes('llama3.1'));
            
            if (hasLlama) {
                localLlamaAvailable = true;
                this.logger.info('✅ Local Llama 3.1 connected successfully (PRIMARY)');
            }
        } catch (error) {
            this.logger.warn('⚠️ Local Llama 3.1 not available:', error.message);
        }
        
        // Test OpenRouter connection (fallback for free models)
        let openRouterAvailable = false;
        if (this.openRouter.isConfigured()) {
            openRouterAvailable = await this.openRouter.testConnection();
            if (openRouterAvailable) {
                this.logger.info('✅ OpenRouter connected successfully (FALLBACK)');
            }
        } else {
            this.logger.info('ℹ️ OpenRouter not configured (set OPENROUTER_API_KEY)');
        }
        
        // Require at least one AI model
        if (!localLlamaAvailable && !openRouterAvailable) {
            throw new Error('No AI models available - need either local Llama 3.1 or OpenRouter access');
        }
        
        this.logger.info(`🎯 Decision engine ready: Local=${localLlamaAvailable}, OpenRouter=${openRouterAvailable}`);
    }

    async analyzeAndDecide(currentState) {
        this.logger.info('🔍 Analyzing market conditions and portfolio...');
        
        try {
            // Prepare context for AI decision making
            const analysisPrompt = this.buildAnalysisPrompt(currentState);
            
            // Get AI analysis and recommendations
            const aiResponse = await this.queryLlama(analysisPrompt);
            const decisions = this.parseDecisions(aiResponse);
            
            // Apply risk management filters
            const filteredDecisions = this.applyRiskFilters(decisions, currentState);
            
            // Log decisions for transparency
            this.logDecisions(filteredDecisions, currentState);
            
            return filteredDecisions;
            
        } catch (error) {
            this.logger.error('❌ Decision analysis failed:', error);
            return [];
        }
    }

    buildAnalysisPrompt(state) {
        const performance = state.performance || {};
        const balances = state.balances || {};
        
        return `You are an autonomous AI treasury manager for the ClawDuck Sovereign Agent Treasury. 
Your goal is economic self-sufficiency through DeFi yield optimization on Solana.

CURRENT PORTFOLIO STATE:
- Total Value: $${state.totalValue?.toFixed(2) || '0.00'}
- Performance: ${performance.totalReturn || 0}% return
- Balances: ${JSON.stringify(balances, null, 2)}

MARKET CONDITIONS:
- SOL: $${state.marketData?.sol?.price || 88.50} (${state.marketData?.sol?.change24h || 0}% 24h)
- ETH: $${state.marketData?.eth?.price || 2133.26} (${state.marketData?.eth?.change24h || 0}% 24h)
- Kamino Lending APY: ${(state.marketData?.kamino_apy || 0.065) * 100}%
- Marinade Staking APY: ${(state.marketData?.marinade_apy || 0.085) * 100}%

RECENT DECISIONS:
${this.getRecentDecisionsSummary()}

CONSTRAINTS:
- Risk tolerance: Moderate (70%)
- Must maintain liquidity for compute costs
- Focus on sustainable yield generation
- All decisions must be executable autonomously

Please analyze the situation and provide 0-3 actionable decisions in JSON format:
{
  "decisions": [
    {
      "action": "lend|stake|swap|rebalance",
      "reasoning": "Clear explanation of why this decision optimizes the portfolio",
      "params": {
        "amount": "amount to act on",
        "asset": "asset symbol",
        "target": "target protocol or asset",
        "expectedYield": "expected annual yield percentage"
      },
      "priority": "high|medium|low",
      "riskLevel": "low|medium|high"
    }
  ]
}

Only respond with valid JSON. If no actions are needed, return {"decisions": []}.`;
    }

    async queryLlama(prompt) {
        // Try local Llama first (preferred for true autonomy - no API costs)
        if (this.useLocalFirst) {
            try {
                this.logger.info('🤖 Querying local Llama 3.1 for investment decisions...');
                
                const requestData = {
                    model: this.model,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.3, // Lower temperature for more consistent financial decisions
                        top_p: 0.9,
                        max_tokens: 1000
                    }
                };
                
                const response = await fetch(`${this.ollamaUrl}/api/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });

                if (response.ok) {
                    const data = await response.json();
                    this.logger.info('✅ Local Llama response received');
                    return data.response;
                }
                
                throw new Error(`Local Llama API error: ${response.status}`);
                
            } catch (localError) {
                this.logger.warn('⚠️ Local Llama failed, trying OpenRouter fallback:', localError.message);
            }
        }
        
        // Fallback to OpenRouter free models
        if (this.openRouter.isConfigured()) {
            try {
                const response = await this.openRouter.queryModel(prompt, null, {
                    temperature: 0.3,
                    maxTokens: 1000,
                    topP: 0.9
                });
                
                if (response) {
                    this.logger.info('✅ OpenRouter fallback successful');
                    return response;
                }
                
            } catch (openRouterError) {
                this.logger.error('❌ OpenRouter fallback failed:', openRouterError);
            }
        }
        
        // Both failed
        throw new Error('All AI models failed - cannot make investment decisions');
    }

    parseDecisions(aiResponse) {
        try {
            // Extract JSON from AI response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                this.logger.warn('No valid JSON found in AI response');
                return [];
            }

            const parsed = JSON.parse(jsonMatch[0]);
            const decisions = parsed.decisions || [];
            
            this.logger.info(`🎯 AI generated ${decisions.length} potential decisions`);
            
            return decisions;
            
        } catch (error) {
            this.logger.error('❌ Failed to parse AI decisions:', error);
            return [];
        }
    }

    applyRiskFilters(decisions, currentState) {
        const filtered = decisions.filter(decision => {
            // Risk level filter
            if (decision.riskLevel === 'high' && this.riskTolerance < 0.8) {
                this.logger.info(`🚫 Filtered out high-risk decision: ${decision.action}`);
                return false;
            }

            // Minimum value filter (don't make tiny trades)
            if (decision.params?.amount && parseFloat(decision.params.amount) < 0.01) {
                this.logger.info(`🚫 Filtered out small amount decision: ${decision.action}`);
                return false;
            }

            // Liquidity preservation (keep at least $10 for operations)
            if (currentState.totalValue < 10) {
                this.logger.info(`🚫 Insufficient liquidity for decision: ${decision.action}`);
                return false;
            }

            return true;
        });

        this.logger.info(`✅ ${filtered.length}/${decisions.length} decisions passed risk filters`);
        return filtered;
    }

    logDecisions(decisions, state) {
        // Record decisions for history and transparency
        const decisionRecord = {
            timestamp: Date.now(),
            portfolioValue: state.totalValue,
            decisions: decisions,
            marketConditions: state.marketData,
            reasoning: 'autonomous_ai_analysis'
        };

        this.decisionHistory.push(decisionRecord);
        
        // Keep only last 100 decisions
        if (this.decisionHistory.length > 100) {
            this.decisionHistory.shift();
        }

        // Log for hackathon transparency
        this.logger.info('📊 Decision Analysis Complete:', {
            portfolioValue: state.totalValue,
            decisionsCount: decisions.length,
            actions: decisions.map(d => d.action)
        });
    }

    getRecentDecisionsSummary() {
        const recent = this.decisionHistory.slice(-3);
        if (recent.length === 0) {
            return 'No recent decisions';
        }

        return recent.map(record => 
            `${new Date(record.timestamp).toISOString()}: ${record.decisions.length} decisions`
        ).join('\n');
    }

    getDecisionHistory() {
        return this.decisionHistory;
    }
}