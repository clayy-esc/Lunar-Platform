const app = require('./src/app');
const connectDB = require('./src/config/db');
const { PORT } = require('./src/config/env');

const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`✓ Lunar API running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`✗ Port ${PORT} is already in use. Stop the existing server or set a different PORT in .env.`);
      process.exit(1);
      return;
    }

    console.error('✗ Server failed to listen:', err.message);
    process.exit(1);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
