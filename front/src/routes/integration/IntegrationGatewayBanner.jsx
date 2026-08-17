import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';

const DESCRIPTION_ID = 'integration-gateway-banner-description';

// The "Can't find your device?" banner is a one-off explanation: useful the
// first times, pure noise afterwards — and on a phone its four lines of text
// pushed the whole integration list below the fold (forum #10576).
//
// So on small screens it is reduced to its clickable title, the description
// living in a Bootstrap `.collapse` opened by the toggle. On desktop the
// banner keeps its current always-expanded look: `d-lg-block` (which is
// `!important`) beats `.collapse:not(.show)`, and the chevron affordance is
// hidden there, exactly like the collapsed header menu of the app.
class IntegrationGatewayBanner extends Component {
  toggle = e => {
    e.preventDefault();
    this.setState(prevState => ({ expanded: !prevState.expanded }));
  };

  render(props, { expanded }) {
    return (
      <div class="alert alert-info mb-4">
        <h4 class="alert-title mb-0">
          <span class="d-none d-lg-inline">
            <Text id="integration.root.gatewayBanner.title" />
          </span>
          <a
            href="#"
            class={cx(
              'd-lg-none',
              'd-flex',
              'align-items-center',
              'justify-content-between',
              style.gatewayBannerToggle
            )}
            onClick={this.toggle}
            aria-expanded={expanded ? 'true' : 'false'}
            aria-controls={DESCRIPTION_ID}
          >
            <Text id="integration.root.gatewayBanner.title" />
            <i class={cx('fe', 'ml-2', expanded ? 'fe-chevron-up' : 'fe-chevron-down')} />
          </a>
        </h4>
        <div id={DESCRIPTION_ID} class={cx('collapse', 'd-lg-block', 'mt-2', { show: expanded })}>
          <MarkupText id="integration.root.gatewayBanner.description" />
        </div>
      </div>
    );
  }
}

export default IntegrationGatewayBanner;
