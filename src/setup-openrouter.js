#!/usr/bin/env node

/**
 * Setup script for OpenRouter integration
 * Helps configure free model access as alternative to local Llama
 */

import { OpenRouterClient } from './engines/openrouter-client.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('OPENROUTER_SETUP');

async function setupOpenRouter() {
    logger.info('🌐 OpenRouter Setup for Sovereign Agent Treasury');
    logger.info('');
    
    // Check if already configured
    const openRouter = new OpenRouterClient();
    
    if (openRouter.isConfigured()) {
        logger.info('✅ OpenRouter is already configured');
        
        // Test connection
        const isWorking = await openRouter.testConnection();
        if (isWorking) {
            logger.success('🎉 OpenRouter connection test passed!');
            
            // Show available models
            const models = openRouter.getAvailableModels();
            logger.info('📋 Available FREE models:');
            for (const [modelId, info] of Object.entries(models)) {
                logger.info(`   • ${info.name} (${info.contextLength.toLocaleString()} tokens)`);
            }
            
        } else {
            logger.error('❌ OpenRouter connection test failed');
            logger.info('Please check your API key and try again');
        }
        
    } else {
        logger.info('⚙️ OpenRouter not configured');
        logger.info('');
        logger.info('To use OpenRouter free models:');
        logger.info('1. Get free API key: https://openrouter.ai/');
        logger.info('2. Set environment variable: export OPENROUTER_API_KEY=your_key');
        logger.info('3. Or add to .env file: OPENROUTER_API_KEY=your_key');
        logger.info('');
        logger.info('Benefits:');
        logger.info('• Access to multiple free models');
        logger.info('• Fallback when local Llama is unavailable');
        logger.info('• Better reliability for autonomous operation');
        logger.info('');
        logger.info('The treasury agent will work with local Llama only,');
        logger.info('but OpenRouter provides additional resilience.');
    }
}

setupOpenRouter().catch(console.error);