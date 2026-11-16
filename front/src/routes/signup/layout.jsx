import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import AuthLayout from '../../components/auth/AuthLayout';
import { withMobileViewport, MobileNavBar, MobileSteps, kitStyle } from '../../components/mobile';
import navStyle from '../settings/style.css';
import dashboardStyle from '../dashboard/style.css';
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

const DesktopSignupLayout = ({ children, ...props }) => (
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

// The router keeps the scroll position from one step to the next: a step reached from the
// button at the bottom of the previous one would open on its end
class StartAtTop extends Component {
  componentDidMount() {
    window.scrollTo(0, 0);
  }

  render({ children }) {
    return children;
  }
}

/**
 * @description The shell of an onboarding screen on a phone
 * (docs/specs/mobile-pages/onboarding.md, B): the navigation bar with the brand (and the way
 * back when the step has one), where the user is in the flow, the content of the step. Each
 * step brings its own bottom bar.
 *
 * currentUrl: the step shown, for the progress — a screen outside the five steps (the Gladys
 * Plus restore) shows none. backHref: where the back control leads. title: replaces the brand.
 */
const MobileSignupLayout = ({ children, currentUrl, backHref, title }) => {
  const stepIndex = STEPS.findIndex(step => step.href === currentUrl);
  return (
    <div
      class={cx(
        'glass-theme',
        'settings-page',
        'auth-page',
        dashboardStyle.dashboardBackground,
        dashboardStyle.glassScene
      )}
      data-cy="signup-mobile"
    >
      <StartAtTop />
      <div class={kitStyle.page}>
        <MobileNavBar
          title={
            title || (
              <span class={style.mobileBrand}>
                <Localizer>
                  <img src="/assets/icons/favicon-96x96.png" alt={<Text id="global.logoAlt" />} />
                </Localizer>
                <Text id="login.title" />
              </span>
            )
          }
          backHref={backHref}
        />
        <div class={cx(kitStyle.content, kitStyle.contentWithBottomBar)}>
          {stepIndex >= 0 && (
            <MobileSteps current={stepIndex + 1} total={STEPS.length} label={<Text id={STEPS[stepIndex].textId} />} />
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

// On a phone the onboarding is a flow of full-screen steps
// (docs/specs/mobile-pages/onboarding.md): same containers, same requests.
const SignupLayout = ({ isMobile, ...props }) =>
  isMobile ? <MobileSignupLayout {...props} /> : <DesktopSignupLayout {...props} />;

export { MobileSignupLayout };
export default withMobileViewport(SignupLayout);
