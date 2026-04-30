import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPosts } from '../api/postApi'
import { ApiError } from '../api/ApiError'
import { useAuth } from '../context/AuthContext'
import type { ContentResponse } from '../types/post'

const PAGE_SIZE = 12

interface UseInfinitePostListResult {
  posts: ContentResponse[]
  loading: boolean
  isFetchingMore: boolean
  hasMore: boolean
  serviceUnavailable: boolean
  error: string | null
  search: (keyword: string, searchType: 'TITLE' | 'USERNAME') => void
  retry: () => void
  loadMore: () => void
  resetAndRefresh: () => void
}

export function useInfinitePostList(): UseInfinitePostListResult {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const [posts, setPosts] = useState<ContentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [serviceUnavailable, setServiceUnavailable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pageRef = useRef(0)
  const keywordRef = useRef('')
  const searchTypeRef = useRef<'TITLE' | 'USERNAME'>('TITLE')

  const handleUnauthorized = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout()
        navigate('/login', { replace: true })
      }
    },
    [logout, navigate],
  )

  const fetchPage = useCallback(
    async (page: number, keyword: string, searchType: 'TITLE' | 'USERNAME', append: boolean) => {
      try {
        if (append) {
          setIsFetchingMore(true)
        } else {
          setLoading(true)
        }
        setError(null)
        setServiceUnavailable(false)

        const response = await getPosts(token, page, PAGE_SIZE, keyword, searchType)

        setPosts((prev) => (append ? [...prev, ...response.content] : response.content))
        setHasMore(response.hasNext)
        pageRef.current = page
      } catch (err) {
        handleUnauthorized(err)
        if (!append) {
          setServiceUnavailable(true)
          setPosts([])
        } else {
          setError('게시글을 불러오는 중 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
        setIsFetchingMore(false)
      }
    },
    [token, handleUnauthorized],
  )

  useEffect(() => {
    fetchPage(0, '', 'TITLE', false)
  }, [fetchPage])

  const loadMore = useCallback(() => {
    if (!hasMore || isFetchingMore) return

    const nextPage = pageRef.current + 1
    fetchPage(nextPage, keywordRef.current, searchTypeRef.current, true)
  }, [hasMore, isFetchingMore, fetchPage])

  const search = useCallback(
    (keyword: string, searchType: 'TITLE' | 'USERNAME') => {
      keywordRef.current = keyword
      searchTypeRef.current = searchType
      pageRef.current = 0
      setPosts([])
      setHasMore(true)
      fetchPage(0, keyword, searchType, false)
    },
    [fetchPage],
  )

  const retry = useCallback(() => {
    const nextPage = pageRef.current + 1
    fetchPage(nextPage, keywordRef.current, searchTypeRef.current, true)
  }, [fetchPage])

  const resetAndRefresh = useCallback(() => {
    keywordRef.current = ''
    searchTypeRef.current = 'TITLE'
    pageRef.current = 0
    setPosts([])
    setHasMore(true)
    fetchPage(0, '', 'TITLE', false)
  }, [fetchPage])

  return {
    posts,
    loading,
    isFetchingMore,
    hasMore,
    serviceUnavailable,
    error,
    search,
    retry,
    loadMore,
    resetAndRefresh,
  }
}
