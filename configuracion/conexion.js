const { Client } = require('pg');


const connectionData = {
  user: 'postgres',
  host: '47.88.85.252',
  database: 'procesadorbk',
  password: 'Mangos19966',
  port: 5432,
}

  const sql = new Client(connectionData)
  sql.connect();
module.exports = sql;