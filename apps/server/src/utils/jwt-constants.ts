export const jwtConstants = () => ({
  refresh: {
    secret: process.env.REFRESH_TOKEN_SECRET,
    expiresAt: 14 * 24 * 60 * 60 * 1000,
  },
  email: {
    secret: process.env.EMAIL_SECRET,
    expiresAt: 14 * 24 * 60 * 60 * 1000,
  },
  access: {
    secret: process.env.ACCESS_TOKEN_SECRET,
    expiresAt: 15 * 60 * 1000,
  },
});
