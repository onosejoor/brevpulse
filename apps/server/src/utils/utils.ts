export function omitObjKeyVal(obj: Record<string, any>, omitKeys: string[]) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !omitKeys.includes(key)),
  );
}

export function env(key: string) {
  console.log(process.env);

  return process.env[key];
}
