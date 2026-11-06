import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../utils/consts';
import style from './style.css';

const Stat = ({ value, labelId, tone, icon }) => (
  <div class={cx(style.stat, tone)}>
    <span class={style.statIcon}>
      <i class={`fe fe-${icon}`} />
    </span>
    <span class={style.statValue}>{value}</span>
    <span class={style.statLabel}>
      <Text id={labelId} />
    </span>
  </div>
);

// The strip at the top of the Users page when Gladys Plus is configured: what
// remote access is, where everyone stands (authorized / waiting for the admin
// / invited), and the one explanation worth reading before flipping a switch.
const PlusOverview = ({ stats, gatewayMode, gatewayKeysStatus, plusUsersStatus }) => (
  <div class={cx('card', style.overview)}>
    <div class={style.overviewMain}>
      <span class={style.overviewIcon}>
        <i class="fe fe-globe" />
      </span>
      <div class={style.overviewText}>
        <h3 class={style.overviewTitle}>
          <Text id="usersSettings.plus.title" />
        </h3>
        <p class={style.overviewDescription}>
          <Text id="usersSettings.plus.description" />
        </p>
        <details class={style.why}>
          <summary>
            <i class="fe fe-help-circle" />
            <Text id="usersSettings.plus.whyTitle" />
          </summary>
          {/* MarkupText renders a div: no <p> around it */}
          <div class={style.whyParagraph}>
            <MarkupText id="usersSettings.plus.whyText" />
          </div>
          <div>
            <MarkupText id="usersSettings.plus.whyKeysChangedText" />
          </div>
        </details>
      </div>
      <div class={style.stats}>
        <Stat value={stats.authorized} labelId="usersSettings.plus.statAuthorized" icon="check" tone={style.statOk} />
        <Stat
          value={stats.actionNeeded}
          labelId="usersSettings.plus.statActionNeeded"
          icon="clock"
          tone={stats.actionNeeded > 0 ? style.statAttention : undefined}
        />
        {gatewayMode && (
          <Stat value={stats.invited} labelId="usersSettings.plus.statInvited" icon="mail" tone={style.statNeutral} />
        )}
      </div>
    </div>
    {(gatewayKeysStatus === RequestStatus.NetworkError || gatewayKeysStatus === RequestStatus.Error) && (
      <div class="alert alert-warning mb-0 mt-3" role="alert">
        <Text id="usersSettings.plus.notConnected" />
      </div>
    )}
    {plusUsersStatus === RequestStatus.Error && (
      <div class="alert alert-warning mb-0 mt-3" role="alert">
        <Text id="usersSettings.plus.loadError" />
      </div>
    )}
    {stats.actionNeeded > 0 && (
      <div class={cx('alert alert-warning mb-0 mt-3', style.attentionAlert)} role="status">
        <i class="fe fe-alert-circle" />
        <Text
          id={stats.actionNeeded === 1 ? 'usersSettings.plus.actionNeededOne' : 'usersSettings.plus.actionNeededMany'}
          fields={{ count: stats.actionNeeded }}
        />
      </div>
    )}
  </div>
);

export default PlusOverview;
