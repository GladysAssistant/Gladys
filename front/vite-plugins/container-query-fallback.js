/**
 * Browsers without CSS container queries (Chromium < 105, Safari < 16,
 * Firefox < 110 — the WebView of an old wall tablet) drop every `@container`
 * rule when they parse the stylesheet. The build still targets them
 * (`build.target` in vite.config.mjs), but every component that adapts to the
 * width of its card then rendered its WIDEST form in every card: in a narrow
 * dashboard column the tiles of an integration widget were cut to "2…" and
 * "Obsc…" (community topic 11639).
 *
 * A `max-width` container query describes the compact form a component takes
 * in a narrow card. This PostCSS plugin repeats the rules of each one right
 * after it, inside `@supports not (container-type: inline-size)`: a browser
 * that cannot measure the card renders the component as in the narrowest card
 * — never cut, at worst a notch more compact than needed in a wide one. The
 * copies keep the source order, so where several thresholds set the same
 * property the narrowest one (written last, as it must be for the container
 * queries themselves) wins, exactly as it does in a modern browser on a
 * narrow card. Browsers that support container queries also support
 * `container-type`: the copy never applies to them.
 *
 * Only a lone `max-width` condition is copied. A `min-*` or height query is an
 * enhancement whose base layout is already the compact one, so a browser
 * without container queries keeps that base. The copy drops the container
 * name: rules of a named container must be scoped to that container's content
 * by their own selectors (see components/device/ShutterButtons.css).
 */
const NARROW_CONTAINER_QUERY = /^(?:[a-z][\w-]*\s+)?\(\s*max-width\s*:\s*[^()]+\)$/i;
const FALLBACK_CONDITION = 'not (container-type: inline-size)';

export function containerQueryFallback() {
  return {
    postcssPlugin: 'gladys-container-query-fallback',
    Once(root) {
      root.walkAtRules('container', atRule => {
        if (NARROW_CONTAINER_QUERY.test(atRule.params.trim())) {
          atRule.after(atRule.clone({ name: 'supports', params: FALLBACK_CONDITION }));
        }
      });
    }
  };
}
