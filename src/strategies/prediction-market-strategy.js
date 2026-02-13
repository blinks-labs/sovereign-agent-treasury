import DFlowTrader from '../services/dflow-trader.js';
import { Logger } from '../utils/logger.js';
const logger = new Logger('PredictionMarket');

/**
 * Prediction Market Strategy
 * Trades Kalshi prediction markets via DFlow API
 */
class PredictionMarketStrategy {
  constructor(config) {
    this.name = 'Prediction Market Trading';
    this.description = 'Trade prediction market outcomes on Kalshi via DFlow';
    this.riskLevel = 'medium';
    
    this.trader = new DFlowTrader({
      apiKey: config.dflowApiKey,
      wallet: config.wallet,
      minConfidence: 0.65,
      maxPositionSize: 0.15 // 15% max per position
    });
    
    this.categories = config.categories || [
      'crypto', 'politics', 'economics', 'sports'
    ];
    
    this.minEdge = 0.05; // 5% minimum edge
    this.maxPositions = 5;
    this.positions = new Map();
  }

  /**
   * Analyze prediction markets and generate trading signals
   */
  async analyze(options = {}) {
    logger.info('Analyzing prediction markets...');
    
    const signals = [];
    
    try {
      // Get available venues
      const venues = await this.trader.getVenues();
      logger.info(`Available venues: ${venues.join(', ')}`);
      
      // Fetch events by category
      for (const category of this.categories) {
        try {
          const events = await this.trader.getEvents({
            category,
            status: 'active',
            limit: 10
          });
          
          for (const event of events) {
            const eventSignals = await this.analyzeEvent(event);
            signals.push(...eventSignals);
          }
        } catch (error) {
          logger.warn(`Failed to analyze ${category} events:`, error.message);
        }
      }
      
      // Sort by confidence
      signals.sort((a, b) => b.confidence - a.confidence);
      
      logger.info(`Generated ${signals.length} prediction market signals`);
      return signals.slice(0, 5); // Top 5 opportunities
      
    } catch (error) {
      logger.error('Prediction market analysis failed:', error);
      return [];
    }
  }

  /**
   * Analyze a specific event
   */
  async analyzeEvent(event) {
    const signals = [];
    
    try {
      // Get markets for this event
      const markets = await this.trader.getMarkets(event.id);
      
      for (const market of markets) {
        // Get orderbook
        const orderbook = await this.trader.getOrderbook(market.ticker);
        
        // Calculate edge
        const analysis = this.calculateEdge(market, orderbook);
        
        if (analysis.edge > this.minEdge && analysis.confidence > 0.6) {
          signals.push({
            strategy: this.name,
            type: 'prediction_market',
            action: analysis.recommendedAction,
            ticker: market.ticker,
            eventTitle: event.title,
            marketQuestion: market.question,
            confidence: analysis.confidence,
            expectedReturn: analysis.edge,
            currentPrice: analysis.price,
            impliedProbability: analysis.impliedProb,
            myProbability: analysis.myProb,
            details: {
              category: event.category,
              endDate: event.end_date,
              volume24h: market.volume_24h,
              liquidity: analysis.liquidity,
              reasoning: analysis.reasoning
            }
          });
        }
      }
    } catch (error) {
      logger.warn(`Failed to analyze event ${event.id}:`, error.message);
    }
    
    return signals;
  }

  /**
   * Calculate edge in prediction market
   */
  calculateEdge(market, orderbook) {
    const bestBid = orderbook.bids[0]?.price || 0;
    const bestAsk = orderbook.asks[0]?.price || 0;
    const midPrice = (bestBid + bestAsk) / 2;
    
    // Market implied probability
    const impliedProb = midPrice;
    
    // Our estimated probability (simplified - would use real models)
    const myProb = this.estimateProbability(market);
    
    // Edge calculation
    const edge = myProb - impliedProb;
    
    // Confidence based on liquidity and data quality
    const liquidity = market.volume_24h || 0;
    const liquidityScore = Math.min(liquidity / 50000, 1);
    const confidence = 0.5 + (liquidityScore * 0.3) + (Math.abs(edge) * 0.2);
    
    // Determine action
    let recommendedAction = 'hold';
    let reasoning = '';
    
    if (edge > this.minEdge) {
      recommendedAction = 'buy';
      reasoning = `Market underpricing at ${(impliedProb * 100).toFixed(1)}%, true prob ~${(myProb * 100).toFixed(1)}%`;
    } else if (edge < -this.minEdge) {
      recommendedAction = 'sell';
      reasoning = `Market overpricing at ${(impliedProb * 100).toFixed(1)}%, true prob ~${(myProb * 100).toFixed(1)}%`;
    }
    
    return {
      price: midPrice,
      impliedProb,
      myProb,
      edge: Math.abs(edge),
      confidence: Math.min(confidence, 0.95),
      recommendedAction,
      reasoning,
      liquidity
    };
  }

  /**
   * Estimate true probability (placeholder for ML models)
   */
  estimateProbability(market) {
    // This would integrate with:
    // - News sentiment analysis
    // - Historical data
    // - Expert predictions
    // - Market microstructure
    
    // For now, simple heuristic based on market data
    const recentTrades = market.recent_trades || [];
    if (recentTrades.length > 0) {
      const avgPrice = recentTrades.reduce((a, b) => a + b.price, 0) / recentTrades.length;
      return avgPrice;
    }
    
    return 0.5; // Neutral if no data
  }

  /**
   * Execute a trade signal
   */
  async execute(signal, wallet) {
    logger.info(`Executing prediction market trade: ${signal.ticker}`);
    
    try {
      // Check position limits
      if (this.positions.size >= this.maxPositions && !this.positions.has(signal.ticker)) {
        throw new Error('Maximum positions reached');
      }
      
      // Calculate position size
      const positionSize = this.calculatePositionSize(signal);
      
      // Get quote
      const quote = await this.trader.getBuyQuote({
        ticker: signal.ticker,
        amount: positionSize,
        slippageBps: 150 // 1.5% slippage tolerance
      });
      
      // Execute trade
      const result = await this.trader.executeTrade(quote);
      
      // Track position
      this.positions.set(signal.ticker, {
        amount: positionSize,
        entryPrice: result.price,
        timestamp: Date.now()
      });
      
      logger.info(`Trade executed successfully: ${result.signature}`);
      
      return {
        success: true,
        signature: result.signature,
        amount: positionSize,
        price: result.price,
        strategy: this.name
      };
      
    } catch (error) {
      logger.error('Trade execution failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate position size based on Kelly Criterion
   */
  calculatePositionSize(signal) {
    const edge = signal.expectedReturn;
    const odds = signal.currentPrice / (1 - signal.currentPrice);
    
    // Kelly fraction: (bp - q) / b
    // where b = odds, p = win prob, q = lose prob
    const winProb = signal.confidence;
    const loseProb = 1 - winProb;
    const kellyFraction = ((odds * winProb) - loseProb) / odds;
    
    // Use half-Kelly for safety
    const halfKelly = Math.max(0, kellyFraction * 0.5);
    
    // Cap at max position size
    return Math.min(halfKelly, this.trader.maxPositionSize);
  }

  /**
   * Get current positions
   */
  async getPositions() {
    return this.trader.getPositions();
  }

  /**
   * Monitor and manage existing positions
   */
  async monitorPositions() {
    const positions = await this.getPositions();
    const actions = [];
    
    for (const [ticker, position] of Object.entries(positions)) {
      try {
        const market = await this.trader.getOrderbook(ticker);
        const currentPrice = (market.bids[0]?.price + market.asks[0]?.price) / 2;
        const pnl = (currentPrice - position.entryPrice) / position.entryPrice;
        
        // Exit conditions
        if (pnl > 0.5 || pnl < -0.3) {
          actions.push({
            ticker,
            action: 'exit',
            reason: pnl > 0.5 ? 'take_profit' : 'stop_loss',
            pnl
          });
        }
      } catch (error) {
        logger.warn(`Failed to monitor ${ticker}:`, error.message);
      }
    }
    
    return actions;
  }
}

export default PredictionMarketStrategy;