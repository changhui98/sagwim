import type { ContentResponse } from '../../types/post'
import styles from './MyPostCard.module.css'

interface MyPostCardProps {
  post: ContentResponse
  firstImageUrl: string | null
  imageCount: number
}

/**
 * 프로필 "내 글" 섹션 전용 정사각형 카드.
 * - aspect-ratio 1:1 유지 (모바일 1열 레이아웃에서는 CSS 에서 해제)
 * - 제목(2줄) + 본문 요약(남은 공간) + 작성일 하단 고정
 */
export function MyPostCard({ post, firstImageUrl, imageCount }: MyPostCardProps) {
  if (!firstImageUrl) return null

  return (
    <article className={styles.card}>
      <div className={styles.thumbWrap}>
        <img src={firstImageUrl} alt={`${post.id}번 게시글 대표 이미지`} className={styles.thumb} loading="lazy" />
        {imageCount > 1 && (
          <span className={styles.multiBadge} aria-label="사진 여러 장">
            ⧉
          </span>
        )}
      </div>
    </article>
  )
}
