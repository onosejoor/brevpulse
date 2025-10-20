export function omitObjKeyVal(obj: Record<string, any>, omitKeys: string[]) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !omitKeys.includes(key)),
  );
}
