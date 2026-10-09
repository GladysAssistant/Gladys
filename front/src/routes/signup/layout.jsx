import { Text } from 'preact-i18n';
import cx from 'classnames';

import AuthLayout from '../../components/auth/AuthLayout';
import navStyle from '../settings/style.css';
import style from './style.css';

// Numbered progress pills in the settings-tabs grammar; they mark the
// position in the flow and are deliberately not links
const STEPS = [
  { href: '/signup', textId: 'login.welcome' },
  { href: '/signup/create-account-local', textId: 'login.createAccountStep' },
  { href: '/signup/preference', textId: 'login.preferencesStep' },
  { href: '/signup/configure-house', textId: 'login.houseStep' },
  { href: '/signup/success', textId: 'login.success' }
];

const SignupLayout = ({ children, ...props }) => (
  <AuthLayout size="wide">
    <div class={cx(navStyle.settingsTabs, style.signupSteps)}>
      {STEPS.map((step, index) => (
        <span
          key={step.href}
          class={cx(navStyle.tabLink, style.stepPill, {
            [navStyle.tabLinkActive]: props.currentUrl === step.href,
            [style.stepPillActive]: props.currentUrl === step.href
          })}
        >
          <span class={style.stepIndex}>{index + 1}</span>
          <span class={style.stepLabel}>
            <Text id={step.textId} />
          </span>
        </span>
      ))}
    </div>
    <div class="card">
      <div class="card-body p-6">{children}</div>
    </div>
  </AuthLayout>
);

export default SignupLayout;
