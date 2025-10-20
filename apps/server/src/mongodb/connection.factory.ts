import { MongooseModuleOptions } from '@nestjs/mongoose';

export const mongooseConfigFactory = (): MongooseModuleOptions => {
  const uri = process.env.MONGODB_URL;
  if (!uri) {
    throw new Error('MONGODB_URL is not defined in .env file');
  }
  return {
    uri,
    onConnectionCreate: (connection) => {
      connection.on('connected', () => {
        console.log('MongoDB Connected Successfully');
      });
      connection.on('error', (err) => {
        console.error('MongoDB Connection Error:', err);
      });
      return connection;
    },
  };
};
