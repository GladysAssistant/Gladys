import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import { integrations } from '../../config/integrations';
import style from './style.css';

// Beyond this, the names of the integrations still waiting are summed up as a count
const MAX_WAITING_DISPLAYED = 5;

// Service names that match the key of their catalog entry in no way
const CATALOG_KEY_BY_SERVICE_NAME = {
  'google-actions': 'googleHome'
};

const normalize = name => name.replace(/-/g, '').toLowerCase();

// A native integration is known by its service name ("zigbee2mqtt", "rtsp-camera"…), which is
// the `link` of its catalog entry, or its `key` written differently ("nextcloud-talk" for
// "nextcloudTalk"): its translated title is the one of the catalog card
export const findIntegrationByServiceName = name => {
  const catalogKey = CATALOG_KEY_BY_SERVICE_NAME[name];
  if (catalogKey) {
    return integrations.find(integration => integration.key === catalogKey);
  }
  return (
    integrations.find(integration => (integration.link || integration.key) === name) ||
    integrations.find(integration => normalize(integration.key) === normalize(name))
  );
};

// Only the integrations the user can recognize are named: an external one (named by its
// manifest) or a native one with a catalog card. The technical services without a card
// ("usb", "example"…) are only counted.
const isKnownIntegration = service => Boolean(service.label || findIntegrationByServiceName(service.name));

// An external integration comes with the name of its manifest (`label`), a native one is
// translated, and an unknown one keeps its technical name
const ServiceName = ({ service }) => {
  if (service.label) {
    return <span>{service.label}</span>;
  }
  const integration = findIntegrationByServiceName(service.name);
  if (!integration) {
    return <span>{service.name}</span>;
  }
  return <Text id={`integration.${integration.key}.title`}>{service.name}</Text>;
};

// Displayed on every page while Gladys starts its integrations, one after the other (typically
// right after an update): an integration that is not started yet cannot control its devices, and
// without this notice a light that does not answer looks like a bug of the new version.
const ServicesStartupNotice = ({ servicesStartup }) => {
  const { done, total, current, waiting = [] } = servicesStartup;
  const knownWaiting = waiting.filter(isKnownIntegration);
  const waitingDisplayed = knownWaiting.slice(0, MAX_WAITING_DISPLAYED);
  const waitingNotDisplayed = knownWaiting.length - waitingDisplayed.length;
  return (
    <div
      class={cx(style.updateNoticeCard, style.startupNoticeCard)}
      data-cy="services-startup-notice"
      role="status"
      aria-live="polite"
    >
      <div class={style.updateNoticeTitle}>
        <i class={cx('fe fe-loader', style.startupNoticeIcon)} />
        <span>
          <Text id="header.servicesStartupNoticeTitle" />
        </span>
      </div>
      <div class={style.updateNoticeText}>
        <Text id="header.servicesStartupNoticeText" fields={{ done, total }} />
      </div>
      {current && isKnownIntegration(current) && (
        <div class={style.updateNoticeText}>
          <Text id="header.servicesStartupNoticeCurrent" />{' '}
          <strong>
            <ServiceName service={current} />
          </strong>
        </div>
      )}
      {waitingDisplayed.length > 0 && (
        <div class={style.updateNoticeText}>
          <Text id="header.servicesStartupNoticeWaiting" />{' '}
          {waitingDisplayed.map((service, index) => (
            <span key={service.name}>
              {index > 0 && ', '}
              <ServiceName service={service} />
            </span>
          ))}
          {waitingNotDisplayed > 0 && (
            <span>
              {' '}
              <Text
                id="header.servicesStartupNoticeWaitingMore"
                plural={waitingNotDisplayed}
                fields={{ count: waitingNotDisplayed }}
              />
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// The body class making room for the mobile strip below the fixed top bar (see index.css)
const MOBILE_STRIP_BODY_CLASS = 'gladys-services-starting';

// On mobile the notice above sits in the closed menu, where nobody sees it while trying to switch
// on a light: this one-line strip under the top bar says it right away, and opens the menu with
// the details when tapped. It lives exactly as long as the startup, and so does the room the page
// makes for it.
export class ServicesStartupMobileStrip extends Component {
  componentDidMount() {
    document.body.classList.add(MOBILE_STRIP_BODY_CLASS);
  }

  componentWillUnmount() {
    document.body.classList.remove(MOBILE_STRIP_BODY_CLASS);
  }

  render({ servicesStartup, onClick }) {
    const { done, total } = servicesStartup;
    return (
      <button
        type="button"
        class={cx(style.startupMobileStrip, 'd-lg-none')}
        onClick={onClick}
        data-cy="services-startup-mobile-strip"
        aria-controls="sidebar-navigation"
      >
        <i class={cx('fe fe-loader', style.startupNoticeIcon)} />
        <span class={style.startupMobileStripTitle}>
          <Text id="header.servicesStartupNoticeTitle" />
        </span>
        <span>
          <Text id="header.servicesStartupNoticeProgress" fields={{ done, total }} />
        </span>
      </button>
    );
  }
}

export default ServicesStartupNotice;
