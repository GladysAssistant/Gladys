import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { notNullNotUndefined, roundWith2DecimalIfNeeded } from './chartUtils';

const VariationIcon = ({ children }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={cx(style.variationIcon)}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke-width="2"
    stroke="currentColor"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    {children}
  </svg>
);

/**
 * @description The headline of a chart: the last value of the period and its variation since the
 * start of the period. Shared by the card and by its enlarged view.
 */
const ChartHeaderValues = ({ lastValueRounded, unit, variation, variationDownIsPositive }) => (
  <div class="d-flex align-items-baseline">
    {notNullNotUndefined(lastValueRounded) && !Number.isNaN(lastValueRounded) && (
      <div class="h1 mb-0 mr-2">
        {lastValueRounded} {unit !== undefined && <Text id={`deviceFeatureUnitShort.${unit}`} />}
      </div>
    )}
    <div
      class={cx(style.meAuto, {
        [style.textGreen]: (variation > 0 && !variationDownIsPositive) || (variation < 0 && variationDownIsPositive),
        [style.textYellow]: variation === 0,
        [style.textRed]: (variation > 0 && variationDownIsPositive) || (variation < 0 && !variationDownIsPositive)
      })}
    >
      {variation !== undefined && (
        <span class="d-inline-flex align-items-center lh-1">
          {roundWith2DecimalIfNeeded(variation)}
          <Text id="global.percent" />
          {variation > 0 && (
            <VariationIcon>
              <polyline points="3 17 9 11 13 15 21 7" />
              <polyline points="14 7 21 7 21 14" />
            </VariationIcon>
          )}
          {variation === 0 && (
            <VariationIcon>
              <line x1="5" y1="12" x2="19" y2="12" />
            </VariationIcon>
          )}
          {variation < 0 && (
            <VariationIcon>
              <polyline points="3 7 9 13 13 9 21 17" />
              <polyline points="21 10 21 17 14 17" />
            </VariationIcon>
          )}
        </span>
      )}
    </div>
  </div>
);

export default ChartHeaderValues;
