import { Text, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import style from '../style.css';
import { withMobileViewport, MobileBottomBar, BigButton, kitStyle } from '../../../components/mobile';

// The signup ends on Gladys itself — what the platform can do and how open
// it is — rather than on its author: three feature panels (integrations,
// scenes, open source), a closing line and the dashboard CTA.
const FEATURES = [
  { key: 'integrations', icon: 'fe-radio', tint: style.successFeatureBlue },
  { key: 'scenes', icon: 'fe-play', tint: style.successFeatureAmber },
  { key: 'openSource', icon: 'fe-github', tint: style.successFeatureGreen }
];

const DesktopSuccessTab = () => (
  <div class={style.successTab}>
    <h2 class={style.signupTitle}>
      <Text id="signup.success.title" />
    </h2>
    <p class={style.successSubtitle}>
      <Text id="signup.success.subtitle" />
    </p>
    <div class={style.successFeatures}>
      {FEATURES.map(feature => (
        <div key={feature.key} class={style.successFeature}>
          <span class={cx(style.successFeatureIcon, feature.tint)}>
            <i class={`fe ${feature.icon}`} />
          </span>
          <h4>
            <Text id={`signup.success.${feature.key}Title`} />
          </h4>
          <p>
            <MarkupText id={`signup.success.${feature.key}Text`} />
          </p>
        </div>
      ))}
    </div>
    <p class={style.successClosing}>
      <Text id="signup.success.closing" />
    </p>
    <Link class="btn btn-primary" href="/dashboard">
      <Text id="signup.success.goToDashboardButton" />
    </Link>
  </div>
);

// The last screen on a phone (docs/specs/mobile-pages/onboarding.md, C.5): the same three
// panels, stacked, and the way to the dashboard in the bottom bar
const MobileSuccessTab = () => (
  <div data-cy="signup-success-mobile">
    <h1 class={kitStyle.largeTitle}>
      <Text id="signup.success.title" />
    </h1>
    <p class={kitStyle.lead}>
      <Text id="signup.success.subtitle" />
    </p>
    <div class={kitStyle.stack}>
      {FEATURES.map(feature => (
        <div key={feature.key} class={style.mobileFeature}>
          <span class={cx(style.successFeatureIcon, style.mobileFeatureIcon, feature.tint)} aria-hidden="true">
            <i class={`fe ${feature.icon}`} />
          </span>
          <div class={style.mobileFeatureText}>
            <h2>
              <Text id={`signup.success.${feature.key}Title`} />
            </h2>
            <div>
              <MarkupText id={`signup.success.${feature.key}Text`} />
            </div>
          </div>
        </div>
      ))}
    </div>
    <p class={style.mobileClosing}>
      <Text id="signup.success.closing" />
    </p>
    <MobileBottomBar>
      <BigButton variant="primary" href="/dashboard" data-cy="signup-go-to-dashboard">
        <Text id="signup.success.goToDashboardButton" />
      </BigButton>
    </MobileBottomBar>
  </div>
);

const SuccessTab = ({ isMobile }) => (isMobile ? <MobileSuccessTab /> : <DesktopSuccessTab />);

export default withMobileViewport(SuccessTab);
