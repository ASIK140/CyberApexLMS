'use strict';
const { Sequelize } = require('sequelize');
const { logger } = require('./logger');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'cyberapex_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'password',
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: false,
        retry: { max: 0 }, // Don't hang on Postgres failure
        pool: { max: 10, min: 0, acquire: 5000, idle: 10000 },
    }
);

const sqliteSequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

let activeSequelize = sqliteSequelize; // Default to SQLite for safety during validation

async function connectDB() {
    try {
        // Try Postgres if explicitly configured, otherwise stick to SQLite for QA stability
        if (process.env.DB_HOST) {
            console.log(`Connecting to Postgres at ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}...`);
            await sequelize.authenticate();
            logger.info('✅ PostgreSQL connected successfully');
            activeSequelize = sequelize;
        } else {
            logger.info('ℹ️  No Postgres host provided. Using persistent SQLite.');
        }
    } catch (error) {
        logger.warn(`⚠️  PostgreSQL connection failed: ${error.message}. Using local SQLite.`);
    }

    try {
        await activeSequelize.sync({ alter: false });
        logger.info(`✅ Database synchronized (${activeSequelize.getDialect().toUpperCase()})`);
        return activeSequelize;
    } catch (err) {
        logger.error(`❌ Database sync failed: ${err.message}`);
    }
}

// Export a proxy or a function to get the current sequelize instance
module.exports = { 
    get sequelize() { return activeSequelize; },
    connectDB 
};
