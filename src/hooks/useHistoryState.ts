// hooks/useHistoryState.ts
import { useCallback, useState } from 'react'

type Updater<T> = T | ((prev: T) => T)

const resolve = <T,>(updater: Updater<T>, prev: T): T =>
  typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater

type HistoryState<T> = {
  present: T
  undoStack: T[]
  redoStack: T[]
  pendingBefore: T | null
}

export function useHistoryState<T>(initial: T, maxHistory = 100) {
  const [history, setHistory] = useState<HistoryState<T>>({
    present: initial,
    undoStack: [],
    redoStack: [],
    pendingBefore: null,
  })

  const setLive = useCallback((updater: Updater<T>) => {
    setHistory((h) => ({ ...h, present: resolve(updater, h.present) }))
  }, [])

  const commit = useCallback(
    (updater: Updater<T>) => {
      setHistory((h) => {
        const next = resolve(updater, h.present)
        const nextUndo = [...h.undoStack, h.present]
        return {
          present: next,
          undoStack: nextUndo.length > maxHistory ? nextUndo.slice(1) : nextUndo,
          redoStack: [],
          pendingBefore: null,
        }
      })
    },
    [maxHistory],
  )

  const beginInteraction = useCallback(() => {
    setHistory((h) => ({ ...h, pendingBefore: h.present }))
  }, [])

  const commitInteraction = useCallback(() => {
    setHistory((h) => {
      if (h.pendingBefore === null) return h
      const nextUndo = [...h.undoStack, h.pendingBefore]
      return {
        ...h,
        undoStack: nextUndo.length > maxHistory ? nextUndo.slice(1) : nextUndo,
        redoStack: [],
        pendingBefore: null,
      }
    })
  }, [maxHistory])

  const cancelInteraction = useCallback(() => {
    setHistory((h) => ({ ...h, pendingBefore: null }))
  }, [])

  const replace = useCallback((next: T) => {
    setHistory({
      present: next,
      undoStack: [],
      redoStack: [],
      pendingBefore: null,
    })
  }, [])

  // Une seule transition atomique par undo/redo : pas de setState imbriqués,
  // tout est calculé dans le même updater à partir du même snapshot `h`.
  // C'est ce qui rend les appuis rapprochés (Ctrl+Z x3 vite) fiables :
  // chaque appel lit et écrit un seul state cohérent, sans dépendre de
  // l'ordre de résolution de plusieurs setState séparés.
  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.undoStack.length === 0) return h
      const last = h.undoStack[h.undoStack.length - 1]
      return {
        present: last,
        undoStack: h.undoStack.slice(0, -1),
        redoStack: [...h.redoStack, h.present],
        pendingBefore: null,
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.redoStack.length === 0) return h
      const next = h.redoStack[h.redoStack.length - 1]
      return {
        present: next,
        redoStack: h.redoStack.slice(0, -1),
        undoStack: [...h.undoStack, h.present],
        pendingBefore: null,
      }
    })
  }, [])

  return {
    state: history.present,
    setLive,
    commit,
    beginInteraction,
    commitInteraction,
    cancelInteraction,
    replace,
    undo,
    redo,
    canUndo: history.undoStack.length > 0,
    canRedo: history.redoStack.length > 0,
  }
}