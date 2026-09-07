import { Text, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import style from '../style.css';

// The signup ends on Gladys itself — what the platform can do and how open
// it is — rather than on its author: three feature panels (integrations,
// scenes, open source), a closing line and the dashboard CTA.
const FEATURES = [
  { key: 'integrations', icon: 'fe-radio', tint: style.successFeatureBlue },
  { key: 'scenes', icon: 'fe-play', tint: style.successFeatureAmber },
  { key: 'openSource', icon: 'fe-github', tint: style.successFeatureGreen }
];

const SuccessTab = () => (
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

export default SuccessTab;
