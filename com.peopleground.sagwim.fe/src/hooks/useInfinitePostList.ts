import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPosts } from '../api/postApi'
import { getContentImages } from '../api/imageApi'
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

  /**
   * getPosts 응답의 imageUrls가 비어있는 게시글에 대해 개별 이미지 API로
   * 폴백하여 imageUrls를 채운다.
   *
   * ContentResponseAssembler가 최신 배포되어 있으면 imageUrls가 이미
   * 채워져 있으므로 대부분의 경우 추가 호출이 발생하지 않는다.
   * 배포 타이밍 문제나 예외 상황에서도 이미지가 표시되도록 방어한다.
   */
  const fillMissingImageUrls = useCallback(
    async (contents: ContentResponse[]): Promise<ContentResponse[]> => {
      const missing = contents.filter((c) => !c.imageUrls || c.imageUrls.length === 0)
      if (missing.length === 0) return contents

      const resolved = await Promise.all(
        missing.map(async (post) => {
          try {
            const images = await getContentImages(token, post.id)
            return { id: post.id, imageUrls: images.map((img) => img.fileUrl) }
          } catch {
            return { id: post.id, imageUrls: [] }
          }
        }),
      )

      const urlMap = new Map(resolved.map((r) => [r.id, r.imageUrls]))
      return contents.map((c) =>
        urlMap.has(c.id) ? { ...c, imageUrls: urlMap.get(c.id) } : c,
      )
    },
    [token],
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
        const filledContent = await fillMissingImageUrls(response.content)

        setPosts((prev) => (append ? [...prev, ...filledContent] : filledContent))
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
    [token, handleUnauthorized, fillMissingImageUrls],
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
