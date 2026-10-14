/**
 * Keep only the listed keys of `source` and drop empty values, so the URL never
 * contains things like `?search=&status=`.
 * Unknown keys are ignored on purpose (React Query passes its own context object
 * to a queryFn that is used without a wrapper).
 */
export const pickParams = (source, keys) => {
  const out = {};

  for (const key of keys) {
    const raw = source?.[key];
    if (raw === undefined || raw === null) continue;

    const value = typeof raw === "string" ? raw.trim() : raw;
    if (value === "") continue;

    out[key] = value;
  }

  return out;
};
