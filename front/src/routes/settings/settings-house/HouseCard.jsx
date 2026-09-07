import { Text } from 'preact-i18n';
import cx from 'classnames';

import EditHouse from '../../../components/house/EditHouseComponent';
import style from './style.css';

const RoomsSummary = ({ rooms }) => {
  const count = (rooms || []).filter(room => room.to_delete !== true).length;
  if (count === 0) {
    return (
      <span class={style.metaItem}>
        <i class="fe fe-grid" />
        <Text id="housesSettings.summary.noRoom" />
      </span>
    );
  }
  return (
    <span class={cx(style.metaItem, style.metaItemSet)}>
      <i class="fe fe-grid" />
      <Text id={count > 1 ? 'housesSettings.summary.rooms' : 'housesSettings.summary.oneRoom'} fields={{ count }} />
    </span>
  );
};

// latitude 0 is a valid coordinate, so "is it set?" is a null check, not a
// truthiness check
const isSet = value => value !== null && value !== undefined && value !== '';

const LocationSummary = ({ house }) => {
  const located = isSet(house.latitude) && isSet(house.longitude);
  return (
    <span class={cx(style.metaItem, { [style.metaItemSet]: located })}>
      <i class="fe fe-map-pin" />
      <Text id={located ? 'housesSettings.summary.located' : 'housesSettings.summary.notLocated'} />
    </span>
  );
};

const AlarmSummary = ({ house }) => {
  const hasCode = Boolean(house.alarm_code);
  return (
    <span class={cx(style.metaItem, { [style.metaItemSet]: hasCode })}>
      <i class="fe fe-bell" />
      <Text id={hasCode ? 'housesSettings.summary.alarmSet' : 'housesSettings.summary.alarmNotSet'} />
    </span>
  );
};

const HouseCard = ({ children, ...props }) => {
  const { house, expanded, dirty } = props;
  const panelId = `house-panel-${house.id}`;
  const neverSaved = !house.created_at;

  return (
    <div class="card">
      <button
        type="button"
        class={cx(style.houseHeader, { [style.houseHeaderOpen]: expanded })}
        onClick={props.onToggle}
        aria-expanded={expanded ? 'true' : 'false'}
        aria-controls={panelId}
      >
        <span class={style.houseIcon}>
          <i class="fe fe-home" />
        </span>
        <span class={style.houseHeading}>
          <span class={style.houseName}>
            {house.name || (
              <span class={style.houseNamePlaceholder}>
                <Text id="housesSettings.defaultNewHouseName" />
              </span>
            )}
          </span>
          <span class={style.houseMeta}>
            <RoomsSummary rooms={house.rooms} />
            <LocationSummary house={house} />
            <AlarmSummary house={house} />
          </span>
        </span>
        {neverSaved && (
          <span class={cx('badge badge-info', style.headerBadge)}>
            <Text id="housesSettings.summary.neverSaved" />
          </span>
        )}
        {!neverSaved && dirty && (
          <span class={cx('badge badge-warning', style.headerBadge)}>
            <Text id="housesSettings.summary.unsavedChanges" />
          </span>
        )}
        <i class={cx('fe', expanded ? 'fe-chevron-up' : 'fe-chevron-down', style.chevron)} />
      </button>
      {expanded && (
        <div class="card-body" id={panelId}>
          <EditHouse {...props} />
        </div>
      )}
    </div>
  );
};

export default HouseCard;
