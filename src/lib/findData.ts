/**
 * Resolve data from the first matching dot-delimited path.
 * Returns the first truthy result, or null.
 *
 * Usage: findData(obj, "elevatorPitch", "deliverable.elevatorPitch", "thirtySecond")
 */
export function findData<T = any>(obj: any, ...paths: string[]): T | null {
  for (const path of paths) {
    const result = path.split(".").reduce((o, k) => o?.[k], obj);
    if (result != null && result !== "") return result as T;
  }
  return null;
}
