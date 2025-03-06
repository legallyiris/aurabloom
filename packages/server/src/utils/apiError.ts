export function apiError(code: number, message: string) {
  return {
    status: "error",
    code,
    message,
  };
}

export function apiUnauthenticated(details?: string) {
  return apiError(401, "not authenticated");
}
