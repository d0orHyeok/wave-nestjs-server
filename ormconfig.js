module.exports = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity.{js,ts}', 'entities/*.entity.*'],
  synchronize: process.env.DB_SYNC === 'true',
  ssl: {
    rejectUnauthorized: false,
  },
};
