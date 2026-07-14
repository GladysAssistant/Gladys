import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import cx from 'classnames';
import { Text } from 'preact-i18n';

import style from './style.css';

const SCROLL_STEP = 200;

const GroupChipsScroll = ({ children }) => {
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
    <div class={style.groupChipsWrapper}>
      {canScrollLeft && (
        <button
          type="button"
          class={cx(style.groupChipsScrollBtn, style.groupChipsScrollBtnLeft)}
          onClick={() => scrollBy(-1)}
          aria-label={<Text id="history.scrollLeft" />}
        >
          <i class="fe fe-chevron-left" />
        </button>
      )}
      <div ref={scrollRef} class={style.groupChips} onScroll={updateScrollState}>
        {children}
      </div>
      {canScrollRight && (
        <button
          type="button"
          class={cx(style.groupChipsScrollBtn, style.groupChipsScrollBtnRight)}
          onClick={() => scrollBy(1)}
          aria-label={<Text id="history.scrollRight" />}
        >
          <i class="fe fe-chevron-right" />
        </button>
      )}
    </div>
  );
};

export default GroupChipsScroll;
