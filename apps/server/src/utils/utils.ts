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
