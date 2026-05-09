import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useResponsiveUI, VIEWPORT_MD_PX } from "@/hooks/useResponsiveUI";

function mockMatchMedia(map: Record<string, boolean>) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: Boolean(map[query]),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("useResponsiveUI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("desktop fine pointer: whole-card reorder, full celebration, liteMotion off when wide + fine + no reduced motion", () => {
    const mm = mockMatchMedia({
      [`(max-width: ${VIEWPORT_MD_PX - 1}px)`]: false,
      "(pointer: coarse)": false,
      "(prefers-reduced-motion: reduce)": false,
      [`(min-width: ${VIEWPORT_MD_PX}px)`]: true,
      "(pointer: fine)": true,
    });
    vi.spyOn(window, "matchMedia").mockImplementation(mm);

    const { result } = renderHook(() => useResponsiveUI());
    expect(result.current.isNarrowViewport).toBe(false);
    expect(result.current.isCoarsePointer).toBe(false);
    expect(result.current.prefersReducedMotion).toBe(false);
    expect(result.current.liteMotion).toBe(false);
    expect(result.current.reorderDragWholeCard).toBe(true);
    expect(result.current.celebrationQuality).toBe("full");
  });

  it("narrow viewport enables liteMotion and grip-only reorder", () => {
    const mm = mockMatchMedia({
      [`(max-width: ${VIEWPORT_MD_PX - 1}px)`]: true,
      "(pointer: coarse)": false,
      "(prefers-reduced-motion: reduce)": false,
      [`(min-width: ${VIEWPORT_MD_PX}px)`]: false,
      "(pointer: fine)": true,
    });
    vi.spyOn(window, "matchMedia").mockImplementation(mm);

    const { result } = renderHook(() => useResponsiveUI());
    expect(result.current.isNarrowViewport).toBe(true);
    expect(result.current.liteMotion).toBe(true);
    expect(result.current.reorderDragWholeCard).toBe(false);
    expect(result.current.celebrationQuality).toBe("reduced");
  });

  it("prefers-reduced-motion sets minimal celebration and liteMotion", () => {
    const mm = mockMatchMedia({
      [`(max-width: ${VIEWPORT_MD_PX - 1}px)`]: false,
      "(pointer: coarse)": false,
      "(prefers-reduced-motion: reduce)": true,
      [`(min-width: ${VIEWPORT_MD_PX}px)`]: true,
      "(pointer: fine)": true,
    });
    vi.spyOn(window, "matchMedia").mockImplementation(mm);

    const { result } = renderHook(() => useResponsiveUI());
    expect(result.current.prefersReducedMotion).toBe(true);
    expect(result.current.liteMotion).toBe(true);
    expect(result.current.celebrationQuality).toBe("minimal");
  });

  it("updates when matchMedia changes", () => {
    const listeners: Array<() => void> = [];
    const state: Record<string, boolean> = {
      [`(max-width: ${VIEWPORT_MD_PX - 1}px)`]: true,
      "(pointer: coarse)": false,
      "(prefers-reduced-motion: reduce)": false,
      [`(min-width: ${VIEWPORT_MD_PX}px)`]: false,
      "(pointer: fine)": true,
    };

    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      get matches() {
        return Boolean(state[query]);
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_e: string, cb: EventListener) => {
        listeners.push(cb as () => void);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useResponsiveUI());
    expect(result.current.isNarrowViewport).toBe(true);

    state[`(max-width: ${VIEWPORT_MD_PX - 1}px)`] = false;
    state[`(min-width: ${VIEWPORT_MD_PX}px)`] = true;

    act(() => {
      listeners.forEach((fn) => fn());
    });

    expect(result.current.isNarrowViewport).toBe(false);
  });
});
