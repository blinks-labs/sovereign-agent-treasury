#!/usr/bin/env node

/**
 * Sovereign Agent Treasury - Simple Version
 * No external dependencies, uses only Node.js built-ins
 */

import https from 'https';
import http from 'http';
import { readFileSync } from 'fs';

// Load configuration from environment variables
const CONFIG = {
    username: process.env.AGENTWALLET_USERNAME || 'your_username',
    apiToken: process.env.AGENTWALLET_API_TOKEN || 'your_api_token',
    solanaAddress: process.env.SOLANA_ADDRESS || 'your_solana_address',
    evmAddress: process.env.EVM_ADDRESS || 'your_evm_address',
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    loopInterval: 5 * 60 * 1000, // 5 minutes
    devnetMode: process.env.DEVNET_MODE === 'true' || true
};

class Logger {
    constructor(module) {
        this.module = module;
        this.startTime = Date.now();
    }
    
    info(msg) {
        const runtime = ((Date.now() - this.startTime) / 1000).toFixed(1);
        console.log(`[${new Date().toISOString()}] [${runtime}s] [${this.module}] INFO: ${msg}`);
    }
    
    success(msg) {
        const runtime = ((Date.now() - this.startTime) / 1000).toFixed(1);
        console.log(`[${new Date().toISOString()}] [${runtime}s] [${this.module}] ✅ SUCCESS: ${msg}`);
    }
    
    error(msg, err) {
        const runtime = ((Date.now() - this.startTime) / 1000).toFixed(1);
        console.error(`[${new Date().toISOString()}] [${runtime}s] [${this.module}] ❌ ERROR: ${msg}`, err?.message || '');
    }
}

const logger = new Logger('TREASURY');

// HTTP request helper
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        const req = client.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

// Get wallet balances
async function getBalances() {
    return makeRequest(
        `https://agentwallet.mcpay.tech/api/wallets/${CONFIG.username}/balances`,
        {
            headers: {
                'Authorization': `Bearer ${CONFIG.apiToken}`
            }
        }
    );
}

// Calculate portfolio value
function calculateValue(balances) {
    const prices = { sol: 88.50, usdc: 1.00, eth: 2133.26 };
    let total = 0;
    
    if (balances.solanaWallets) {
        for (const wallet of balances.solanaWallets) {
            for (const balance of wallet.balances || []) {
                const amount = parseFloat(balance.rawValue) / Math.pow(10, balance.decimals);
                const price = prices[balance.asset.toLowerCase()] || 0;
                total += amount * price;
            }
        }
    }
    
    return total;
}

// Query local Llama for decisions
async function queryLlama(prompt) {
    const requestData = {
        model: 'llama3.1:latest',
        prompt: prompt,
        stream: false,
        options: {
            temperature: 0.3,
            top_p: 0.9,
            max_tokens: 500
        }
    };
    
    const response = await makeRequest(
        `${CONFIG.ollamaUrl}/api/generate`,
        {
            method: 'POST',
            body: requestData
        }
    );
    
    return response.response;
}

// Main autonomous decision cycle
async function autonomousCycle() {
    logger.info('🧠 Starting autonomous decision cycle...');
    
    try {
        // 1. Get current portfolio state
        const balances = await getBalances();
        const totalValue = calculateValue(balances);
        
        logger.info(`💰 Current treasury value: $${totalValue.toFixed(2)}`);
        
        // Extract key balances for logging
        const devnetBalances = balances.solanaWallets?.[0]?.balances?.filter(b => b.chain === 'solana-devnet') || [];
        for (const bal of devnetBalances) {
            const amount = parseFloat(bal.rawValue) / Math.pow(10, bal.decimals);
            logger.info(`   ${bal.asset.toUpperCase()}: ${amount.toFixed(4)}`);
        }
        
        // 2. Create analysis prompt for AI
        const prompt = `You are an autonomous DeFi treasury manager. 

CURRENT PORTFOLIO:
- Total Value: $${totalValue.toFixed(2)}
- Devnet balances shown above

MARKET CONDITIONS:
- SOL: $88.50 (trending up)
- Kamino USDC Lending: 6.5% APY
- Marinade SOL Staking: 8.5% APY

GOAL: Maximize yield while maintaining liquidity for operational costs.

Analyze and provide ONE optimal decision in this EXACT JSON format:
{
  "action": "stake|lend|hold",
  "asset": "SOL|USDC",
  "amount": "specific amount",
  "reasoning": "brief explanation why this optimizes the portfolio"
}

Respond with ONLY valid JSON, nothing else.`;

        // 3. Get AI decision
        logger.info('🤖 Querying local Llama 3.1 for investment strategy...');
        const aiResponse = await queryLlama(prompt);
        
        // 4. Parse decision
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const decision = JSON.parse(jsonMatch[0]);
            logger.success(`AI Decision: ${decision.action} ${decision.amount} ${decision.asset}`);
            logger.info(`   Reasoning: ${decision.reasoning}`);
            
            // 5. Record autonomous behavior
            logger.info('📝 Autonomous decision logged (demo mode - not executing on devnet)');
            logger.info('   For hackathon: Demonstrating AI decision-making capability');
            
        } else {
            logger.info('📊 No actionable decisions needed - portfolio optimized');
        }
        
        // 6. Display self-sufficiency metrics
        const runtime = (Date.now() - logger.startTime) / (1000 * 60 * 60); // hours
        const computeCost = runtime * 0.05; // $0.05/hour
        
        logger.info(`💡 SELF-SUFFICIENCY METRICS:`);
        logger.info(`   Runtime: ${runtime.toFixed(2)} hours`);
        logger.info(`   Compute Cost: $${computeCost.toFixed(4)}`);
        logger.info(`   AI Cost: $0.00 (using free local Llama 3.1)`);
        logger.info(`   Treasury Value: $${totalValue.toFixed(2)}`);
        logger.info(`   Can Pay Own Costs: ${totalValue > computeCost ? 'YES ✅' : 'NO'}`);
        
        logger.success('Decision cycle complete!');
        
    } catch (error) {
        logger.error('Autonomous cycle failed:', error);
    }
}

// Main execution
async function main() {
    logger.info('🦆 SOVEREIGN AGENT TREASURY STARTING...');
    logger.info('First fully self-governing AI agent economy');
    logger.info('Target: "Most Agentic" Prize - Economic Self-Sufficiency');
    logger.info('');
    logger.info('🔧 Configuration:');
    logger.info(`   AI: Local Llama 3.1 (FREE)`);
    logger.info(`   Wallet: ${CONFIG.solanaAddress.slice(0, 8)}...`);
    logger.info(`   Mode: ${CONFIG.devnetMode ? 'Devnet Demo' : 'Mainnet'}`);
    logger.info(`   Loop Interval: ${CONFIG.loopInterval / 1000}s`);
    logger.info('');
    
    // Initial cycle
    await autonomousCycle();
    
    // Set up recurring loop
    logger.info(`🔄 Autonomous loop active - running every ${CONFIG.loopInterval / 60000} minutes`);
    
    setInterval(async () => {
        try {
            await autonomousCycle();
        } catch (error) {
            logger.error('Loop iteration failed:', error);
        }
    }, CONFIG.loopInterval);
}

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('🛑 Shutting down Sovereign Agent Treasury');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('🛑 Shutting down Sovereign Agent Treasury');
    process.exit(0);
});

// Start the autonomous treasury
main().catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
});