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

const INTEGRATION_URL_PREFIX = '/dashboard/integration';

// The horizontally scrollable chips rows of the integration pages on phones:
// the side menus (list-group markup restyled by horizonIntegrations.css) and
// any scroller wearing the opt-in hz-chips-scroll marker (catalog categories)
const CHIPS_SCROLLERS_SELECTOR = '.list-group-transparent, .hz-chips-scroll';
const CHIPS_OVERFLOW_LEFT_CLASS = 'hz-chips-overflow-left';
const CHIPS_OVERFLOW_RIGHT_CLASS = 'hz-chips-overflow-right';
// sub-pixel scroll positions (zoom, fractional widths) must not leave an
// arrow lit on a side that is in fact reached
const CHIPS_SCROLL_EPSILON = 2;

const isIntegrationPage = (currentUrl = '') => currentUrl.startsWith(INTEGRATION_URL_PREFIX);

// CSS alone cannot know whether a chips row actually overflows, so the shared
// Layout marks the rows that still have chips past an edge — each class shows
// the arrow on its side (horizonIntegrations.css), and removing it once that
// side is reached fades the arrow out. Outside the glass theme (settings
// menus, desktop vertical lists) the classes either never apply or style
// nothing. LTR only, like the app's three locales: an RTL scroller reports
// negative scrollLeft values this does not model.
class Layout extends Component {
  setPageElement = element => {
    this.pageElement = element;
  };

  markChipsOverflow = scroller => {
    const scrolled = scroller.scrollLeft;
    const remaining = scroller.scrollWidth - scroller.clientWidth - scrolled;
    scroller.classList.toggle(CHIPS_OVERFLOW_LEFT_CLASS, scrolled > CHIPS_SCROLL_EPSILON);
    scroller.classList.toggle(CHIPS_OVERFLOW_RIGHT_CLASS, remaining > CHIPS_SCROLL_EPSILON);
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

  // chip widths only settle once the webfont is in: a row measured with the
  // fallback font can be judged as fitting when the real one overflows
  updateChipsOverflowWhenFontsReady = async () => {
    if (!document.fonts || !document.fonts.ready) {
      return;
    }
    await document.fonts.ready;
    this.updateChipsOverflow();
  };

  // Only the integration pages have chips rows, and this watches the whole
  // app shell (the wrapper holds the nav rail and every route): left running
  // everywhere it would re-scan the page on each dashboard-widget or
  // scene-editor mutation, which a Raspberry Pi does not need to pay for.
  startWatchingChips() {
    if (this.watchingChips) {
      return;
    }
    this.watchingChips = true;
    this.pageElement.addEventListener('scroll', this.handleScroll, { capture: true, passive: true });
    window.addEventListener('resize', this.updateChipsOverflow);
    // async route chunks (the catalog) mount without re-rendering the Layout:
    // watch the subtree instead of the lifecycle. Class toggles are attribute
    // mutations, so the childList observer never observes its own updates.
    if (typeof MutationObserver !== 'undefined') {
      this.chipsObserver = new MutationObserver(this.scheduleChipsOverflowUpdate);
      this.chipsObserver.observe(this.pageElement, { childList: true, subtree: true });
    }
    this.updateChipsOverflowWhenFontsReady();
    this.updateChipsOverflow();
  }

  stopWatchingChips() {
    if (!this.watchingChips) {
      return;
    }
    this.watchingChips = false;
    this.pageElement.removeEventListener('scroll', this.handleScroll, { capture: true });
    window.removeEventListener('resize', this.updateChipsOverflow);
    if (this.chipsObserver) {
      this.chipsObserver.disconnect();
      this.chipsObserver = null;
    }
  }

  syncChipsWatcher() {
    if (isIntegrationPage(this.props.currentUrl)) {
      this.startWatchingChips();
    } else {
      this.stopWatchingChips();
    }
  }

  componentDidMount() {
    this.syncChipsWatcher();
  }

  componentDidUpdate() {
    this.syncChipsWatcher();
    if (this.watchingChips) {
      this.updateChipsOverflow();
    }
  }

  componentWillUnmount() {
    this.stopWatchingChips();
  }

  render({ children, ...props }) {
    const currentUrl = props.currentUrl || '';
    const integrationPage = isIntegrationPage(currentUrl);
    return (
      <div class="page" ref={this.setPageElement}>
        <div
          class={cx('page-main', {
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
