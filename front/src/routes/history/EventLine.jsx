import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import dayjs from 'dayjs';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../utils/consts';
import { getGroupOfCategory } from './categoryGroups';
import style from './style.css';

const BINARY_TYPES = [DEVICE_FEATURE_TYPES.SENSOR.BINARY, DEVICE_FEATURE_TYPES.SENSOR.PUSH];

const roundValue = value => {
  if (value === null || value === undefined) {
    return value;
  }
  return Math.round(value * 100) / 100;
};

const EventValue = ({ event, intl }) => {
  const { category, type, unit } = event.device_feature;
  const value = event.value;
  const dictionary = get(intl, 'dictionary', { default: {} });

  // Button clicks have their own translations ("Simple click", "Double click"...)
  if (category === DEVICE_FEATURE_CATEGORIES.BUTTON && type === DEVICE_FEATURE_TYPES.BUTTON.CLICK) {
    const buttonText = get(dictionary, `deviceFeatureValue.category.button.click.${value}`);
    if (buttonText) {
      return <Text id={`deviceFeatureValue.category.button.click.${value}`} />;
    }
    return <Text id="deviceFeatureValue.category.button.click.unknown" fields={{ value }} />;
  }

  if (BINARY_TYPES.includes(type)) {
    const binaryValue = value ? 1 : 0;
    // History-specific wording first ("Motion detected"...)
    const historyText = get(dictionary, `history.values.${category}.${binaryValue}`);
    if (historyText) {
      return <Text id={`history.values.${category}.${binaryValue}`} />;
    }
    // Then the generic per-category wording ("Opened"/"Closed"...)
    const categoryText = get(dictionary, `deviceFeatureValue.category.${category}.binary`);
    if (categoryText) {
      return <Text id={`deviceFeatureValue.category.${category}.binary`} plural={binaryValue} />;
    }
    return <Text id="deviceFeatureValue.type.binary" plural={binaryValue} />;
  }

  return (
    <span>
      {roundValue(value)}
      {unit && (
        <span>
          {' '}
          <Text id={`deviceFeatureUnitShort.${unit}`} />
        </span>
      )}
    </span>
  );
};

const EventLine = ({ eventGroup, intl, toggleExpand, expanded }) => {
  const event = eventGroup.events[0];
  const { category, type } = event.device_feature;
  const group = getGroupOfCategory(category);
  const icon = get(DeviceFeatureCategoriesIcon, `${category}.${type}`) || group.icon;
  const count = eventGroup.events.length;

  return (
    <div class={style.eventLine}>
      <div class={cx(style.eventIcon, style[`eventIcon-${group.colorClass}`])}>
        <i class={`fe fe-${icon}`} />
      </div>
      <div class={style.eventBody}>
        <div class={style.eventText}>
          <span class={style.eventDeviceName}>{event.device.name}</span>
          <span class={cx(style.eventValue, style[`eventValue-${group.colorClass}`])}>
            <EventValue event={event} intl={intl} />
          </span>
          {count > 1 && (
            <button type="button" class={cx('btn', style.eventCountBadge)} onClick={toggleExpand}>
              ×{count}
              <i class={`fe fe-chevron-${expanded ? 'up' : 'down'} ml-1`} />
            </button>
          )}
        </div>
        <div class={style.eventMeta}>
          {event.room && (
            <span class={style.eventRoom}>
              <i class="fe fe-map-pin mr-1" />
              {event.room.name}
            </span>
          )}
        </div>
        {expanded && count > 1 && (
          <div class={style.eventOccurrences}>
            {eventGroup.events.map(oneEvent => (
              <div class={style.eventOccurrence}>
                <span class={style.eventOccurrenceTime}>{dayjs(oneEvent.created_at).format('HH:mm:ss')}</span>
                <span>
                  <EventValue event={oneEvent} intl={intl} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div class={style.eventTime} title={dayjs(event.created_at).format('DD/MM/YYYY HH:mm:ss')}>
        {dayjs(event.created_at).format('HH:mm')}
      </div>
    </div>
  );
};

export default EventLine;
