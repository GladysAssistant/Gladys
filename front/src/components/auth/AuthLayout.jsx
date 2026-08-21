import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import dashboardStyle from '../../routes/dashboard/style.css';

// One Horizon glass scene for every logged-out page: login, signup, password
// resets, the Gladys Plus flows and the locked keypad. .glass-theme gates the
// shared theme layer, .settings-page reuses the settings grammar (cards,
// forms, buttons, alerts, tables) and .auth-page scopes what is specific to
// these pages (centered column, brand header — style.css next door).
// No .page wrapper of its own: the app-level Layout already provides
// .page > .page-main, and .page-single here only brings the flex centering.
const AuthLayout = ({ children, titleId, size }) => (
  <div
    class={cx(
      'page-single',
      'glass-theme',
      'settings-page',
      'auth-page',
      dashboardStyle.dashboardBackground,
      dashboardStyle.glassScene
    )}
  >
    <div class="container">
      <div
        class={cx(style.authColumn, {
          [style.authColumnMedium]: size === 'medium',
          [style.authColumnWide]: size === 'wide'
        })}
      >
        <div class={style.authBrand}>
          <Localizer>
            <img src="/assets/icons/favicon-96x96.png" alt={<Text id="global.logoAlt" />} />
          </Localizer>
          <h2>
            <Text id={titleId || 'login.title'} />
          </h2>
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
