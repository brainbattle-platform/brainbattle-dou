export interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    ok: true,
    data,
    error: null,
  };
}

export function errorResponse(code: string, message: string): ApiResponse<null> {
  return {
    ok: false,
    data: null,
    error: { code, message },
  };
}

