const { Client } = require('pg');


const connectionData = {
  user: 'postgres',
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PUERTO,
}

  const sql = new Client(connectionData)
  sql.connect();
module.exports = sql;