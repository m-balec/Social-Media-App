const DbAccess = require('../data/accessLayer');
let dbConfig;
try {
    dbConfig = require('/home/bitnami/conf/config.json');
} catch(err) {
    dbConfig = { DB_HOST: process.env.DB_HOST, 
                        DB_USER: process.env.DB_USER,
                        DB_PASS: process.env.DB_PASSWORD, 
                        DB_NAME: process.env.DB_NAME };
}

const conn = new DbAccess(dbConfig.DB_HOST, dbConfig.DB_USER, dbConfig.DB_PASS, dbConfig.DB_NAME);

module.exports = conn;
