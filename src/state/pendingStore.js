import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export const usePendingStore = create(
  persist(
    (set, _get) => ({
      items: {},

      stage({ type, brand, payload }) {
        const id = uuidv4();
        set((state) => {
          let items = state.items;
          // A brand can only have one pending AM-industry edit: re-staging
          // replaces the earlier staged/failed item instead of appending a
          // duplicate (which would be applied twice, non-deterministically).
          // Applied items are kept as an audit trail; in-flight ('applying')
          // items are never yanked out from under an active request.
          if (type === 'am-industry') {
            const stale = Object.values(items).filter(
              (i) => i.type === 'am-industry'
                && i.brand.global_brand_id === brand.global_brand_id
                && (i.status === 'staged' || i.status === 'failed'),
            );
            if (stale.length > 0) {
              items = { ...items };
              for (const i of stale) delete items[i.id];
            }
          }
          return {
            items: {
              ...items,
              [id]: {
                id, type, brand, payload,
                createdAt: new Date().toISOString(),
                status: 'staged',
                error: null,
              },
            },
          };
        });
        return id;
      },

      remove(id) {
        set((state) => {
          const { [id]: _removed, ...rest } = state.items;
          return { items: rest };
        });
      },

      clear() {
        set({ items: {} });
      },

      setStatus(id, status, error = null) {
        set((state) => {
          const item = state.items[id];
          if (!item) return state;
          return { items: { ...state.items, [id]: { ...item, status, error } } };
        });
      },

      rehydrate() {
        set((state) => {
          const items = { ...state.items };
          for (const id of Object.keys(items)) {
            if (items[id].status === 'applying') {
              items[id] = {
                ...items[id],
                status: 'failed',
                error: { message: 'Interrupted — verify on FreeWheel side before retrying.' },
              };
            }
          }
          return { items };
        });
      },
    }),
    { name: 'adv-brand-dash-pending' },
  ),
);
