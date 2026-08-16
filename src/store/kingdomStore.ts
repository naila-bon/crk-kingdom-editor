import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { PlacedDecoration } from '../types/decorations'

interface KingdomState {
  items: PlacedDecoration[]
  addItem: (item: PlacedDecoration) => void
  removeItem: (id: string) => void
  loadLayout: (items: PlacedDecoration[]) => void
}

export const useKingdomStore = create<KingdomState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      loadLayout: (items) => set({ items }),
    }),
    {
      name: 'crk-kingdom-layout',
    },
  ),
)
