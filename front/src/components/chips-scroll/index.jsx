import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Localizer } from 'preact-i18n';

const SCROLL_STEP = 200;

// The Horizon horizontal chips scroller (history filters, settings menu):
// a row that scrolls sideways with the scrollbar hidden, translates vertical
// wheel movement into horizontal scroll, and renders an arrow on each side
// only while chips remain past that edge. All visuals come from the caller —
// this component owns the overflow bookkeeping, each route its grammar.
// The label props are <Text> vnodes: aria-label only takes a string, so the
// buttons render inside <Localizer>, which resolves them (app-wide idiom).
const ChipsScroll = ({
  children,
  wrapperClass,
  scrollerClass,
  leftButtonClass,
  rightButtonClass,
  scrollLeftLabel,
  scrollRightLabel,
  activeSelector,
  activeKey
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

      const previous = el.scrollLeft;
      el.scrollLeft += event.deltaY;
      // at a boundary the position cannot move any further: leave the
      // default action alone so the page keeps scrolling under the pointer
      if (el.scrollLeft === previous) {
        return;
      }

      event.preventDefault();
      updateScrollState();
    };

    el.addEventListener('wheel', onWheel, { passive: false });

    let resizeObserver;
    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(updateScrollState);
      resizeObserver.observe(el);
    }

    // the observer watches the scroller's box, not its content: a webfont
    // swap that widens the chips resizes nothing, so re-measure once the
    // fonts are in (same move as Layout's integration chips watcher)
    let cancelled = false;
    const updateWhenFontsReady = async () => {
      if (!document.fonts || !document.fonts.ready) {
        return;
      }
      await document.fonts.ready;
      if (!cancelled) {
        updateScrollState();
      }
    };
    updateWhenFontsReady();

    return () => {
      cancelled = true;
      el.removeEventListener('wheel', onWheel);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [updateScrollState]);

  // Bring the chip matching activeSelector (e.g. the current section's pill)
  // to the scroller's center on mount and whenever activeKey changes —
  // otherwise opening a section that lives past the fold shows a row with no
  // selected chip in sight. Scrolled by hand rather than scrollIntoView,
  // which could also scroll the page itself.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !activeSelector) {
      return undefined;
    }

    const centerActive = () => {
      const active = el.querySelector(activeSelector);
      if (!active) {
        return;
      }
      const scrollerRect = el.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      el.scrollLeft += activeRect.left - scrollerRect.left - (scrollerRect.width - activeRect.width) / 2;
      updateScrollState();
    };

    // centering makes the overflow arrows appear, and the edge padding they
    // reserve (the callers' :has() rules) lands on later frames and shifts
    // the target — re-run on the next frames until the position settles
    let raf;
    let attempts = 0;
    const run = () => {
      const before = el.scrollLeft;
      centerActive();
      attempts += 1;
      if (attempts < 4 && el.scrollLeft !== before) {
        raf = requestAnimationFrame(run);
      }
    };
    run();
    return () => cancelAnimationFrame(raf);
  }, [activeSelector, activeKey, updateScrollState]);

  const scrollBy = direction => {
    scrollRef.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: 'smooth' });
  };

  return (
    <div class={wrapperClass}>
      {canScrollLeft && (
        <Localizer>
          <button type="button" class={leftButtonClass} onClick={() => scrollBy(-1)} aria-label={scrollLeftLabel}>
            <i class="fe fe-chevron-left" />
          </button>
        </Localizer>
      )}
      <div ref={scrollRef} class={scrollerClass} onScroll={updateScrollState}>
        {children}
      </div>
      {canScrollRight && (
        <Localizer>
          <button type="button" class={rightButtonClass} onClick={() => scrollBy(1)} aria-label={scrollRightLabel}>
            <i class="fe fe-chevron-right" />
          </button>
        </Localizer>
      )}
    </div>
  );
};

export default ChipsScroll;
