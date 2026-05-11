'use strict';
const { Sequelize } = require('sequelize');
const { logger } = require('./logger');

let activeSequelize = null;

function getPostgresInstance() {
    return new Sequelize(
        process.env.DB_NAME || 'cyberapex_db',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'password',
        {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 5432,
            dialect: 'postgres',
            logging: false,
            retry: { max: 0 },
            pool: { max: 10, min: 0, acquire: 5000, idle: 10000 },
        }
    );
}

function getSqliteInstance() {
    return new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite',
        logging: false
    });
}

async function connectDB() {
    if (process.env.DB_HOST) {
        try {
            console.log(`Connecting to Postgres at ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}...`);
            const pgInstance = getPostgresInstance();
            await pgInstance.authenticate();
            logger.info('✅ PostgreSQL connected successfully');
            activeSequelize = pgInstance;
        } catch (error) {
            logger.warn(`⚠️  PostgreSQL connection failed: ${error.message}. Falling back to SQLite.`);
        }
    }

    if (!activeSequelize) {
        try {
            logger.info('ℹ️  Using local SQLite.');
            activeSequelize = getSqliteInstance();
        } catch (error) {
            logger.error(`❌ SQLite initialization failed: ${error.message}`);
            throw error;
        }
    }

    try {
        await activeSequelize.sync({ alter: false });
        logger.info(`✅ Database synchronized (${activeSequelize.getDialect().toUpperCase()})`);
        return activeSequelize;
    } catch (err) {
        logger.error(`❌ Database sync failed: ${err.message}`);
    }
}

module.exports = { 
    get sequelize() { 
        if (!activeSequelize) {
            // Fallback for immediate access before connectDB, though not recommended
            if (process.env.DB_HOST) activeSequelize = getPostgresInstance();
            else activeSequelize = getSqliteInstance();
        }
        return activeSequelize; 
    },
    connectDB 
};
