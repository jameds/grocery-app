export function hasKeys(obj, keys) {
  return new Set(keys)
    .isSubsetOf(new Set(Object.keys(obj)))
}
