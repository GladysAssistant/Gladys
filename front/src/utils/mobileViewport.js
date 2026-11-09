// The phone layout of the scene pages (docs/specs/scene-editor-mobile.md, B): a viewport narrower
// than 768px. Evaluated with matchMedia and re-evaluated when it changes (rotation, resize).
const MOBILE_MEDIA_QUERY = '(max-width: 767.98px)';

const getMediaQueryList = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(MOBILE_MEDIA_QUERY)
    : null;

const isMobileViewport = () => {
  const mediaQueryList = getMediaQueryList();
  return mediaQueryList ? mediaQueryList.matches : false;
};

// Calls listener(isMobile) each time the viewport crosses the breakpoint; returns the unsubscribe
// function. Safari < 14 only knows the deprecated addListener/removeListener.
const watchMobileViewport = listener => {
  const mediaQueryList = getMediaQueryList();
  if (!mediaQueryList) {
    return () => {};
  }
  const onChange = event => listener(event.matches);
  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', onChange);
    return () => mediaQueryList.removeEventListener('change', onChange);
  }
  mediaQueryList.addListener(onChange);
  return () => mediaQueryList.removeListener(onChange);
};

export { MOBILE_MEDIA_QUERY, isMobileViewport, watchMobileViewport };
