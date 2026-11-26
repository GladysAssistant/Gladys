import { Component } from 'preact';

// The body class the app shell reads to hide its mobile top bar (style/index.css): a focus page
// brings its own navigation bar. Counted, so two focus pages mounted during a route change do
// not remove each other's class.
const FOCUS_PAGE_BODY_CLASS = 'gladys-focus-page';
let mountedFocusPages = 0;

/**
 * @description Marks the page as a "focus page" while it is mounted
 * (docs/specs/mobile-pages/README.md, C.1): on a phone the app's top bar gives way to the
 * page's own MobileNavBar. The class only has an effect below the phone breakpoint, so a page
 * may render it at every width. Renders its children.
 */
class FocusPage extends Component {
  componentDidMount() {
    mountedFocusPages += 1;
    document.body.classList.add(FOCUS_PAGE_BODY_CLASS);
  }

  componentWillUnmount() {
    mountedFocusPages = Math.max(0, mountedFocusPages - 1);
    if (mountedFocusPages === 0) {
      document.body.classList.remove(FOCUS_PAGE_BODY_CLASS);
    }
  }

  render({ children }) {
    return children;
  }
}

export default FocusPage;
