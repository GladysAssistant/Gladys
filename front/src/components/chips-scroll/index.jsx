import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

const SCROLL_STEP = 200;

// The Horizon horizontal chips scroller (history filters, settings menu):
// a row that scrolls sideways with the scrollbar hidden, translates vertical
// wheel movement into horizontal scroll, and renders an arrow on each side
// only while chips remain past that edge. All visuals come from the caller —
// this component owns the overflow bookkeeping, each route its grammar.
const ChipsScroll = ({
  children,
  wrapperClass,
  scrollerClass,
  leftButtonClass,
  rightButtonClass,
  scrollLeftLabel,
  scrollRightLabel
}) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const { scrollLeft, clientWidth, scrollWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();

    const el = scrollRef.current;
    if (!el) {
      return undefined;
    }

    const onWheel = event => {
      if (el.scrollWidth <= el.clientWidth) {
        return;
      }

      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }

      event.preventDefault();
      el.scrollLeft += event.deltaY;
      updateScrollState();
    };

    el.addEventListener('wheel', onWheel, { passive: false });

    let resizeObserver;
    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(updateScrollState);
      resizeObserver.observe(el);
    }

    return () => {
      el.removeEventListener('wheel', onWheel);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [updateScrollState]);

  const scrollBy = direction => {
    scrollRef.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: 'smooth' });
  };

  return (
    <div class={wrapperClass}>
      {canScrollLeft && (
        <button type="button" class={leftButtonClass} onClick={() => scrollBy(-1)} aria-label={scrollLeftLabel}>
          <i class="fe fe-chevron-left" />
        </button>
      )}
      <div ref={scrollRef} class={scrollerClass} onScroll={updateScrollState}>
        {children}
      </div>
      {canScrollRight && (
        <button type="button" class={rightButtonClass} onClick={() => scrollBy(1)} aria-label={scrollRightLabel}>
          <i class="fe fe-chevron-right" />
        </button>
      )}
    </div>
  );
};

export default ChipsScroll;
