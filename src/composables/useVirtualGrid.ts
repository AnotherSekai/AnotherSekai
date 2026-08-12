import { ref, computed, onUnmounted, watch, type Ref, type ShallowRef, nextTick } from "vue";

export interface VirtualGridOptions<T> {
  /** The scrollable container element */
  containerRef: Ref<HTMLElement | null>;
  /** The full list of items */
  items: ShallowRef<T[]> | Ref<T[]>;
  /** Number of columns in the grid */
  columns: Ref<number> | number;
  /** Gap between items in px */
  gap?: number;
  /** Number of extra rows to render above/below viewport */
  bufferRows?: number;
}

export interface VirtualGridReturn<T> {
  /** The visible slice of items to render */
  visibleItems: Ref<{ item: T; index: number }[]>;
  /** Total height of the virtual content area in px */
  totalHeight: Ref<number>;
  /** Top offset for the visible items container in px */
  offsetY: Ref<number>;
  /** Estimated row height (set after first measurement or use default) */
  rowHeight: Ref<number>;
}

export function useVirtualGrid<T>(options: VirtualGridOptions<T>): VirtualGridReturn<T> {
  const { containerRef, items } = options;
  const gap = Math.max(0, options.gap ?? 12);
  const bufferRows = Math.max(0, Math.floor(options.bufferRows ?? 3));

  const cols = typeof options.columns === "number" ? ref(options.columns) : options.columns;
  const safeColumns = computed(() => Math.max(1, Math.floor(cols.value) || 1));

  // Row height is estimated initially, then measured from actual DOM
  const rowHeight = ref(0);
  const scrollTop = ref(0);
  const containerHeight = ref(0);
  let containerWidth = 0;
  let isDisposed = false;

  // We'll measure the first rendered item to get the actual row height
  const needsMeasure = ref(true);

  const totalRows = computed(() => Math.ceil(items.value.length / safeColumns.value));

  const totalHeight = computed(() => {
    if (rowHeight.value === 0 || totalRows.value === 0) return 0;
    return totalRows.value * rowHeight.value + (totalRows.value - 1) * gap;
  });

  const startRow = computed(() => {
    if (rowHeight.value === 0) return 0;
    const effectiveRowHeight = rowHeight.value + gap;
    const row = Math.floor(scrollTop.value / effectiveRowHeight) - bufferRows;
    return Math.min(Math.max(0, totalRows.value - 1), Math.max(0, row));
  });

  const endRow = computed(() => {
    if (rowHeight.value === 0) return Math.min(10, totalRows.value); // render first 10 rows for measurement
    const effectiveRowHeight = rowHeight.value + gap;
    const visibleRows = Math.ceil(containerHeight.value / effectiveRowHeight);
    const row = Math.floor(scrollTop.value / effectiveRowHeight) + visibleRows + bufferRows;
    return Math.min(row, totalRows.value);
  });

  const offsetY = computed(() => {
    if (rowHeight.value === 0) return 0;
    return startRow.value * (rowHeight.value + gap);
  });

  const visibleItems = computed(() => {
    const startIdx = startRow.value * safeColumns.value;
    const endIdx = endRow.value * safeColumns.value;
    const slice = items.value.slice(startIdx, endIdx);
    return slice.map((item, i) => ({
      item,
      index: startIdx + i,
    }));
  });

  let rafId: number | null = null;
  let measureRafId: number | null = null;

  const onScroll = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (containerRef.value) {
        scrollTop.value = containerRef.value.scrollTop;
      }
    });
  };

  const updateContainerHeight = () => {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight;
      const nextWidth = containerRef.value.clientWidth;
      if (containerWidth !== 0 && containerWidth !== nextWidth) {
        needsMeasure.value = true;
        scheduleMeasurement();
      }
      containerWidth = nextWidth;
    }
  };

  const scheduleMeasurement = () => {
    if (measureRafId !== null) cancelAnimationFrame(measureRafId);
    void nextTick(() => {
      if (isDisposed) return;
      measureRafId = requestAnimationFrame(() => {
        measureRafId = null;
        measureRowHeight();
      });
    });
  };

  let resizeObserver: ResizeObserver | null = null;

  const setupListeners = (el: HTMLElement) => {
    el.addEventListener("scroll", onScroll, { passive: true });

    resizeObserver = new ResizeObserver(() => {
      updateContainerHeight();
    });
    resizeObserver.observe(el);

    updateContainerHeight();
  };

  const cleanupListeners = (el: HTMLElement) => {
    el.removeEventListener("scroll", onScroll);
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  };

  // Measure row height from the first grid item
  const measureRowHeight = () => {
    if (!containerRef.value || !needsMeasure.value) return;
    const firstItem = containerRef.value.querySelector("[data-virtual-item]") as HTMLElement | null;
    if (firstItem) {
      const rect = firstItem.getBoundingClientRect();
      if (rect.height > 0) {
        rowHeight.value = rect.height;
        needsMeasure.value = false;
      }
    }
  };

  // Watch for container ref becoming available
  watch(
    containerRef,
    (newEl, oldEl) => {
      if (oldEl) cleanupListeners(oldEl);
      if (newEl) {
        scrollTop.value = newEl.scrollTop;
        setupListeners(newEl);
        scheduleMeasurement();
      }
    },
    { immediate: true },
  );

  // Re-measure when items change (e.g. after loading)
  watch(
    [items, safeColumns],
    () => {
      needsMeasure.value = true;
      rowHeight.value = 0;
      scheduleMeasurement();
    },
    { flush: "post" },
  );

  onUnmounted(() => {
    isDisposed = true;
    if (containerRef.value) {
      cleanupListeners(containerRef.value);
    }
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    if (measureRafId !== null) {
      cancelAnimationFrame(measureRafId);
    }
  });

  return {
    visibleItems,
    totalHeight,
    offsetY,
    rowHeight,
  };
}
