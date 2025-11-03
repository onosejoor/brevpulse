import 'dotenv/config';

/**
 * Centralized application config object.
 * Read environment variables once and export a typed object for the rest of the app to use.
 * Keep this file small and dependency-free so it can be imported from anywhere.
 */

const appConfig = () => ({
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 8080),
  REDIS_URL: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  FRONTEND_DOMAIN: process.env.FRONTEND_DOMAIN ?? 'http://localhost:3000',
  MONGODB_URL: process.env.MONGODB_URL ?? '',

  //email
  EMAIL_API_URL: process.env.EMAIL_API_URL ?? '',
  EMAIL_API_TOKEN: process.env.EMAIL_API_TOKEN ?? '',
  EMAIL_SECRET: process.env.EMAIL_SECRET ?? '',
  GMAIL_REDIRECT_URI: process.env.GMAIL_REDIRECT_URI,

  //cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? '',

  //jwt
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ?? '',
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ?? '',

  //GOOGLE
  G_CLIENT_SECRET: process.env.G_CLIENT_SECRET ?? '',
  G_CLIENT_ID: process.env.G_CLIENT_ID ?? '',
  G_REDIRECT_URI: process.env.G_REDIRECT_URI ?? '',

  // GOOGLE CALENDAR
  CALENDAR_REDIRECT_URI: process.env.CALENDAR_REDIRECT_URI,
});

export type AppConfig = typeof appConfig;
export default appConfig;
