import { useCallback, useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
}

interface UseIntersectionObserverResult {
  ref: React.RefCallback<HTMLDivElement>
  isIntersecting: boolean
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {},
): UseIntersectionObserverResult {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const ref = useCallback((node: HTMLDivElement | null) => {
    setElement(node)
  }, [])

  useEffect(() => {
    if (!element) return

    const { root, rootMargin, threshold } = optionsRef.current

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        root: root ?? null,
        rootMargin: rootMargin ?? '0px',
        threshold: threshold ?? 0,
      },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [element])

  return { ref, isIntersecting }
}
