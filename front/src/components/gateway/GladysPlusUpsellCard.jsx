import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import get from 'get-value';

import { buildGladysPlusUrl } from '../../utils/gladysPlusUrl';
import style from './style.css';

/**
 * Reusable upsell card for promoting Gladys Plus on premium features.
 *
 * Two variants:
 *  - 'subscribe' (default): used when the user is not subscribed to Gladys Plus
 *    at all. Shows a "free trial" CTA pointing to the marketing/signup page
 *    with UTM tracking.
 *  - 'upgrade': used when the user is on the Lite plan and needs to upgrade to
 *    Plus. Shows a CTA pointing to the local billing settings page.
 *
 * @param {string} utmCampaign - utm_campaign value used to track which spot in
 *   the app drove the click. Required for 'subscribe' variant.
 */
const GladysPlusUpsellCard = ({
  user,
  titleKey,
  descriptionKey,
  featureKeys = [],
  variant = 'subscribe',
  icon = 'fe-zap',
  utmCampaign,
  compact = false
}) => {
  const language = get(user, 'language') || 'en';
  const isUpgrade = variant === 'upgrade';
  const signupUrl = buildGladysPlusUrl({ language, campaign: utmCampaign, content: 'upsell_cta' });
  const primaryHref = isUpgrade ? '/dashboard/settings/billing' : signupUrl;
  const primaryTextId = isUpgrade ? 'gladysPlusUpsell.upgradeButton' : 'gladysPlusUpsell.tryFreeButton';

  if (compact) {
    return (
      <div class={`alert alert-info ${style.upsellCompact}`}>
        <div class="d-flex align-items-start">
          <i class={`fe ${icon} mr-2 mt-1`} />
          <div class="flex-fill">
            <div class="font-weight-bold mb-1">
              <Text id={titleKey} />
            </div>
            <div class="small mb-2">
              <Text id={descriptionKey} />
            </div>
            {isUpgrade ? (
              <a href={primaryHref} class="small font-weight-bold">
                <Text id={primaryTextId} /> →
              </a>
            ) : (
              <a href={primaryHref} target="_blank" rel="noopener noreferrer" class="small font-weight-bold">
                <Text id={primaryTextId} /> <i class="fe fe-external-link" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class={`card ${style.upsellCard}`}>
      <div class="card-body">
        <div class="d-flex flex-column flex-md-row">
          <div class={`mb-3 mb-md-0 mr-md-4 ${style.upsellIconWrapper}`}>
            <span class={`badge badge-info ${style.upsellBadge}`}>
              <i class={`fe ${icon} mr-1`} />
              Gladys Plus
            </span>
          </div>
          <div class="flex-fill">
            <h3 class="mb-2">
              <Text id={titleKey} />
            </h3>
            <p class="mb-3">
              <Text id={descriptionKey} />
            </p>
            {featureKeys.length > 0 && (
              <ul class={`list-unstyled mb-3 ${style.upsellFeatureList}`}>
                {featureKeys.map(k => (
                  <li class="mb-1">
                    <i class="fe fe-check text-success mr-2" />
                    <Text id={k} />
                  </li>
                ))}
              </ul>
            )}
            {!isUpgrade && (
              <p class="text-muted small mb-3">
                <i class="fe fe-gift mr-1" />
                <Text id="gladysPlusUpsell.freeTrialNotice" />
              </p>
            )}
            <div class="d-flex flex-wrap">
              {isUpgrade ? (
                <a href={primaryHref} class="btn btn-success mb-2">
                  <Text id={primaryTextId} />
                </a>
              ) : (
                <a href={primaryHref} target="_blank" rel="noopener noreferrer" class="btn btn-success mb-2">
                  <Text id={primaryTextId} /> <i class="fe fe-external-link ml-1" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default connect('user', {})(GladysPlusUpsellCard);
