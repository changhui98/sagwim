import type { PageResponse, UserDetailResponse, UserResponse } from '../types/user'
import type { AdminContentResponse } from '../types/post'
import type { MonthlyStatsResponse } from '../types/adminStats'
import { ApiError } from './ApiError'
import { API_BASE_URL } from './config'

const createAuthHeaders = (token: string): HeadersInit => {
  if (!token.trim()) {
    throw new ApiError(401, '로그인이 필요합니다.')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: token.trim(),
  }
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text()
    throw new ApiError(
      response.status,
      text || `Request failed: ${response.status} ${response.statusText}`,
    )
  }

  return response.json() as Promise<T>
}

export const getAdminUsers = (
  token: string,
  page = 0,
  size = 10,
): Promise<PageResponse<UserResponse>> => {
  return fetch(`${API_BASE_URL}/admin/users?page=${page}&size=${size}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<UserResponse>>(response))
}

export const deleteAdminUser = (
  token: string,
  username: string,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/admin/users/${username}`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
  }).then(async (response) => {
    if (!response.ok) {
      const text = await response.text()
      throw new ApiError(
        response.status,
        text || `Request failed: ${response.status} ${response.statusText}`,
      )
    }
  })
}

export const getAdminUserDetail = (
  token: string,
  username: string,
): Promise<UserDetailResponse> => {
  return fetch(`${API_BASE_URL}/admin/users/${username}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<UserDetailResponse>(response))
}

export const getAdminContents = (
  token: string,
  page = 0,
  size = 10,
): Promise<PageResponse<AdminContentResponse>> => {
  return fetch(`${API_BASE_URL}/admin/contents?page=${page}&size=${size}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<PageResponse<AdminContentResponse>>(response))
}

export const deleteAdminContent = (
  token: string,
  contentId: number,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/admin/contents/${contentId}`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
  }).then(async (response) => {
    if (!response.ok) {
      const text = await response.text()
      throw new ApiError(
        response.status,
        text || `Request failed: ${response.status} ${response.statusText}`,
      )
    }
  })
}

export const restoreAdminContent = (
  token: string,
  contentId: number,
): Promise<void> => {
  return fetch(`${API_BASE_URL}/admin/contents/${contentId}/restore`, {
    method: 'PATCH',
    headers: createAuthHeaders(token),
  }).then(async (response) => {
    if (!response.ok) {
      const text = await response.text()
      throw new ApiError(
        response.status,
        text || `Request failed: ${response.status} ${response.statusText}`,
      )
    }
  })
}

export const getAdminContentDetail = (
  token: string,
  contentId: number,
): Promise<AdminContentResponse> => {
  return fetch(`${API_BASE_URL}/admin/contents/${contentId}`, {
    headers: createAuthHeaders(token),
  }).then((response) => parseResponse<AdminContentResponse>(response))
}

export const getMonthlySignups = (
  token: string,
  months = 12,
): Promise<MonthlyStatsResponse> => {
  return fetch(
    `${API_BASE_URL}/admin/stats/users/monthly-signups?months=${months}`,
    {
      headers: createAuthHeaders(token),
    },
  ).then((response) => parseResponse<MonthlyStatsResponse>(response))
}

export const getMonthlyContentCreations = (
  token: string,
  months = 12,
): Promise<MonthlyStatsResponse> => {
  return fetch(
    `${API_BASE_URL}/admin/stats/contents/monthly-creations?months=${months}`,
    {
      headers: createAuthHeaders(token),
    },
  ).then((response) => parseResponse<MonthlyStatsResponse>(response))
}
