import { createContext } from 'preact';
import { createPortal } from 'preact/compat';
import { useContext, useLayoutEffect, useReducer } from 'preact/hooks';
import ReactSelect, { components } from 'react-select';
import ReactCreatableSelect from 'react-select/creatable';

import closeMenuOnScroll from '../../utils/closeMenuOnScroll';

/**
 * react-select with its menu rendered on <body> instead of inside the card.
 *
 * Every card of the app is glass: `.glass-theme .card` carries a
 * backdrop-filter, and a backdrop filter makes its element a stacking context
 * — so a menu opened inside a card is that card's prisoner whatever z-index it
 * gets from the inside, and the cards that follow it in the document paint
 * over it. react-select's answer is menuPortalTarget: the menu is rendered on
 * <body>, out of every card, and positioned against its control. Its z-index
 * lives on `.react-select__menu-portal` (style/index.css), and
 * closeMenuOnScroll closes it when the page or a panel scrolls underneath,
 * since a portaled menu is positioned against its control, not scrolled with
 * it.
 *
 * The placement itself (below or above the control, how tall) is this
 * wrapper's, not react-select's. react-select 4 decides it exactly once, when
 * the menu mounts, by measuring the menu against window.innerHeight — and
 * that left menus out of reach at the bottom of the screen (forum 10749):
 *
 * - it measures the menu, so the side depends on how many options the filter
 *   leaves at that moment: a menu opened short (one match) fits below, and
 *   when the filter is erased it grows to its full height, past the bottom
 *   of the viewport;
 * - it never looks again: the soft keyboard that slides up right after the
 *   tap which opened the menu shrinks the viewport under a menu placed for
 *   the full height;
 * - innerHeight is the layout viewport: on iOS (and some Android WebViews)
 *   the keyboard shrinks the visual viewport only, so even a fresh placement
 *   would put the menu under the keys;
 * - and it measures at ref time, before the layout effects of the same
 *   commit — where, under preact/compat, emotion inserts the styles of a
 *   class it meets for the first time — so the very first menu of a page was
 *   measured unstyled, an in-flow div at the end of <body>, and placed on
 *   garbage (usually flipped above its control, cut by the top of the screen
 *   when there was no room there).
 *
 * So MenuPortal below decides the side and the height from the control's
 * rectangle and the visible viewport alone, on every render and whenever the
 * visible viewport changes, and hands them to Menu and MenuList through a
 * context; react-select's own MenuPlacer is left with nothing to measure.
 *
 * Import this instead of 'react-select' — same API, the portal props and the
 * components can still be overridden by the caller.
 */

// the placement decided by MenuPortal, read by Menu (side) and MenuList (height)
const PlacementContext = createContext(null);

// The part of the layout viewport the user can actually see, in the
// coordinates of getBoundingClientRect and position: fixed. Both differ when
// the soft keyboard is up on iOS: the visual viewport shrinks (and scrolls),
// window.innerHeight does not move.
const getVisibleViewport = () => {
  const { visualViewport } = window;
  if (visualViewport) {
    return { top: visualViewport.offsetTop, bottom: visualViewport.offsetTop + visualViewport.height };
  }
  return { top: 0, bottom: window.innerHeight };
};

// react-select's own policy for a fixed 'auto' menu — below when at least
// minMenuHeight fits there (constrained to the room), above otherwise — but
// against the visible viewport and the control alone: the side never depends
// on the menu's content, and the height never exceeds the room there is, so a
// list that grows while the menu is open cannot push it off screen.
const placeMenu = ({ rect, viewport, menuPlacement, maxMenuHeight, minMenuHeight, gutter }) => {
  const below = { placement: 'bottom', maxHeight: Math.min(maxMenuHeight, viewport.bottom - rect.bottom - gutter) };
  const above = { placement: 'top', maxHeight: Math.min(maxMenuHeight, rect.top - viewport.top - gutter) };
  const [preferred, other] = menuPlacement === 'top' ? [above, below] : [below, above];
  if (preferred.maxHeight >= minMenuHeight) {
    return preferred;
  }
  if (other.maxHeight >= minMenuHeight) {
    return other;
  }
  // no decent room on either side: the larger one, as tall as that room and
  // no taller (a menu past the edge of the screen is the bug), the list
  // scrolls — the control alone filling the visible viewport leaves nothing
  const larger = preferred.maxHeight >= other.maxHeight ? preferred : other;
  return { placement: larger.placement, maxHeight: Math.max(0, larger.maxHeight) };
};

const MenuPortal = props => {
  const { appendTo, children, className, controlElement, cx, innerProps, selectProps, theme } = props;
  // re-read the control and the viewport when the visible viewport changes:
  // window resize (Android's keyboard, a desktop window), visual viewport
  // resize and scroll (iOS's keyboard, a pinch-zoom)
  const [, relayout] = useReducer(count => count + 1, 0);
  useLayoutEffect(() => {
    const { visualViewport } = window;
    window.addEventListener('resize', relayout);
    if (visualViewport) {
      visualViewport.addEventListener('resize', relayout);
      visualViewport.addEventListener('scroll', relayout);
    }
    return () => {
      window.removeEventListener('resize', relayout);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', relayout);
        visualViewport.removeEventListener('scroll', relayout);
      }
    };
  }, []);
  if (!controlElement) {
    return null;
  }
  const rect = controlElement.getBoundingClientRect();
  const placement = placeMenu({
    rect,
    viewport: getVisibleViewport(),
    menuPlacement: selectProps.menuPlacement,
    maxMenuHeight: selectProps.maxMenuHeight,
    minMenuHeight: selectProps.minMenuHeight,
    gutter: theme.spacing.menuGutter
  });
  // the menu hangs from the portal's edge: its top for a menu below the
  // control (react-select's Menu sets top: 100%), its bottom for one above
  // (bottom: 100%) — so the portal sits on the control's bottom or top edge
  const style = {
    position: 'fixed',
    left: rect.left,
    width: rect.width,
    top: placement.placement === 'top' ? rect.top : rect.bottom,
    zIndex: 1
  };
  return createPortal(
    <PlacementContext.Provider value={placement}>
      {/* eslint-disable-next-line react/forbid-dom-props -- a position computed at render, like react-select's own portal */}
      <div className={cx({ 'menu-portal': true }, className)} style={style} {...innerProps}>
        {children}
      </div>
    </PlacementContext.Provider>,
    appendTo || document.body
  );
};

const Menu = props => {
  const placement = useContext(PlacementContext);
  // innerRef is MenuPlacer's measure-and-place, withheld: the portal placed
  // the menu already, and MenuPlacer would scroll the page for a menu it
  // believes does not fit
  return (
    <components.Menu {...props} innerRef={undefined} placement={placement ? placement.placement : props.placement} />
  );
};

const MenuList = props => {
  const placement = useContext(PlacementContext);
  return <components.MenuList {...props} maxHeight={placement ? placement.maxHeight : props.maxHeight} />;
};

const portalProps = () => ({
  menuPlacement: 'auto',
  menuPosition: 'fixed',
  menuPortalTarget: document.body,
  closeMenuOnScroll
});

// a caller's own components still win
const withComponents = props => ({
  ...props,
  components: { MenuPortal, Menu, MenuList, ...props.components }
});

const Select = props => <ReactSelect {...portalProps()} {...withComponents(props)} />;

export const CreatableSelect = props => <ReactCreatableSelect {...portalProps()} {...withComponents(props)} />;

export default Select;
