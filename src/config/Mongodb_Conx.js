/* import mongoose from 'mongoose';

import UserAuthenticationModel from '../modules/users/user.authentication.model.js';
import UserModel from '../modules/users/user.model.js';

const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    // Create declared indexes without dropping any existing indexes.
    // Startup fails if existing data violates a unique index constraint.
    await UserModel.createIndexes();
    await UserAuthenticationModel.createIndexes();
  } catch (error: unknown) {
    // Do not leave an open MongoDB connection when index creation blocks startup.
    try {
      await mongoose.disconnect();
    } catch (disconnectError: unknown) {
      console.error(
        'MongoDB cleanup after index creation failure failed:',
        disconnectError,
      );
    }

    throw error;
  }

  console.info(
    'MongoDB connected successfully; User and UserAuthentication indexes are ready.',
  );
};

export default connectDatabase;
 */



import mongoose from 'mongoose';
import dns from 'node:dns';

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const dbPassword = process.env.DB_PASSWORD;

  if (!mongoUri || !dbPassword) {
    throw new Error(
      'MONGODB_URI or DB_PASSWORD is missing in environment variables.',
    );
  }

  // Use public DNS resolvers for Node.js DNS queries.
  dns.setServers(['8.8.8.8', '1.1.1.1']);

  const connectionString = mongoUri.replace(
    '<db_password>',
    encodeURIComponent(dbPassword),
  );

  try {
    console.info('Connecting to MongoDB...');

    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 10000,
    });

    console.info('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
};

export default connectDatabase;
