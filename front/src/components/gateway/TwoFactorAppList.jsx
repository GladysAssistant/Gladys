import { Text } from 'preact-i18n';

import authStyle from '../auth/style.css';
import { MobileGroup, MobileRow, kitStyle } from '../mobile';

// Any app implementing TOTP works, but most users don't have one yet: we
// recommend a few free apps that only require a download (no account, no SMS).
const TWO_FACTOR_APPS = [
  {
    name: 'Google Authenticator',
    ios: 'https://apps.apple.com/app/google-authenticator/id388497605',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2'
  },
  {
    name: 'Microsoft Authenticator',
    ios: 'https://apps.apple.com/app/microsoft-authenticator/id983156458',
    android: 'https://play.google.com/store/apps/details?id=com.azure.authenticator'
  },
  {
    name: '2FAS',
    ios: 'https://apps.apple.com/app/2fa-authenticator-2fas/id1217793794',
    android: 'https://play.google.com/store/apps/details?id=com.twofasapp'
  },
  {
    name: 'Ente Auth',
    ios: 'https://apps.apple.com/app/ente-auth/id6444121398',
    android: 'https://play.google.com/store/apps/details?id=io.ente.auth'
  }
];

// The store of the phone the page is opened on, when it says which one it is
const getStorePlatform = () => {
  const userAgent = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return 'ios';
  }
  return null;
};

// The apps on a phone (docs/specs/mobile-pages/auth.md, D.3): one row per app. On an iPhone or
// an Android phone the row opens the app in the store of that phone; elsewhere it carries both
// links, each one a target of its own
const MobileTwoFactorAppList = () => {
  const platform = getStorePlatform();
  return (
    <div data-cy="two-factor-apps-mobile">
      <p class={kitStyle.lead}>
        <Text id="twoFactorApps.description" />
      </p>
      <MobileGroup>
        {TWO_FACTOR_APPS.map(app =>
          platform ? (
            <MobileRow
              key={app.name}
              icon="shield"
              title={app.name}
              href={app[platform]}
              target="_blank"
              rel="noopener noreferrer"
              dataCy="two-factor-app"
            />
          ) : (
            <MobileRow
              key={app.name}
              icon="shield"
              title={app.name}
              trailing={
                <span class={authStyle.mobileStoreLinks}>
                  <a href={app.ios} target="_blank" rel="noopener noreferrer" aria-label={`${app.name} - iOS`}>
                    iOS
                  </a>
                  <a href={app.android} target="_blank" rel="noopener noreferrer" aria-label={`${app.name} - Android`}>
                    Android
                  </a>
                </span>
              }
              dataCy="two-factor-app"
            />
          )
        )}
      </MobileGroup>
    </div>
  );
};

const DesktopTwoFactorAppList = () => (
  <div class="form-group">
    <p>
      <Text id="twoFactorApps.description" />
    </p>
    <ul class="list-unstyled mb-0">
      {TWO_FACTOR_APPS.map(app => (
        <li key={app.name} class="mb-2">
          <strong>{app.name}</strong>{' '}
          <a href={app.ios} target="_blank" rel="noopener noreferrer" aria-label={`${app.name} - iOS`}>
            iOS
          </a>
          {' - '}
          <a href={app.android} target="_blank" rel="noopener noreferrer" aria-label={`${app.name} - Android`}>
            Android
          </a>
        </li>
      ))}
    </ul>
  </div>
);

// mobile: the phone layout, for the pages that have one (the others keep the list above)
const TwoFactorAppList = ({ mobile }) => (mobile ? <MobileTwoFactorAppList /> : <DesktopTwoFactorAppList />);

export default TwoFactorAppList;
