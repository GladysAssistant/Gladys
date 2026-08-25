import ReactSelect from 'react-select';
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
 * Import this instead of 'react-select' — same API, the portal props can still
 * be overridden by the caller.
 */
const portalProps = () => ({
  menuPlacement: 'auto',
  menuPortalTarget: document.body,
  closeMenuOnScroll
});

const Select = props => <ReactSelect {...portalProps()} {...props} />;

export const CreatableSelect = props => <ReactCreatableSelect {...portalProps()} {...props} />;

export default Select;
