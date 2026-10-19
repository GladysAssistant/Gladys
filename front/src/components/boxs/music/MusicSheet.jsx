import { Component } from 'preact';
import { createPortal } from 'preact/compat';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import style from './MusicBox.css';

// The queue and the catalog of a player open over the dashboard, never inside the card: a card that
// grows pushes every widget under it. Same shell as the light panel: a bottom sheet on a phone, a
// centered dialog from 576px, rendered on <body> (the cards' backdrop filters would clip a fixed
// overlay nested in them), closing on Escape / backdrop / ×, the page scroll locked while open. Its
// height is fixed, so a search narrowing its results never resizes it either.
class MusicSheet extends Component {
  constructor(props) {
    super(props);
    // read before the content mounts: the search field may take the focus right away
    this.previousFocus = typeof document !== 'undefined' ? document.activeElement : null;
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (this.sheet && !this.sheet.contains(document.activeElement)) {
      this.sheet.focus();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = this.previousBodyOverflow;
    // the keyboard goes back to the button that opened the sheet
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus();
    }
  }

  setSheetRef = element => {
    this.sheet = element;
  };

  handleKeyDown = event => {
    if (event.key === 'Escape') {
      this.props.onClose();
    }
  };

  handleOverlayClick = event => {
    // only a click on the backdrop itself closes the sheet, not one bubbling up from a control
    if (event.target === event.currentTarget) {
      this.props.onClose();
    }
  };

  render({ title, tabs, activeTab, onSelectTab, onClose, footer, children }) {
    return createPortal(
      <div class={cx('glass-theme', style.sheetOverlay)} onClick={this.handleOverlayClick}>
        <div
          class={style.sheet}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex="-1"
          ref={this.setSheetRef}
        >
          <div class={style.sheetHandle} />
          <div class={style.sheetHeader}>
            <span class={style.sheetTitle}>{title}</span>
            <Localizer>
              <button
                type="button"
                class={style.sheetClose}
                onClick={onClose}
                title={<Text id="dashboard.boxes.music.close" />}
                aria-label={<Text id="dashboard.boxes.music.close" />}
              >
                <i class="fe fe-x" />
              </button>
            </Localizer>
          </div>
          {tabs.length > 1 && (
            <div class={cx('btn-group', 'hz-segmented', 'w-100', style.sheetTabs)} role="tablist">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key ? 'true' : 'false'}
                  class={cx('btn', 'btn-sm', { active: activeTab === tab.key })}
                  onClick={() => onSelectTab(tab.key)}
                >
                  <i class={`fe fe-${tab.icon} mr-1`} />
                  <Text id={tab.labelKey} />
                </button>
              ))}
            </div>
          )}
          <div class={style.sheetBody}>{children}</div>
          {footer}
        </div>
      </div>,
      document.body
    );
  }
}

export default MusicSheet;
