import { useLayoutEffect, useState, type ReactNode, type RefObject } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

type VirtualWindowGoalListProps<T extends { id: string }> = {
  items: T[];
  /** Element whose document Y-origin marks the start of the virtual range (usually a wrapper around this list). */
  scrollAnchorRef: RefObject<HTMLElement | null>;
  /** Typical row height in px (TanStack measures actual size via `measureElement`). */
  rowEstimatePx: number;
  gap?: number;
  overscan?: number;
  className?: string;
  renderItem: (item: T, index: number) => ReactNode;
};

/**
 * Window-scroll virtualization for tall goal lists. Keeps off-screen DOM light while preserving document flow via scrollMargin.
 */
export function VirtualWindowGoalList<T extends { id: string }>({
  items,
  scrollAnchorRef,
  rowEstimatePx,
  gap = 16,
  overscan = 6,
  className,
  renderItem,
}: VirtualWindowGoalListProps<T>) {
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const el = scrollAnchorRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setScrollMargin(rect.top + window.scrollY);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [scrollAnchorRef, items.length]);

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => rowEstimatePx,
    overscan,
    gap,
    scrollMargin,
    useFlushSync: false,
    enabled: items.length > 0,
    getItemKey: (index) => items[index]?.id ?? index,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      className={className}
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: "100%",
        position: "relative",
      }}
    >
      {virtualItems.map((virtualRow) => (
        <div
          key={virtualRow.key}
          data-index={virtualRow.index}
          ref={virtualizer.measureElement}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {renderItem(items[virtualRow.index], virtualRow.index)}
        </div>
      ))}
    </div>
  );
}
