import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutItem } from '../layout/computeLayout';
import { NodeID } from '../types';

type LayoutMap = Record<NodeID, LayoutItem>;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReduced(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return reduced;
};

interface AnimatedLayoutOptions {
  duration?: number;
  easing?: (progress: number) => number;
}

export const useAnimatedLayout = (
  layout: LayoutMap,
  { duration = 420, easing = easeOutCubic }: AnimatedLayoutOptions = {},
) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [animatedLayout, setAnimatedLayout] = useState<LayoutMap>(layout);
  const prevLayoutRef = useRef<LayoutMap>(layout);
  const frameRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimatedLayout(layout);
      prevLayoutRef.current = layout;
      return;
    }

    const startLayout = prevLayoutRef.current;
    const endLayout = layout;
    const keys = new Set<NodeID>([
      ...Object.keys(startLayout) as NodeID[],
      ...Object.keys(endLayout) as NodeID[],
    ]);

    if (!keys.size) {
      setAnimatedLayout(endLayout);
      prevLayoutRef.current = endLayout;
      return;
    }

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    const startTimeRef = { value: 0 };

    const step = (timestamp: number) => {
      if (!startTimeRef.value) {
        startTimeRef.value = timestamp;
      }

      const elapsed = timestamp - startTimeRef.value;
      const rawProgress = duration > 0 ? Math.min(1, elapsed / duration) : 1;
      const progress = easing(rawProgress);

      const nextLayout: LayoutMap = {};

      keys.forEach((key) => {
        const from = startLayout[key];
        const to = endLayout[key];

        if (!from && !to) return;

        if (!from || !to) {
          nextLayout[key] = (to ?? from)!;
          return;
        }

        nextLayout[key] = {
          depth: to.depth,
          x: from.x + (to.x - from.x) * progress,
          y: from.y + (to.y - from.y) * progress,
        };
      });

      setAnimatedLayout(nextLayout);

      if (rawProgress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        prevLayoutRef.current = endLayout;
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [layout, duration, easing, prefersReducedMotion]);

  return useMemo(() => animatedLayout, [animatedLayout]);
};
