'use strict';

const { env } = process;

module.exports = {
  mysql: {
    database: env.SEQ_MYSQL_DB || env.SEQ_DB || 'sequelize_cascade_paranoid_test',
    username: env.SEQ_MYSQL_USER || env.SEQ_USER || 'sequelize_cascade_paranoid_test',
    password: env.SEQ_MYSQL_PW || env.SEQ_PW || 'sequelize_cascade_paranoid_test',
    host: env.MYSQL_PORT_3306_TCP_ADDR || env.SEQ_MYSQL_HOST || env.SEQ_HOST || '127.0.0.1',
    port: env.MYSQL_PORT_3306_TCP_PORT || env.SEQ_MYSQL_PORT || env.SEQ_PORT || 3306,
    pool: {
      max: env.SEQ_MYSQL_POOL_MAX || env.SEQ_POOL_MAX || 5,
      idle: env.SEQ_MYSQL_POOL_IDLE || env.SEQ_POOL_IDLE || 3000,
    },
  },

  sqlite: {},
};
