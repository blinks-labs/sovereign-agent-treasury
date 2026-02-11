#!/usr/bin/env node

/**
 * Sovereign Agent Treasury - LIVE VERSION
 * Makes real autonomous transactions on Solana devnet
 */

import https from 'https';
import http from 'http';

// Load from environment or config file
import { readFileSync } from 'fs';

let envConfig = {};
try {
    const envFile = readFileSync('.env', 'utf-8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) envConfig[key.trim()] = value.trim();
    });
} catch (e) {
    // .env file not found, will use defaults
}

const CONFIG = {
    username: envConfig.AGENTWALLET_USERNAME || 'nabarun',
    apiToken: envConfig.AGENTWALLET_API_TOKEN || process.env.AGENTWALLET_API_TOKEN,
    solanaAddress: '9cnWNADTkSWGdtWTNhGA3YRJa5tEgtsu6MAaHJSQonjV',
    evmAddress: '0x71bFE76f99b01034ad6AC7E9D0D9b06A186fbC62',
    ollamaUrl: 'http://ollama-service.trai-voice:80',
    loopInterval: 5 * 60 * 1000, // 5 minutes
    executeTransactions: true, // LIVE MODE - real transactions!
    minTransactionAmount: 0.01 // Minimum amount for safety
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
    
    warning(msg) {
        const runtime = ((Date.now() - this.startTime) / 1000).toFixed(1);
        console.log(`[${new Date().toISOString()}] [${runtime}s] [${this.module}] ⚠️ WARNING: ${msg}`);
    }
}

const logger = new Logger('TREASURY_LIVE');

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

// Execute a simple SOL transfer to demonstrate transaction capability
async function executeSolTransfer(amount) {
    logger.info(`💸 Executing REAL transaction: Transfer ${amount} SOL`);
    
    try {
        // For demo: transfer small amount of SOL to self (proves we can transact)
        const result = await makeRequest(
            `https://agentwallet.mcpay.tech/api/wallets/${CONFIG.username}/actions/transfer-solana`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.apiToken}`
                },
                body: {
                    to: CONFIG.solanaAddress, // Send to self for demo
                    amount: Math.floor(amount * 1e9).toString(), // Convert to lamports
                    asset: 'sol',
                    network: 'devnet',
                    idempotencyKey: `tx-${Date.now()}`
                }
            }
        );
        
        if (result.txHash) {
            logger.success(`Transaction executed! TxHash: ${result.txHash}`);
            logger.info(`Explorer: https://solscan.io/tx/${result.txHash}?cluster=devnet`);
            return result;
        } else {
            throw new Error('No transaction hash returned');
        }
        
    } catch (error) {
        logger.error('Transaction failed:', error);
        throw error;
    }
}

// Main autonomous decision cycle
async function autonomousCycle() {
    logger.info('🧠 Starting autonomous decision cycle...');
    
    try {
        // 1. Get current portfolio state
        const balances = await getBalances();
        const totalValue = calculateValue(balances);
        
        logger.info(`💰 Current treasury value: $${totalValue.toFixed(2)}`);
        
        // Extract devnet balances
        const devnetBalances = balances.solanaWallets?.[0]?.balances?.filter(b => b.chain === 'solana-devnet') || [];
        let solBalance = 0;
        let usdcBalance = 0;
        
        for (const bal of devnetBalances) {
            const amount = parseFloat(bal.rawValue) / Math.pow(10, bal.decimals);
            if (bal.asset === 'sol') solBalance = amount;
            if (bal.asset === 'usdc') usdcBalance = amount;
            logger.info(`   ${bal.asset.toUpperCase()}: ${amount.toFixed(4)}`);
        }
        
        // 2. Create analysis prompt for AI
        const prompt = `You are an autonomous DeFi treasury manager making REAL transactions.

CURRENT PORTFOLIO:
- Total Value: $${totalValue.toFixed(2)}
- SOL: ${solBalance.toFixed(4)}
- USDC: ${usdcBalance.toFixed(4)}

GOAL: Demonstrate autonomous transaction capability safely.

For this demo, suggest a SIMPLE action:
- "transfer_sol": Transfer 0.01 SOL to demonstrate transaction capability
- "hold": Keep current positions

Respond ONLY with this JSON format:
{
  "action": "transfer_sol|hold",
  "amount": "0.01",
  "reasoning": "brief explanation"
}`;

        // 3. Get AI decision
        logger.info('🤖 Querying local Llama 3.1 for investment strategy...');
        const aiResponse = await queryLlama(prompt);
        
        // 4. Parse decision
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const decision = JSON.parse(jsonMatch[0]);
            logger.success(`AI Decision: ${decision.action}`);
            logger.info(`   Reasoning: ${decision.reasoning}`);
            
            // 5. EXECUTE REAL TRANSACTION if enabled
            if (CONFIG.executeTransactions && decision.action === 'transfer_sol') {
                const amount = parseFloat(decision.amount) || 0.01;
                
                if (amount >= CONFIG.minTransactionAmount && amount <= solBalance) {
                    logger.warning('⚡ EXECUTING REAL TRANSACTION ON DEVNET...');
                    
                    const txResult = await executeSolTransfer(amount);
                    
                    logger.success(`🎉 AUTONOMOUS TRANSACTION COMPLETE!`);
                    logger.info(`   This proves the agent can execute real DeFi operations!`);
                } else {
                    logger.warning('Amount outside safe range, skipping execution');
                }
            } else if (decision.action === 'hold') {
                logger.info('📊 Portfolio optimized - holding current positions');
            }
            
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
    logger.info('🦆 SOVEREIGN AGENT TREASURY - LIVE MODE');
    logger.info('⚡ MAKING REAL AUTONOMOUS TRANSACTIONS');
    logger.info('First fully self-governing AI agent economy');
    logger.info('');
    logger.info('🔧 Configuration:');
    logger.info(`   AI: Local Llama 3.1 (FREE)`);
    logger.info(`   Wallet: ${CONFIG.solanaAddress.slice(0, 8)}...`);
    logger.info(`   Mode: LIVE - Real Devnet Transactions ⚡`);
    logger.info(`   Loop Interval: ${CONFIG.loopInterval / 1000}s`);
    logger.info('');
    logger.warning('⚠️ CAUTION: This agent will execute REAL transactions on Solana devnet');
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

main().catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
});