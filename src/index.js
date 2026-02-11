#!/usr/bin/env node

/**
 * Sovereign Agent Treasury
 * The first fully self-governing AI agent economy
 */

import { config } from 'dotenv';
import { TreasuryAgent } from './treasury-agent.js';
import { Logger } from './utils/logger.js';

config();

const logger = new Logger('MAIN');

async function main() {
    logger.info('🦆 Sovereign Agent Treasury Starting...');
    logger.info('First AI agent to achieve economic self-sufficiency');
    
    try {
        // Initialize the autonomous treasury agent
        const treasuryAgent = new TreasuryAgent({
            username: process.env.AGENTWALLET_USERNAME || 'your_username',
            apiToken: process.env.AGENTWALLET_API_TOKEN || 'your_api_token',
            solanaAddress: process.env.SOLANA_ADDRESS || 'your_solana_address',
            evmAddress: process.env.EVM_ADDRESS || 'your_evm_address'
        });

        // Start autonomous operations
        await treasuryAgent.initialize();
        await treasuryAgent.startAutonomousLoop();
        
    } catch (error) {
        logger.error('Fatal error:', error);
        process.exit(1);
    }
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

main().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
});