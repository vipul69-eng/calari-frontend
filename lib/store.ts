/* eslint-disable @typescript-eslint/no-explicit-any */
export const createCacheKey = (obj: any): string => {
  return JSON.stringify(obj, Object.keys(obj).sort());
};

export const deepMerge = (target: any, source: any): any => {
  if (Array.isArray(target) && Array.isArray(source)) {
    return [...source];
  }
  if (
    target &&
    typeof target === "object" &&
    source &&
    typeof source === "object"
  ) {
    const out: any = { ...target };
    for (const key of Object.keys(source)) {
      if (key in target) {
        out[key] = deepMerge(target[key], source[key]);
      } else {
        out[key] = source[key];
      }
    }
    return out;
  }
  return source ?? target;
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const ls = window.localStorage?.getItem("authToken");
  if (ls) return ls;

  const ss = window.sessionStorage?.getItem("authToken");
  return ss || null;
};

export const clearAuthTokens = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
  }
};

const CACHE_TTL = 5 * 60 * 1000;

export function isCacheValid(cache: any, key: string) {
  const item = cache[key];
  if (!item) return false;
  return Date.now() - item.timestamp < CACHE_TTL;
}
