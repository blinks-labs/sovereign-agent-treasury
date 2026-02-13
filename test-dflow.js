#!/usr/bin/env node
/**
 * DFlow Prediction Market Integration Test
 * Tests connection to Kalshi via DFlow API
 */

import DFlowTrader from './src/services/dflow-trader.js';
import PredictionMarketStrategy from './src/strategies/prediction-market-strategy.js';

async function testDFlowIntegration() {
  console.log('🦆 Testing DFlow Prediction Market Integration...\n');
  
  // Get API key from environment
  const apiKey = process.env.DFLOW_API_KEY;
  if (!apiKey) {
    console.error('❌ DFLOW_API_KEY not set');
    process.exit(1);
  }
  
  // Initialize trader
  const trader = new DFlowTrader({
    apiKey: apiKey,
    baseURL: 'https://quote-api.dflow.net'
  });
  
  try {
    // Test 1: Get venues
    console.log('📍 Test 1: Getting supported venues...');
    const venues = await trader.getVenues();
    console.log(`✅ Venues: ${venues.join(', ')}\n`);
    
    // Test 2: Get crypto prediction markets
    console.log('📊 Test 2: Getting crypto prediction markets...');
    const events = await trader.getEvents({
      category: 'crypto',
      status: 'active',
      limit: 5
    });
    console.log(`✅ Found ${events.length} crypto events`);
    
    if (events.length > 0) {
      const sampleEvent = events[0];
      console.log(`\n📋 Sample Event:`);
      console.log(`  Title: ${sampleEvent.title}`);
      console.log(`  Category: ${sampleEvent.category}`);
      console.log(`  End Date: ${sampleEvent.end_date}`);
      console.log(`  Status: ${sampleEvent.status}\n`);
      
      // Test 3: Get markets for event
      console.log('📈 Test 3: Getting markets for event...');
      const markets = await trader.getMarkets(sampleEvent.id);
      console.log(`✅ Found ${markets.length} markets\n`);
      
      if (markets.length > 0) {
        const sampleMarket = markets[0];
        console.log(`📋 Sample Market:`);
        console.log(`  Question: ${sampleMarket.question}`);
        console.log(`  Ticker: ${sampleMarket.ticker}`);
        console.log(`  Volume 24h: $${sampleMarket.volume_24h?.toLocaleString() || 0}\n`);
        
        // Test 4: Get orderbook
        console.log('📖 Test 4: Getting orderbook...');
        const orderbook = await trader.getOrderbook(sampleMarket.ticker);
        console.log(`✅ Orderbook retrieved`);
        console.log(`  Best Bid: ${orderbook.bids[0]?.price || 'N/A'}`);
        console.log(`  Best Ask: ${orderbook.asks[0]?.price || 'N/A'}`);
        console.log(`  Spread: ${((orderbook.asks[0]?.price - orderbook.bids[0]?.price) * 100).toFixed(2)}%\n`);
      }
    }
    
    // Test 5: Search markets
    console.log('🔍 Test 5: Searching markets...');
    const searchResults = await trader.search('bitcoin', { limit: 3 });
    console.log(`✅ Found ${searchResults.length} results for 'bitcoin'\n`);
    
    // Test 6: Strategy analysis
    console.log('🧠 Test 6: Running strategy analysis...');
    const strategy = new PredictionMarketStrategy({
      dflowApiKey: apiKey,
      categories: ['crypto'],
      wallet: null // No wallet for testing
    });
    
    const signals = await strategy.analyze();
    console.log(`✅ Generated ${signals.length} trading signals\n`);
    
    if (signals.length > 0) {
      console.log('📊 Top Signal:');
      const top = signals[0];
      console.log(`  Event: ${top.eventTitle}`);
      console.log(`  Market: ${top.marketQuestion}`);
      console.log(`  Action: ${top.action}`);
      console.log(`  Confidence: ${(top.confidence * 100).toFixed(1)}%`);
      console.log(`  Expected Return: ${(top.expectedReturn * 100).toFixed(1)}%`);
      console.log(`  Reasoning: ${top.details.reasoning}\n`);
    }
    
    console.log('✅ All tests passed! DFlow integration working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
testDFlowIntegration();

export { testDFlowIntegration };