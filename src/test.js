#!/usr/bin/env node

/**
 * Test script for Sovereign Agent Treasury
 * Verifies all components work correctly before autonomous operation
 */

import { config } from 'dotenv';
import { TreasuryAgent } from './treasury-agent.js';
import { Logger } from './utils/logger.js';

config();

const logger = new Logger('TEST');

async function runTests() {
    logger.info('🧪 Starting Sovereign Agent Treasury Tests...');
    
    try {
        // Test 1: Initialize treasury agent
        logger.info('Test 1: Treasury Agent Initialization');
        const treasuryAgent = new TreasuryAgent({
            username: process.env.AGENTWALLET_USERNAME || 'your_username',
            apiToken: process.env.AGENTWALLET_API_TOKEN || 'your_api_token',
            solanaAddress: process.env.SOLANA_ADDRESS || 'your_solana_address',
            evmAddress: process.env.EVM_ADDRESS || 'your_evm_address'
        });
        
        await treasuryAgent.initialize();
        logger.success('Treasury agent initialized successfully');
        
        // Test 2: Check wallet connection
        logger.info('Test 2: Wallet Connection');
        const balances = await treasuryAgent.wallet.getBalances();
        const totalValue = await treasuryAgent.calculateTotalValue(balances);
        logger.success(`Wallet connected: $${totalValue.toFixed(2)} total value`);
        
        // Test 3: Test decision engine
        logger.info('Test 3: AI Decision Engine');
        const mockState = {
            totalValue: totalValue,
            balances: balances,
            marketData: {
                sol: { price: 88.50, change24h: 1.36 },
                kamino_apy: 0.065,
                marinade_apy: 0.085
            },
            performance: { totalReturn: 0 }
        };
        
        const decisions = await treasuryAgent.decisionEngine.analyzeAndDecide(mockState);
        logger.success(`AI generated ${decisions.length} investment decisions`);
        
        // Test 4: Test cost estimation
        logger.info('Test 4: Cost Management');
        const costEstimate = await treasuryAgent.costManager.estimateCurrentCosts();
        logger.success(`Cost estimation: $${costEstimate.amount.toFixed(4)} (Should pay: ${costEstimate.shouldPay})`);
        
        // Test 5: Performance tracking
        logger.info('Test 5: Performance Tracking');
        const performance = await treasuryAgent.performanceTracker.getCurrentPerformance();
        logger.success(`Performance tracking active: ${performance.snapshots} snapshots recorded`);
        
        // Test 6: Generate hackathon report
        logger.info('Test 6: Hackathon Report Generation');
        const report = await treasuryAgent.performanceTracker.generateHackathonReport();
        logger.success(`Hackathon report generated: ${report.title}`);
        
        // Test complete
        logger.success('🎉 All tests passed! Sovereign Agent Treasury ready for autonomous operation.');
        logger.info('Run "npm start" to begin autonomous treasury management');
        
        // Stop the agent (this was just testing)
        treasuryAgent.stop();
        
    } catch (error) {
        logger.error('❌ Test failed:', error);
        process.exit(1);
    }
}

runTests().catch((error) => {
    logger.error('❌ Test execution failed:', error);
    process.exit(1);
});