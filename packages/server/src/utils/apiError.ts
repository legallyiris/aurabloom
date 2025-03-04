export function apiError(code: number, message: string) {
  return {
    status: "error",
    code,
    message,
  };
}
