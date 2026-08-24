// A react-select menu portaled to <body> (menuPortalTarget) gets its
// position computed once, when it opens: scrolling any ancestor of the
// control — the widget edit panel above all — moves the control but leaves
// the menu floating where it was. react-select's answer is closeMenuOnScroll:
// close the menu on any scroll that is not the menu's own option list.
// react-select attaches this listener on document in capture phase, so
// scrolls inside nested containers are seen too; the target is the menu's
// list when browsing long options (keep it open) and anything else —
// including document itself — when the page or a panel scrolls (close).
const closeMenuOnScroll = event =>
  !(event.target instanceof HTMLElement && event.target.closest('.react-select__menu-portal'));

export default closeMenuOnScroll;
