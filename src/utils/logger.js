/**
 * Logger utility for the Sovereign Agent Treasury
 * Provides structured logging for all autonomous operations
 */
export class Logger {
    constructor(module) {
        this.module = module;
        this.startTime = Date.now();
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const runtime = ((Date.now() - this.startTime) / 1000).toFixed(2);
        
        let logMessage = `[${timestamp}] [${runtime}s] [${this.module}] ${level}: ${message}`;
        
        if (data !== null) {
            if (typeof data === 'object') {
                logMessage += ' ' + JSON.stringify(data, null, 2);
            } else {
                logMessage += ' ' + data;
            }
        }
        
        return logMessage;
    }

    info(message, data = null) {
        console.log(this.formatMessage('INFO', message, data));
    }

    warn(message, data = null) {
        console.warn(this.formatMessage('WARN', message, data));
    }

    error(message, error = null) {
        const errorData = error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : error;
        
        console.error(this.formatMessage('ERROR', message, errorData));
    }

    debug(message, data = null) {
        if (process.env.DEBUG === 'true') {
            console.debug(this.formatMessage('DEBUG', message, data));
        }
    }

    success(message, data = null) {
        console.log(this.formatMessage('SUCCESS', `✅ ${message}`, data));
    }

    autonomous(message, data = null) {
        // Special logging for autonomous actions - key for hackathon
        const autonomousData = {
            autonomous: true,
            timestamp: Date.now(),
            ...data
        };
        console.log(this.formatMessage('AUTONOMOUS', `🤖 ${message}`, autonomousData));
    }
}