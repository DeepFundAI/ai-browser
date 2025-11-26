export interface IpcResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export function successResponse<T = void>(data?: T): IpcResponse<T> {
  return { success: true, data };
}

export function errorResponse(error: string | Error): IpcResponse {
  const errorMessage = error instanceof Error ? error.message : error;
  return { success: false, error: errorMessage };
}
