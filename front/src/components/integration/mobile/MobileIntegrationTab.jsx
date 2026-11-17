import { Component, createContext } from 'preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import { MobileToast, kitStyle } from '../../mobile';
import style from './style.css';

// showToast(message): the rows of a list ask their tab for the toast — a row that just deleted
// or added its device is gone from the list when its request is over
const MobileIntegrationToastContext = createContext(() => {});

/**
 * @description The content of a "Devices" or "Discovery" tab of an integration on a phone
 * (docs/specs/mobile-pages/integration-devices.md, B): a column at the width of a phone under
 * the chips of the integration, which owns the toast of the tab and its floating "+".
 *
 * fab: { href, label (a string), dataCy } — the creation of a device when the integration has
 * a page for it.
 */
class MobileIntegrationTab extends Component {
  state = {
    toast: null,
    toastKey: 0
  };

  showToast = message => this.setState(prevState => ({ toast: message, toastKey: prevState.toastKey + 1 }));

  closeToast = () => this.setState({ toast: null });

  render({ children, fab, dataCy }, { toast, toastKey }) {
    return (
      <MobileIntegrationToastContext.Provider value={this.showToast}>
        <div class={cx(style.page, { [style.pageWithFab]: fab })} data-cy={dataCy}>
          {children}
          {fab && (
            <Link
              href={fab.href}
              class={cx(kitStyle.fab, style.fabLink)}
              aria-label={fab.label}
              data-cy={fab.dataCy || 'integration-mobile-create'}
            >
              <i class="fe fe-plus" aria-hidden="true" />
            </Link>
          )}
          <MobileToast
            message={toast}
            toastKey={toastKey}
            onClose={this.closeToast}
            aboveBar={Boolean(fab)}
            dataCy="integration-mobile-toast"
          />
        </div>
      </MobileIntegrationToastContext.Provider>
    );
  }
}

export { MobileIntegrationToastContext };
export default MobileIntegrationTab;
