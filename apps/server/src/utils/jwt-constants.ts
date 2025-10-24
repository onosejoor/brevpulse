export type jwtConstantstype = {
  refresh: {
    secret: string | undefined;
    // milliseconds to be used for cookie expiry (Date.now() + cookieExpiresMs)
    cookieExpiresMs: number;
    // seconds to be used for JWT expiresIn / exp claims
    jwtExpiresSeconds: number;
  };
  email: {
    secret: string | undefined;
    cookieExpiresMs: number;
    jwtExpiresSeconds: number;
  };
  access: {
    secret: string | undefined;
    cookieExpiresMs: number;
    jwtExpiresSeconds: number;
  };
};

export const jwtConstants = () => ({
  refresh: {
    secret: process.env.REFRESH_TOKEN_SECRET,
    // 14 days
    cookieExpiresMs: 14 * 24 * 60 * 60 * 1000,
    jwtExpiresSeconds: 14 * 24 * 60 * 60,
  },
  email: {
    secret: process.env.EMAIL_SECRET,
    // 14 days
    cookieExpiresMs: 14 * 24 * 60 * 60 * 1000,
    jwtExpiresSeconds: 14 * 24 * 60 * 60,
  },
  access: {
    secret: process.env.ACCESS_TOKEN_SECRET,
    // 15 minutes
    cookieExpiresMs: 15 * 60 * 1000,
    jwtExpiresSeconds: 15 * 60,
  },
});
