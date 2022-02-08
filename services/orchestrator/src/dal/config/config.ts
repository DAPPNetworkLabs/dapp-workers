module.exports = {
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'postgres',
    logging: false,
    use_env_variable: 'DATABASE_URL'
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'postgres',
    logging: false,
    use_env_variable: 'DATABASE_URL'
  }
};
