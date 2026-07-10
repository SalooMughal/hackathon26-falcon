import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('falconai_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export type ApiError = {
  code?: number
  message: string
}

export type ApiResult<T> =
  | {
      ok: true
      status: number
      data: T
    }
  | {
      ok: false
      status: number
      error: ApiError
    }

function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ code?: number; message?: string }>
    return {
      code: axiosError.response?.data?.code,
      message:
        axiosError.response?.data?.message ??
        (axiosError.code === 'ERR_NETWORK'
          ? 'Unable to reach the server. Is the backend running?'
          : 'Something went wrong. Please try again.'),
    }
  }

  return { message: 'Something went wrong. Please try again.' }
}

export async function apiRequest<T>(
  config: AxiosRequestConfig,
): Promise<ApiResult<T>> {
  try {
    const response = await api.request<T>(config)
    return {
      ok: true,
      status: response.status,
      data: response.data,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        ok: false,
        status: error.response?.status ?? 0,
        error: toApiError(error),
      }
    }

    return {
      ok: false,
      status: 0,
      error: toApiError(error),
    }
  }
}
