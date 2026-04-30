import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { PostCreateModal } from '../components/post/PostCreateModal'

type Listener = () => void

interface PostCreateModalContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  subscribe: (listener: Listener) => () => void
}

const PostCreateModalContext = createContext<PostCreateModalContextValue | undefined>(
  undefined,
)

export function PostCreateModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const listenersRef = useRef<Set<Listener>>(new Set())

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  const notifyCreated = useCallback(() => {
    listenersRef.current.forEach((listener) => {
      try {
        listener()
      } catch (err) {
        console.error('PostCreateModal listener error', err)
      }
    })
  }, [])

  return (
    <PostCreateModalContext.Provider value={{ isOpen, open, close, subscribe }}>
      {children}
      <PostCreateModal isOpen={isOpen} onClose={close} onCreated={notifyCreated} />
    </PostCreateModalContext.Provider>
  )
}

export function usePostCreateModal(): PostCreateModalContextValue {
  const ctx = useContext(PostCreateModalContext)
  if (!ctx) {
    throw new Error('usePostCreateModal must be used within PostCreateModalProvider')
  }
  return ctx
}

export function usePostCreatedSubscription(listener: Listener) {
  const { subscribe } = usePostCreateModal()
  useEffect(() => subscribe(listener), [subscribe, listener])
}
