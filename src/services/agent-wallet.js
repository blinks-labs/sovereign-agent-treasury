import fetch from 'node-fetch';
import { Logger } from '../utils/logger.js';

/**
 * AgentWallet service for autonomous treasury operations
 * Handles all wallet interactions and transactions
 */
export class AgentWallet {
    constructor(config) {
        this.config = config;
        this.logger = new Logger('AGENT_WALLET');
        this.baseUrl = 'https://agentwallet.mcpay.tech/api';
        this.apiToken = config.apiToken;
        this.username = config.username;
    }

    async initialize() {
        this.logger.info('💼 Initializing AgentWallet service...');
        
        try {
            // Test connection
            const balances = await this.getBalances();
            this.logger.info('✅ AgentWallet connected successfully');
            
            // Log initial balances
            const totalValue = this.calculateTotalValue(balances);
            this.logger.info(`💰 Initial portfolio value: $${totalValue.toFixed(2)}`);
            
        } catch (error) {
            this.logger.error('❌ AgentWallet initialization failed:', error);
            throw error;
        }
    }

    async getBalances() {
        try {
            const response = await this.makeRequest(`/wallets/${this.username}/balances`);
            return response;
        } catch (error) {
            this.logger.error('Failed to get balances:', error);
            throw error;
        }
    }

    async transferSolana(to, amount, asset = 'sol', network = 'devnet') {
        this.logger.info(`📤 Solana transfer: ${amount} ${asset.toUpperCase()} to ${to}`);
        
        try {
            const result = await this.makeRequest(`/wallets/${this.username}/actions/transfer-solana`, {
                method: 'POST',
                body: {
                    to,
                    amount: amount.toString(),
                    asset: asset.toLowerCase(),
                    network,
                    idempotencyKey: `transfer-${Date.now()}`
                }
            });
            
            this.logger.info(`✅ Transfer successful: ${result.txHash}`);
            return result;
            
        } catch (error) {
            this.logger.error('❌ Solana transfer failed:', error);
            throw error;
        }
    }

    async transferEVM(to, amount, asset = 'usdc', chainId = 8453) {
        this.logger.info(`📤 EVM transfer: ${amount} ${asset.toUpperCase()} to ${to}`);
        
        try {
            const result = await this.makeRequest(`/wallets/${this.username}/actions/transfer`, {
                method: 'POST',
                body: {
                    to,
                    amount: amount.toString(),
                    asset: asset.toLowerCase(),
                    chainId,
                    idempotencyKey: `transfer-${Date.now()}`
                }
            });
            
            this.logger.info(`✅ Transfer successful: ${result.txHash}`);
            return result;
            
        } catch (error) {
            this.logger.error('❌ EVM transfer failed:', error);
            throw error;
        }
    }

    async signMessage(chain, message) {
        try {
            const result = await this.makeRequest(`/wallets/${this.username}/actions/sign-message`, {
                method: 'POST',
                body: {
                    chain,
                    message
                }
            });
            
            return result;
            
        } catch (error) {
            this.logger.error('❌ Message signing failed:', error);
            throw error;
        }
    }

    async makeX402Payment(url, paymentData, options = {}) {
        this.logger.info(`💳 Making x402 payment to ${url}`);
        
        try {
            const result = await this.makeRequest(`/wallets/${this.username}/actions/x402/fetch`, {
                method: 'POST',
                body: {
                    url,
                    method: options.method || 'POST',
                    body: paymentData,
                    headers: options.headers || {},
                    preferredChain: options.preferredChain || 'auto',
                    timeout: options.timeout || 30000
                }
            });
            
            if (result.paid) {
                this.logger.info(`✅ Payment successful: ${result.payment.amountFormatted}`);
            }
            
            return result;
            
        } catch (error) {
            this.logger.error('❌ x402 payment failed:', error);
            throw error;
        }
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method: options.method || 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${errorText}`);
        }

        return await response.json();
    }

    calculateTotalValue(balances) {
        let totalValue = 0;
        
        // Simple price estimates for demo
        const prices = {
            'sol': 88.50,
            'usdc': 1.00,
            'eth': 2133.26
        };
        
        // Calculate Solana balances
        if (balances.solanaWallets) {
            for (const wallet of balances.solanaWallets) {
                for (const balance of wallet.balances || []) {
                    const amount = parseFloat(balance.rawValue) / Math.pow(10, balance.decimals);
                    const price = prices[balance.asset.toLowerCase()] || 0;
                    totalValue += amount * price;
                }
            }
        }
        
        // Calculate EVM balances
        if (balances.evmWallets) {
            for (const wallet of balances.evmWallets) {
                for (const balance of wallet.balances || []) {
                    const amount = parseFloat(balance.rawValue) / Math.pow(10, balance.decimals);
                    const price = prices[balance.asset.toLowerCase()] || 0;
                    totalValue += amount * price;
                }
            }
        }
        
        return totalValue;
    }

    getAddresses() {
        return {
            solana: this.config.solanaAddress,
            evm: this.config.evmAddress
        };
    }

    async getActivity(limit = 50) {
        try {
            return await this.makeRequest(`/wallets/${this.username}/activity?limit=${limit}`);
        } catch (error) {
            this.logger.error('Failed to get activity:', error);
            return { events: [] };
        }
    }

    async getPolicy() {
        try {
            return await this.makeRequest(`/wallets/${this.username}/policy`);
        } catch (error) {
            this.logger.error('Failed to get policy:', error);
            return {};
        }
    }
}