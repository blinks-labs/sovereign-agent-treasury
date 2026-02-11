import { Logger } from '../utils/logger.js';
const logger = new Logger('DFlowTrader');

/**
 * DFlow Prediction Market Trader
 * Trades Kalshi prediction markets via DFlow API on Solana
 */
class DFlowTrader {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.DFLOW_API_KEY;
    this.baseURL = config.baseURL || 'https://quote-api.dflow.net';
    this.wallet = config.wallet; // Solana wallet for signing
    this.minConfidence = config.minConfidence || 0.6;
    this.maxPositionSize = config.maxPositionSize || 0.1; // 10% of treasury max
    
    this.positions = new Map();
    this.watchlist = new Set();
  }

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DFlow API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get supported venues
   */
  async getVenues() {
    try {
      const data = await this.request('/venues');
      logger.info(`DFlow venues: ${data.join(', ')}`);
      return data;
    } catch (error) {
      logger.error('Failed to get venues:', error.message);
      throw error;
    }
  }

  /**
   * Get available prediction market events from Kalshi
   */
  async getEvents(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit);
      
      const data = await this.request(`/events?${params.toString()}`);
      logger.info(`Found ${data.length} prediction market events`);
      return data;
    } catch (error) {
      logger.error('Failed to get events:', error.message);
      throw error;
    }
  }

  /**
   * Get specific event details
   */
  async getEvent(eventId) {
    try {
      const data = await this.request(`/events/${eventId}`);
      return data;
    } catch (error) {
      logger.error(`Failed to get event ${eventId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get markets for an event
   */
  async getMarkets(eventId) {
    try {
      const data = await this.request(`/markets?event_id=${eventId}`);
      return data;
    } catch (error) {
      logger.error(`Failed to get markets for ${eventId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get orderbook for a market
   */
  async getOrderbook(ticker) {
    try {
      const data = await this.request(`/orderbook/${ticker}`);
      return data;
    } catch (error) {
      logger.error(`Failed to get orderbook for ${ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Get quote for buying outcome tokens
   */
  async getBuyQuote(params) {
    try {
      const {
        ticker,
        amount,
        slippageBps = 100, // 1%
        venue = 'auto'
      } = params;

      const data = await this.request('/quote/buy', {
        method: 'POST',
        body: JSON.stringify({
          ticker,
          amount,
          slippage_bps: slippageBps,
          venue
        })
      });

      return data;
    } catch (error) {
      logger.error('Failed to get buy quote:', error.message);
      throw error;
    }
  }

  /**
   * Get quote for selling outcome tokens
   */
  async getSellQuote(params) {
    try {
      const {
        ticker,
        amount,
        slippageBps = 100,
        venue = 'auto'
      } = params;

      const data = await this.request('/quote/sell', {
        method: 'POST',
        body: JSON.stringify({
          ticker,
          amount,
          slippage_bps: slippageBps,
          venue
        })
      });

      return data;
    } catch (error) {
      logger.error('Failed to get sell quote:', error.message);
      throw error;
    }
  }

  /**
   * Execute a trade (requires wallet signing)
   */
  async executeTrade(quoteResponse) {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not configured for trade execution');
      }

      // Get transaction from quote
      const txData = await this.request('/transaction', {
        method: 'POST',
        body: JSON.stringify({
          quote_id: quoteResponse.quote_id
        })
      });

      // Sign and send transaction
      const signedTx = await this.wallet.signTransaction(txData.transaction);
      const signature = await this.wallet.sendTransaction(signedTx);

      logger.info(`Trade executed: ${signature}`);
      
      // Track position
      this.trackPosition(quoteResponse.ticker, quoteResponse.side, quoteResponse.amount);

      return {
        signature,
        ticker: quoteResponse.ticker,
        side: quoteResponse.side,
        amount: quoteResponse.amount,
        price: quoteResponse.price
      };
    } catch (error) {
      logger.error('Failed to execute trade:', error.message);
      throw error;
    }
  }

  /**
   * Get live Kalshi data
   */
  async getLiveData() {
    try {
      const data = await this.request('/live-data');
      return data;
    } catch (error) {
      logger.error('Failed to get live data:', error.message);
      throw error;
    }
  }

  /**
   * Search prediction markets
   */
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (filters.category) params.append('category', filters.category);
      if (filters.limit) params.append('limit', filters.limit);

      const data = await this.request(`/search?${params.toString()}`);
      return data;
    } catch (error) {
      logger.error('Search failed:', error.message);
      throw error;
    }
  }

  /**
   * Track a position
   */
  trackPosition(ticker, side, amount) {
    const position = this.positions.get(ticker) || { amount: 0, entries: [] };
    
    if (side === 'buy') {
      position.amount += amount;
    } else {
      position.amount -= amount;
    }
    
    position.entries.push({
      side,
      amount,
      timestamp: Date.now()
    });
    
    this.positions.set(ticker, position);
    logger.info(`Position updated: ${ticker} = ${position.amount}`);
  }

  /**
   * Get all positions
   */
  getPositions() {
    return Object.fromEntries(this.positions);
  }

  /**
   * Add to watchlist
   */
  watch(ticker) {
    this.watchlist.add(ticker);
    logger.info(`Added ${ticker} to watchlist`);
  }

  /**
   * Get watchlist
   */
  getWatchlist() {
    return Array.from(this.watchlist);
  }

  /**
   * Evaluate market opportunity
   * Returns confidence score 0-1
   */
  evaluateOpportunity(marketData, sentiment = {}) {
    const factors = {
      liquidity: this.calculateLiquidityScore(marketData),
      spread: this.calculateSpreadScore(marketData),
      volatility: this.calculateVolatilityScore(marketData),
      sentiment: sentiment.score || 0.5
    };

    const weights = {
      liquidity: 0.3,
      spread: 0.2,
      volatility: 0.2,
      sentiment: 0.3
    };

    const score = Object.entries(factors).reduce((acc, [key, value]) => {
      return acc + (value * weights[key]);
    }, 0);

    return Math.min(Math.max(score, 0), 1);
  }

  calculateLiquidityScore(marketData) {
    const volume = marketData.volume_24h || 0;
    return Math.min(volume / 10000, 1); // Normalize to 10k volume = 1.0
  }

  calculateSpreadScore(marketData) {
    const spread = marketData.bid_ask_spread || 0.02;
    return Math.max(0, 1 - (spread * 50)); // 2% spread = 0, 0% = 1
  }

  calculateVolatilityScore(marketData) {
    const volatility = marketData.price_volatility_24h || 0.1;
    return volatility < 0.05 ? 0.3 : volatility > 0.3 ? 0.8 : 0.5;
  }
}

export default DFlowTrader;