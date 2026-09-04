import { useCallback, useLayoutEffect, useRef } from 'preact/hooks';
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
 * since a portaled menu is positioned once, when it opens.
 *
 * menuPosition is what keeps that pair from fighting each other: with the
 * default 'absolute', react-select makes room for a menu that doesn't fit
 * below the fold by scrolling the page itself (menuShouldScrollIntoView) —
 * and that scroll is seen by closeMenuOnScroll, which closes the menu it just
 * opened. 'fixed' positions the menu against the viewport instead, so
 * react-select never scrolls the page ("DO NOT scroll if position is fixed"):
 * a menu with no room below simply flips above its control, and only a real
 * user scroll closes it.
 *
 * Import this instead of 'react-select' — same API, the portal props can still
 * be overridden by the caller.
 */

/**
 * react-select decides where the menu goes (below or above the control, and
 * how tall) exactly once, when the menu mounts, against window.innerHeight
 * at that moment. Two things routinely change after that, and either one left
 * the bottom of the menu out of reach — the options down there could not be
 * selected at all:
 *
 * - the soft keyboard: on a phone or a tablet the tap that opens the menu
 *   also focuses the search input, and the keyboard slides up right after —
 *   the viewport shrinks by a third and the menu, placed against the old
 *   height, ends up under the keys. A control at the bottom of the widget
 *   edit panel is the typical victim;
 * - the option list growing while the menu is open (the user erases part of
 *   what they typed): a menu that fit below when short grows past the
 *   viewport bottom.
 *
 * This Menu re-runs react-select's own placement (innerRef is MenuPlacer's
 * getPlacement) when the viewport resizes or the menu grows, so
 * the menu is constrained or flipped above the control against the real
 * available space. Only a menu currently below its control is re-placed: the
 * portal ignores a return to the initial 'bottom' placement (react-select
 * 4.x "avoid re-renders if the placement has not changed"), so a menu that
 * went 'top' would be drawn over its control if it came back — and a menu
 * above the control is never under the keyboard anyway.
 */
const Menu = props => {
  const { innerRef, placement } = props;
  const menuElement = useRef(null);
  const lastHeight = useRef(null);
  const latest = useRef();
  latest.current = { innerRef, placement };

  const replace = () => {
    const element = menuElement.current;
    if (!element || latest.current.placement !== 'bottom') {
      return;
    }
    latest.current.innerRef(element);
  };

  // Stable: a ref callback that changes identity is called again on every
  // render, and each call re-runs the placement — which re-renders.
  // Deferred to a microtask: refs are attached before the layout effects of
  // the same commit, and under preact/compat that is where emotion inserts
  // the styles of a class it meets for the first time — so the very first
  // menu of a page is measured unstyled (a plain in-flow div at the end of
  // <body>, every option visible) and lands wherever that garbage says. The
  // microtask runs once the commit and its effects are done, before paint.
  const setRef = useCallback(element => {
    menuElement.current = element;
    if (!element) {
      latest.current.innerRef(element);
      return;
    }
    queueMicrotask(() => {
      if (menuElement.current === element) {
        latest.current.innerRef(element);
      }
    });
  }, []);

  useLayoutEffect(() => {
    window.addEventListener('resize', replace);
    const { visualViewport } = window;
    if (visualViewport) {
      visualViewport.addEventListener('resize', replace);
    }
    return () => {
      window.removeEventListener('resize', replace);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', replace);
      }
    };
  }, []);

  // After every render: the option list is the menu's content, so the menu's
  // height is the cheapest honest signal that the list changed. Only growth
  // re-places: a menu that grew may now overflow the viewport, while one that
  // shrank still fits where it is — and re-placing a menu react-select just
  // constrained would lift the constraint (it fits!) and grow it right back.
  useLayoutEffect(() => {
    const element = menuElement.current;
    if (!element) {
      return;
    }
    const { height } = element.getBoundingClientRect();
    const grew = lastHeight.current !== null && height > lastHeight.current;
    lastHeight.current = height;
    if (grew) {
      replace();
    }
  });

  return <components.Menu {...props} innerRef={setRef} />;
};

const portalProps = () => ({
  menuPlacement: 'auto',
  menuPosition: 'fixed',
  menuPortalTarget: document.body,
  closeMenuOnScroll
});

// a caller's own `components` still win, Menu included
const withMenu = props => ({
  ...props,
  components: { Menu, ...props.components }
});

const Select = props => <ReactSelect {...portalProps()} {...withMenu(props)} />;

export const CreatableSelect = props => <ReactCreatableSelect {...portalProps()} {...withMenu(props)} />;

export default Select;
