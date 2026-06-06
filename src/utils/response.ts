export function successResponse<T>(data: T, message?: string) {
  return { success: true, message: message ?? "OK", data };
}

export function errorResponse(message: string, errors?: unknown) {
  return { success: false, message, errors: errors ?? null };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
) {
  return {
    success: true,
    message: message ?? "OK",
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
