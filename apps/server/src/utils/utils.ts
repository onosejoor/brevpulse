export function omitObjKeyVal(obj: Record<string, any>, omitKeys: string[]) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !omitKeys.includes(key)),
  );
}

export const throttlerOptions = {
  short: {
    ttl: 60000,
    limit: 10,
  },
  medium: {
    ttl: 60000,
    limit: 20,
  },
  long: {
    ttl: 60000,
    limit: 100,
  },
};

export const getBufferKey = (key: any) => {
  const encKey = key instanceof Buffer ? key : key.buffer;

  return Buffer.from(encKey);
};

export const TOKEN_STRING =
  '+tokens.accessToken +tokens.refreshToken +tokens.expiryDate +tokens.isDisabled +tokens._id';
