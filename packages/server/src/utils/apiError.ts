/**
 * @deprecated use elysias's error instead
 * @param code
 * @param message
 * @returns
 */
export function apiError(code: number, message: string) {
  return {
    status: "error",
    code,
    message,
  };
}

export function apiUnauthenticated() {
  return { code: 401, message: "not authenticated" };
}
