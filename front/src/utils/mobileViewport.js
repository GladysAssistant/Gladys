// The phone layout of the scene pages (docs/specs/scene-editor-mobile.md, B): a viewport narrower
// than 768px, or a phone held in landscape — wider than that, but too low for the desktop layout,
// and above all the same device: turning it must not swap one editor for the other in the middle
// of an edit. A phone in landscape is a touch screen at most 500px high (a tablet is higher, a
// low desktop window has a mouse). Evaluated with matchMedia and re-evaluated when it changes
// (rotation, resize).
const MOBILE_MEDIA_QUERY = '(max-width: 767.98px), (max-height: 500px) and (pointer: coarse)';

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
