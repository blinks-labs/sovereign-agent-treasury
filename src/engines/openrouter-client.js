import { Logger } from '../utils/logger.js';

/**
 * OpenRouter API client for free model access
 * Provides backup to local Llama 3.1 and additional model options
 */
export class OpenRouterClient {
    constructor(config = {}) {
        this.logger = new Logger('OPENROUTER');
        this.baseUrl = 'https://openrouter.ai/api/v1';
        this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
        
        // Free models available on OpenRouter
        this.freeModels = {
            'huggingface/meta-llama/Meta-Llama-3.1-8B-Instruct': {
                name: 'Llama 3.1 8B',
                contextLength: 8192,
                cost: 0
            },
            'microsoft/phi-3-mini-128k-instruct': {
                name: 'Phi-3 Mini',
                contextLength: 128000,
                cost: 0
            },
            'google/gemma-2-9b-it': {
                name: 'Gemma 2 9B',
                contextLength: 8192,
                cost: 0
            },
            'meta-llama/llama-3.2-3b-instruct': {
                name: 'Llama 3.2 3B',
                contextLength: 8192,
                cost: 0
            }
        };
        
        this.defaultModel = 'huggingface/meta-llama/Meta-Llama-3.1-8B-Instruct';
    }

    async queryModel(prompt, model = null, options = {}) {
        const selectedModel = model || this.defaultModel;
        
        if (!this.apiKey) {
            this.logger.warn('No OpenRouter API key provided, skipping');
            return null;
        }
        
        try {
            this.logger.info(`🌐 Querying OpenRouter: ${this.freeModels[selectedModel]?.name || selectedModel}`);
            
            // Simple HTTP request using built-in modules
            const https = require('https');
            const url = new URL(`${this.baseUrl}/chat/completions`);
            
            const postData = JSON.stringify({
                model: selectedModel,
                messages: [{ role: 'user', content: prompt }],
                temperature: options.temperature || 0.3,
                max_tokens: options.maxTokens || 1000,
                top_p: options.topP || 0.9
            });

            return new Promise((resolve, reject) => {
                const req = https.request({
                    hostname: url.hostname,
                    port: url.port,
                    path: url.pathname,
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'X-Title': 'Sovereign Agent Treasury',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const response = JSON.parse(data);
                            const content = response.choices?.[0]?.message?.content;
                            
                            if (!content) {
                                reject(new Error('No content in OpenRouter response'));
                                return;
                            }
                            
                            this.logger.info('✅ OpenRouter response received');
                            resolve(content);
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                req.on('error', reject);
                req.write(postData);
                req.end();
            });
            
        } catch (error) {
            this.logger.error('❌ OpenRouter query failed:', error);
            return null;
        }
    }

    async testConnection() {
        if (!this.isConfigured()) return false;
        
        try {
            const testPrompt = 'Hello! Please respond with "OpenRouter connection successful" to test the API.';
            const response = await this.queryModel(testPrompt);
            
            if (response && response.toLowerCase().includes('successful')) {
                this.logger.info('✅ OpenRouter connection test passed');
                return true;
            } else {
                this.logger.warn('⚠️ OpenRouter connection test inconclusive');
                return false;
            }
            
        } catch (error) {
            this.logger.error('❌ OpenRouter connection test failed:', error);
            return false;
        }
    }

    getAvailableModels() {
        return this.freeModels;
    }

    isConfigured() {
        return !!this.apiKey;
    }
}