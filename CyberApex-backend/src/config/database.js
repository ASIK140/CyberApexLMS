'use strict';
require('dotenv').config();
const { Sequelize } = require('sequelize');
const { logger } = require('./logger');

let sequelizeInstance = null;

function getSequelize() {
    if (sequelizeInstance) return sequelizeInstance;

    if (!process.env.DB_HOST) {
        throw new Error('FATAL: DB_HOST environment variable is missing. PostgreSQL is required.');
    }

    sequelizeInstance = new Sequelize(
        process.env.DB_NAME || 'cyberapex_db',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'password',
        {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 5432,
            dialect: 'postgres',
            logging: false,
            retry: { max: 3 },
            pool: { max: 10, min: 0, acquire: 5000, idle: 10000 },
        }
    );
    return sequelizeInstance;
}

async function connectDB() {
    try {
        const sequelize = getSequelize();
        console.log(`Connecting to Postgres at ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}...`);
        await sequelize.authenticate();
        logger.info('✅ PostgreSQL connected successfully');
        
        await sequelize.sync({ alter: false });
        logger.info('✅ Database synchronized (POSTGRES)');
        
        return sequelize;
    } catch (error) {
        logger.error(`❌ PostgreSQL connection failed: ${error.message}`);
        process.exit(1);
    }
}

module.exports = { 
    get sequelize() { return getSequelize(); },
    connectDB 
};
