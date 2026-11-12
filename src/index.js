import 'dotenv/config';

import mongoose from 'mongoose';

import app from './app.js';
import connectDatabase from './config/Mongodb_Conx.js';

// ==========================================
// Server Configuration
// ==========================================

const PORT = Number(process.env.PORT ?? 5000);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65_535) {
  throw new Error('Invalid PORT environment variable.');
}

// ==========================================
// Application Bootstrap
// ==========================================

const bootstrap = async () => {
  // Connect to MongoDB before starting the server.
  await connectDatabase();

  // Start HTTP Server.
  const server = app.listen(PORT, () => {
    console.info(`Propix API running on port ${PORT}.`);
  });

  // ==========================================
  // Graceful Shutdown
  // ==========================================

  const shutdown = (signal) => {
    console.info(`${signal} received. Shutting down server...`);

    server.close(async (error) => {
      if (error) {
        console.error('HTTP Server shutdown failed:', error);
        process.exitCode = 1;
      }

      try {
        await mongoose.disconnect();
        console.info('MongoDB disconnected successfully.');
      } catch (disconnectError) {
        console.error('MongoDB disconnection failed:', disconnectError);

        process.exitCode = 1;
      }
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

// ==========================================
// Start Application
// ==========================================

bootstrap().catch((error) => {
  console.error('Application startup failed:', error);
  process.exitCode = 1;
});
