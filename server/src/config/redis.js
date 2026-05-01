const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1, // Don't hang forever if Redis is down
    retryStrategy: (times) => {
        if (times > 3) {
            return null; // Stop retrying after 3 attempts locally
        }
        return Math.min(times * 50, 2000);
    },
});

let isRedisConnected = false;
let hasPrintedWarning = false;

redisClient.on('connect', () => {
    isRedisConnected = true;
    hasPrintedWarning = false;
    console.log('✅ Redis Connected');
});

redisClient.on('error', (err) => {
    isRedisConnected = false;
    if (err.code === 'ECONNREFUSED' && !hasPrintedWarning) {
        hasPrintedWarning = true;
        console.warn('⚠️  Redis is not running. Session logout (blacklisting) will be disabled.');
    } else if (err.code !== 'ECONNREFUSED') {
        console.error('Redis Error:', err.message);
    }
});

// Helper to check status
redisClient.isConnected = () => isRedisConnected;

module.exports = redisClient;
