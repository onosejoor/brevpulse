export const jwtConstants = {
  refresh: {
    secret: process.env.REFRESH_TOKEN_SECRET,
    // default 7 days
    expiresAt: 7 * 24 * 60 * 60,
  },
  email: {
    secret: process.env.EMAIL_SECRET,
    // default 7 days
    expiresAt: 7 * 24 * 60 * 60,
  },
  access: {
    secret: process.env.ACCESS_TOKEN_SECRET,
    // default 15 minutes
    expiresAt: 15 * 60,
  },
};
