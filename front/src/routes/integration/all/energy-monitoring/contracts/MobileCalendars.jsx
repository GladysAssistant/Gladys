import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import BottomSheet from '../../../../../components/sheet/BottomSheet';
import {
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobilePill,
  MobileNotice,
  MobileField,
  fieldClass,
  BigButton,
  kitStyle
} from '../../../../../components/mobile';
import style from '../mobile.css';

/**
 * @description The tariff calendars on a phone (docs/specs/mobile-pages/energy.md, E): one row
 * per calendar — its key, its provider, its granularity and its coverage — opening its last
 * values in a sheet, then the recalculation of the costs from a date. A presentation only: the
 * state and the requests are the ones of Calendars.jsx.
 */
const MobileCalendars = ({
  calendars,
  loading,
  error,
  expanded,
  entries,
  recalculateFrom,
  recalculating,
  recalculated,
  toggle,
  setRecalculateFrom,
  recalculate,
  formatDate,
  intl
}) => {
  const expandedCalendar = calendars.find(calendar => calendar.key === expanded);
  return (
    <div data-cy="energy-calendars-mobile">
      <MobileSectionHeader title={<Text id="integration.energyMonitoring.contracts.calendars.title" />} />
      {error && (
        <MobileNotice tone="danger" icon="alert-circle">
          {error}
        </MobileNotice>
      )}
      {calendars.length === 0 && !loading && (
        <p class={kitStyle.footnote}>
          <Text id="integration.energyMonitoring.contracts.calendars.empty" />
        </p>
      )}
      {calendars.length > 0 && (
        <MobileGroup>
          {calendars.map(calendar => (
            <MobileRow
              key={calendar.key}
              icon="calendar"
              iconTone={calendar.provider_service ? undefined : 'warning'}
              title={<span class={style.code}>{calendar.key}</span>}
              subtitle={
                <span>
                  {calendar.provider_service
                    ? calendar.provider_service.display_name || calendar.provider_service.name
                    : null}
                  {calendar.provider_service && ' · '}
                  <Text id={`integration.energyMonitoring.contracts.calendars.granularities.${calendar.granularity}`}>
                    {calendar.granularity}
                  </Text>
                </span>
              }
              meta={
                // a calendar that never received a value has no coverage to show
                calendar.first_at || calendar.last_at ? (
                  <span>
                    {formatDate(calendar.first_at, calendar.granularity)} →{' '}
                    {formatDate(calendar.last_at, calendar.granularity)}
                  </span>
                ) : (
                  <Text id="integration.energyMonitoring.contracts.calendars.noValue" />
                )
              }
              onClick={() => toggle(calendar.key)}
              dataCy="energy-calendar-row"
            >
              {!calendar.provider_service && (
                <span class={style.pillLine}>
                  <MobilePill tone="warning">
                    <Text id="integration.energyMonitoring.contracts.calendars.orphaned" />
                  </MobilePill>
                </span>
              )}
            </MobileRow>
          ))}
        </MobileGroup>
      )}
      <p class={kitStyle.footnote}>
        <Text id="integration.energyMonitoring.contracts.calendars.description" />
      </p>

      <MobileSectionHeader title={<Text id="integration.energyMonitoring.mobile.recalculateTitle" />} />
      {recalculated && (
        <MobileNotice tone="success" icon="check-circle" data-cy="energy-recalculated">
          <Text id="integration.energyMonitoring.contracts.calendars.recalculated" />
        </MobileNotice>
      )}
      <MobileField
        label={<Text id="integration.energyMonitoring.contracts.calendars.recalculateFrom" />}
        htmlFor="energyRecalculateFrom"
      >
        <input
          id="energyRecalculateFrom"
          type="date"
          class={fieldClass.input}
          value={recalculateFrom}
          onInput={e => setRecalculateFrom(e.target.value)}
          data-cy="energy-recalculate-from"
        />
      </MobileField>
      <BigButton
        icon="refresh-cw"
        disabled={!recalculateFrom}
        loading={recalculating}
        onClick={recalculate}
        data-cy="energy-recalculate"
      >
        <Text id="integration.energyMonitoring.contracts.calendars.recalculate" />
      </BigButton>

      <BottomSheet
        open={Boolean(expanded)}
        title={expanded || ''}
        onClose={() => expanded && toggle(expanded)}
        dataCy="energy-calendar-sheet"
      >
        <p class={kitStyle.sheetText}>
          {get(intl.dictionary, 'integration.energyMonitoring.contracts.calendars.lastValues')}
        </p>
        <div class={cx('dimmer', { active: loading })}>
          <div class="loader" />
          <div class={cx('dimmer-content', { [style.loading]: loading })}>
            {!loading && entries.length === 0 && (
              <p class={kitStyle.sheetText} data-cy="energy-calendar-no-value">
                <Text id="integration.energyMonitoring.contracts.calendars.noValue" />
              </p>
            )}
            {entries.length > 0 && (
              <MobileGroup>
                {entries.map(entry => (
                  <div class={style.valueRow} key={entry.starts_at}>
                    <span class={style.valueRowDate}>
                      {formatDate(entry.starts_at, expandedCalendar && expandedCalendar.granularity)}
                    </span>
                    <span class={style.valueRowValue}>{String(entry.value)}</span>
                  </div>
                ))}
              </MobileGroup>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default MobileCalendars;
