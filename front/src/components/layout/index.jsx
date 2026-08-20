import { Component } from 'preact';
import cx from 'classnames';

// The integration catalog and every integration sub-page live on the Horizon
// glass scene, like the dashboard (routes/dashboard/style.css). Applied here,
// on the one wrapper every route shares, so the ~40 integration layouts don't
// each have to carry the theme classes — and a new integration gets the theme
// for free.
import dashboardStyle from '../../routes/dashboard/style.css';
// Glass variants of the Tabler furniture the integration pages are made of —
// loaded here (main bundle) because the code-split catalog CSS is not
import './horizonIntegrations.css';

const NOT_MAIN_PAGES = ['/login'];
const INTEGRATION_URL_PREFIX = '/dashboard/integration';

// The horizontally scrollable chips rows of the integration pages on phones:
// the side menus (list-group markup restyled by horizonIntegrations.css) and
// any scroller wearing the opt-in hz-chips-scroll marker (catalog categories)
const CHIPS_SCROLLERS_SELECTOR = '.list-group-transparent, .hz-chips-scroll';
const CHIPS_OVERFLOW_CLASS = 'hz-chips-overflow';

const notMainPages = currentUrl => {
  const found = NOT_MAIN_PAGES.find(page => {
    return currentUrl.startsWith(page);
  });
  if (found) {
    return true;
  }
  return false;
};

// CSS alone cannot know whether a chips row actually overflows, so the shared
// Layout marks the rows that still have chips past their right edge — the
// class shows the "more to the right" arrow (horizonIntegrations.css), and
// removing it once the row is fully scrolled fades the arrow out. Outside the
// glass theme (settings menus, desktop vertical lists) the class either never
// applies or styles nothing.
class Layout extends Component {
  setPageElement = element => {
    this.pageElement = element;
  };

  markChipsOverflow = scroller => {
    const hasMoreRight = scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft > 2;
    scroller.classList.toggle(CHIPS_OVERFLOW_CLASS, hasMoreRight);
  };

  updateChipsOverflow = () => {
    if (!this.pageElement) {
      return;
    }
    this.pageElement.querySelectorAll(CHIPS_SCROLLERS_SELECTOR).forEach(this.markChipsOverflow);
  };

  // one update per frame, however many mutations the route change produced
  scheduleChipsOverflowUpdate = () => {
    if (this.chipsUpdateScheduled) {
      return;
    }
    this.chipsUpdateScheduled = true;
    requestAnimationFrame(() => {
      this.chipsUpdateScheduled = false;
      this.updateChipsOverflow();
    });
  };

  // scroll does not bubble but it does capture: one listener on the wrapper
  // follows every chips row without touching the 40 integration layouts
  handleScroll = event => {
    const element = event.target;
    if (element && element.matches && element.matches(CHIPS_SCROLLERS_SELECTOR)) {
      this.markChipsOverflow(element);
    }
  };

  componentDidMount() {
    this.pageElement.addEventListener('scroll', this.handleScroll, { capture: true, passive: true });
    window.addEventListener('resize', this.updateChipsOverflow);
    // async route chunks (the catalog) mount without re-rendering the Layout:
    // watch the subtree instead of the lifecycle. Class toggles are attribute
    // mutations, so the childList observer never observes its own updates.
    if (typeof MutationObserver !== 'undefined') {
      this.chipsObserver = new MutationObserver(this.scheduleChipsOverflowUpdate);
      this.chipsObserver.observe(this.pageElement, { childList: true, subtree: true });
    }
    // chips widths settle once the webfont is in
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(this.updateChipsOverflow);
    }
    this.updateChipsOverflow();
  }

  componentDidUpdate() {
    this.updateChipsOverflow();
  }

  componentWillUnmount() {
    this.pageElement.removeEventListener('scroll', this.handleScroll, { capture: true });
    window.removeEventListener('resize', this.updateChipsOverflow);
    if (this.chipsObserver) {
      this.chipsObserver.disconnect();
    }
  }

  render({ children, ...props }) {
    const currentUrl = props.currentUrl || '';
    const integrationPage = currentUrl.startsWith(INTEGRATION_URL_PREFIX);
    return (
      <div class="page" ref={this.setPageElement}>
        <div
          class={cx(notMainPages(currentUrl) ? 'page-single' : 'page-main', {
            [`glass-theme ${dashboardStyle.dashboardBackground} ${dashboardStyle.glassScene}`]: integrationPage
          })}
        >
          {children}
        </div>
      </div>
    );
  }
}

export default Layout;
