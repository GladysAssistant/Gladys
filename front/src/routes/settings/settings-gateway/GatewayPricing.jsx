import { Text } from 'preact-i18n';
import get from 'get-value';

import { buildGladysPlusUrl } from '../../../utils/gladysPlusUrl';
import style from './style.css';

const UTM_CAMPAIGN = 'settings_gateway_pricing';

const FEATURES = [
  { key: 'remoteAccess', icon: 'fe-globe' },
  { key: 'backups', icon: 'fe-database' },
  { key: 'voiceAssistants', icon: 'fe-mic' },
  { key: 'ai', icon: 'fe-cpu' },
  { key: 'cameraStreaming', icon: 'fe-video' },
  { key: 'enedis', icon: 'fe-zap' },
  { key: 'mcp', icon: 'fe-link' },
  { key: 'openApi', icon: 'fe-code' }
];

const LITE_FEATURES = ['remoteAccess', 'voiceAssistants', 'openApi', 'familyAccounts'];
const PLUS_FEATURES = ['everythingInLite', 'backups', 'cameraStreaming', 'ai', 'enedis', 'mcp'];

const GatewayPricing = ({ children, ...props }) => {
  const language = get(props, 'user.language') || 'en';
  const heroCtaUrl = buildGladysPlusUrl({ language, campaign: UTM_CAMPAIGN, content: 'hero_cta' });
  const liteCtaUrl = buildGladysPlusUrl({ language, campaign: UTM_CAMPAIGN, content: 'plan_lite' });
  const plusCtaUrl = buildGladysPlusUrl({ language, campaign: UTM_CAMPAIGN, content: 'plan_plus' });
  const finalCtaUrl = buildGladysPlusUrl({ language, campaign: UTM_CAMPAIGN, content: 'final_cta' });

  return (
    <div class={`mt-2 ${style.pricingPage}`}>
      {/* HERO */}
      <div class={`card ${style.pricingHero}`}>
        <div class="card-body text-center py-6">
          <span class="badge badge-info mb-3">
            <i class="fe fe-star mr-1" />
            Gladys Plus
          </span>
          <h1 class="mb-3">
            <Text id="gatewayPricing.heroTitle" />
          </h1>
          <p class={`mb-4 ${style.pricingLead}`}>
            <Text id="gatewayPricing.heroSubtitle" />
          </p>
          <div class="d-flex flex-wrap justify-content-center">
            <a class="btn btn-success btn-lg mr-2 mb-2" href={heroCtaUrl} target="_blank" rel="noopener noreferrer">
              <Text id="gatewayPricing.startFreeTrialButton" /> <i class="fe fe-external-link ml-1" />
            </a>
            <button class="btn btn-outline-primary btn-lg mb-2" onClick={props.displayGatewayLoginForm}>
              <Text id="gatewayPricing.alreadySubscriberButton" />
            </button>
          </div>
          <p class="text-muted small mt-3 mb-0">
            <i class="fe fe-check mr-1" />
            <Text id="gatewayPricing.heroReassurance" />
          </p>
        </div>
      </div>

      {/* FEATURES */}
      <div class="row mt-5">
        <div class="col-md-12 text-center mb-3">
          <h2 class="mb-1">
            <Text id="gatewayPricing.featuresTitle" />
          </h2>
          <p class="text-muted">
            <Text id="gatewayPricing.featuresSubtitle" />
          </p>
        </div>
      </div>
      <div class="row">
        {FEATURES.map(feature => (
          <div class="col-md-6 col-lg-3 mb-4">
            <div class={`card h-100 ${style.featureCard}`}>
              <div class="card-body text-center">
                <div class={`mb-3 ${style.featureIcon}`}>
                  <i class={`fe ${feature.icon}`} />
                </div>
                <h4 class="mb-2">
                  <Text id={`gatewayPricing.features.${feature.key}.title`} />
                </h4>
                <p class="text-muted small mb-0">
                  <Text id={`gatewayPricing.features.${feature.key}.description`} />
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TWO PLANS */}
      <div class="row mt-4">
        <div class="col-md-12 text-center mb-3">
          <h2 class="mb-1">
            <Text id="gatewayPricing.plansTitle" />
          </h2>
          <p class="text-muted">
            <Text id="gatewayPricing.plansSubtitle" />
          </p>
        </div>
      </div>
      <div class="row justify-content-center mb-4">
        <div class="col-md-6 col-lg-5 mb-4">
          <div class={`card h-100 ${style.planCard}`}>
            <div class="card-body">
              <h3 class="mb-1">
                <Text id="gatewayPricing.litePlan.name" />
              </h3>
              <p class="text-muted">
                <Text id="gatewayPricing.litePlan.tagline" />
              </p>
              <div class={`mb-3 ${style.planPrice}`}>
                <span class={style.planPriceAmount}>
                  <Text id="gatewayPricing.litePlan.price" />
                </span>
                <span class="text-muted ml-1">
                  <Text id="gatewayPricing.perMonth" />
                </span>
              </div>
              <p class="text-muted small">
                <Text id="gatewayPricing.litePlan.priceDetail" />
              </p>
              <ul class={`list-unstyled mb-4 ${style.planFeatureList}`}>
                {LITE_FEATURES.map(k => (
                  <li class="mb-2">
                    <i class="fe fe-check text-success mr-2" />
                    <Text id={`gatewayPricing.litePlan.features.${k}`} />
                  </li>
                ))}
              </ul>
              <a href={liteCtaUrl} target="_blank" rel="noopener noreferrer" class="btn btn-outline-success btn-block">
                <Text id="gatewayPricing.startFreeTrialButton" />
              </a>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-5 mb-4 pt-3">
          <div class={`card h-100 ${style.planCard} ${style.planCardHighlight}`}>
            <div class="card-body pt-4">
              <div class={style.planBadgeContainer}>
                <span class={style.planBadge}>
                  <Text id="gatewayPricing.plusPlan.popularBadge" />
                </span>
              </div>
              <h3 class="mb-1">
                <Text id="gatewayPricing.plusPlan.name" />
              </h3>
              <p class="text-muted">
                <Text id="gatewayPricing.plusPlan.tagline" />
              </p>
              <div class={`mb-3 ${style.planPrice}`}>
                <span class={style.planPriceAmount}>
                  <Text id="gatewayPricing.plusPlan.price" />
                </span>
                <span class="text-muted ml-1">
                  <Text id="gatewayPricing.perMonth" />
                </span>
              </div>
              <p class="text-muted small">
                <Text id="gatewayPricing.plusPlan.priceDetail" />
              </p>
              <ul class={`list-unstyled mb-4 ${style.planFeatureList}`}>
                {PLUS_FEATURES.map(k => (
                  <li class="mb-2">
                    <i class="fe fe-check text-success mr-2" />
                    <Text id={`gatewayPricing.plusPlan.features.${k}`} />
                  </li>
                ))}
              </ul>
              <a href={plusCtaUrl} target="_blank" rel="noopener noreferrer" class="btn btn-success btn-block">
                <Text id="gatewayPricing.startFreeTrialButton" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-12">
          <p class="text-center text-muted">
            <i class="fe fe-check text-success mr-1" />
            <Text id="gatewayPricing.reassuranceBar" />
          </p>
        </div>
      </div>

      {/* PRIVACY / E2E */}
      <div class="row mt-4">
        <div class="col-md-12 text-center mb-3">
          <h2 class="mb-1">
            <Text id="gatewayPricing.privacyTitle" />
          </h2>
          <p class="text-muted">
            <Text id="gatewayPricing.privacySubtitle" />
          </p>
        </div>
      </div>
      <div class="row mb-4">
        <div class="col-md-4 mb-3">
          <div class="card h-100">
            <div class="card-body">
              <h4>
                <i class="fe fe-cpu mr-2 text-primary" />
                <Text id="gatewayPricing.privacy.aiTitle" />
              </h4>
              <p class="text-muted small mb-0">
                <Text id="gatewayPricing.privacy.aiDescription" />
              </p>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="card h-100">
            <div class="card-body">
              <h4>
                <i class="fe fe-server mr-2 text-primary" />
                <Text id="gatewayPricing.privacy.infraTitle" />
              </h4>
              <p class="text-muted small mb-0">
                <Text id="gatewayPricing.privacy.infraDescription" />
              </p>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="card h-100">
            <div class="card-body">
              <h4>
                <i class="fe fe-lock mr-2 text-primary" />
                <Text id="gatewayPricing.privacy.e2eTitle" />
              </h4>
              <p class="text-muted small mb-0">
                <Text id="gatewayPricing.privacy.e2eDescription" />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WHY PAID */}
      <div class="row mt-3">
        <div class="col-md-12">
          <div class="card">
            <div class="card-body">
              <h4>
                <i class="fe fe-heart mr-2 text-danger" />
                <Text id="gatewayPricing.whyIsGladysPlusPaid" />
              </h4>
              <p class="mb-2">
                <Text id="gatewayPricing.whyIsGladysPlusPaidAnswer" />
              </p>
              <p class="mb-0">
                <Text id="gatewayPricing.supportOpenSource" />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div class="row mt-4 mb-3">
        <div class="col-md-12 text-center">
          <a class="btn btn-success btn-lg mr-2 mb-2" href={finalCtaUrl} target="_blank" rel="noopener noreferrer">
            <Text id="gatewayPricing.startFreeTrialButton" /> <i class="fe fe-external-link ml-1" />
          </a>
          <button class="btn btn-link btn-lg mb-2" onClick={props.displayGatewayLoginForm}>
            <Text id="gatewayPricing.alreadyGladysPlusSubscriber" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GatewayPricing;
