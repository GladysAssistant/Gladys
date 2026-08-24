import { Text } from 'preact-i18n';

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

const TwoFactorAppList = () => (
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

export default TwoFactorAppList;
