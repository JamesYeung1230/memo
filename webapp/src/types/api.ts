/** Backend standard envelope: { code, message, data, meta, request_id } */
export interface BackendEnvelope<T> {
  code: number
  message: string
  data: T
  meta: PaginationMeta | null
  request_id: string
}

export interface PaginationMeta {
  page: number
  page_size: number
  total: number
}

export interface ApiResponse<T> {
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
