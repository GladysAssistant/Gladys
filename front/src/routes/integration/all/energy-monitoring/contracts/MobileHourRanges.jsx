import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import BottomSheet from '../../../../../components/sheet/BottomSheet';
import {
  MobileGroup,
  MobileRowButton,
  MobileField,
  fieldClass,
  BigButton,
  kitStyle
} from '../../../../../components/mobile';
import { SLOTS_PER_DAY, slotToLabel, labelToMinutes, intervalsToSlots, slotsToIntervals } from './contractUtils';
import style from '../mobile.css';

const DEFAULT_RANGE = ['22:00', '06:00'];
// the starts of a range: every half hour of the day; its ends, up to midnight ("24:00")
const START_OPTIONS = Array.from({ length: SLOTS_PER_DAY }, (unused, slot) => slotToLabel(slot));
const END_OPTIONS = [...START_OPTIONS.slice(1), '24:00'];

// "00:00" → "24:00" is the whole day (what the desktop grid stores when every slot is on), not an
// empty range: the two ends are compared as they are
const sameTime = (start, end) => labelToMinutes(start) === labelToMinutes(end);
const endsNextDay = (start, end) => labelToMinutes(end) <= labelToMinutes(start);

/**
 * @description The time ranges of a `time_intervals` input (off-peak hours) on a phone
 * (docs/specs/mobile-pages/energy.md, D.4): the day as a bar, one row per range, and a sheet to
 * add or change a range with two lists. The value is the one of the 48-button grid of the desktop
 * wizard (HourSlotGrid.jsx) — a list of ["HH:MM", "HH:MM"], normalized through the same
 * half-hour slots, so ranges that touch or overlap merge exactly as they do there.
 */
class MobileHourRanges extends Component {
  state = {
    sheetOpen: false,
    // the index of the range being changed, null when adding one
    editedIndex: null,
    start: DEFAULT_RANGE[0],
    end: DEFAULT_RANGE[1]
  };

  getIntervals = () => slotsToIntervals(intervalsToSlots(this.props.value));

  openAdd = () => this.setState({ sheetOpen: true, editedIndex: null, start: DEFAULT_RANGE[0], end: DEFAULT_RANGE[1] });

  openEdit = index => () => {
    const [start, end] = this.getIntervals()[index];
    this.setState({ sheetOpen: true, editedIndex: index, start, end });
  };

  closeSheet = () => this.setState({ sheetOpen: false });

  setStart = e => this.setState({ start: e.target.value });
  setEnd = e => this.setState({ end: e.target.value });

  // the ranges without the one being changed, plus the one of the sheet: merged by the slots
  validate = () => {
    const { editedIndex, start, end } = this.state;
    const others = this.getIntervals().filter((unused, index) => index !== editedIndex);
    this.props.onChange(slotsToIntervals(intervalsToSlots([...others, [start, end]])));
    this.closeSheet();
  };

  remove = index => () => {
    this.props.onChange(this.getIntervals().filter((unused, position) => position !== index));
  };

  render({ value, intl }, { sheetOpen, editedIndex, start, end }) {
    const slots = intervalsToSlots(value);
    const intervals = slotsToIntervals(slots);
    const invalid = sameTime(start, end);
    return (
      <div data-cy="hour-ranges">
        <div class={style.dayBar} aria-hidden="true">
          {Array.from({ length: SLOTS_PER_DAY }, (unused, slot) => (
            <span key={slot} class={cx(style.daySlot, { [style.daySlotOn]: slots.has(slot) })} />
          ))}
        </div>
        <div class={style.dayTicks} aria-hidden="true">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
        {intervals.length === 0 && (
          <p class={kitStyle.footnote} data-cy="hour-ranges-empty">
            <Text id="integration.energyMonitoring.mobile.noRange" />
          </p>
        )}
        {intervals.length > 0 && (
          <MobileGroup>
            {intervals.map(([rangeStart, rangeEnd], index) => (
              <div class={style.rangeRow} key={`${rangeStart}-${rangeEnd}`} data-cy="hour-range-row">
                <button type="button" class={style.rangeMain} onClick={this.openEdit(index)}>
                  <i class="fe fe-clock" aria-hidden="true" />
                  <span>
                    {rangeStart} → {rangeEnd}
                    {endsNextDay(rangeStart, rangeEnd) && (
                      <span class={style.rangeHint}>
                        {' · '}
                        <Text id="integration.energyMonitoring.mobile.rangeNextDay" />
                      </span>
                    )}
                  </span>
                </button>
                <MobileRowButton
                  icon="x"
                  label={`${get(
                    intl.dictionary,
                    'integration.energyMonitoring.mobile.rangeRemove'
                  )} ${rangeStart} → ${rangeEnd}`}
                  onClick={this.remove(index)}
                  data-cy="hour-range-remove"
                />
              </div>
            ))}
          </MobileGroup>
        )}
        <button
          type="button"
          class={cx(kitStyle.dashedButton, style.addButton)}
          onClick={this.openAdd}
          data-cy="hour-range-add"
        >
          <i class="fe fe-plus" aria-hidden="true" />
          <Text id="integration.energyMonitoring.mobile.addRange" />
        </button>

        <BottomSheet
          open={sheetOpen}
          title={get(intl.dictionary, 'integration.energyMonitoring.mobile.rangeSheetTitle')}
          onClose={this.closeSheet}
          dataCy="hour-range-sheet"
        >
          <div class={style.rangeFields}>
            <MobileField label={<Text id="integration.energyMonitoring.mobile.rangeStart" />} htmlFor="hourRangeStart">
              <select
                id="hourRangeStart"
                class={fieldClass.select}
                value={start}
                onChange={this.setStart}
                data-cy="hour-range-start"
              >
                {START_OPTIONS.map(option => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
              </select>
            </MobileField>
            <MobileField label={<Text id="integration.energyMonitoring.mobile.rangeEnd" />} htmlFor="hourRangeEnd">
              <select
                id="hourRangeEnd"
                class={fieldClass.select}
                value={end}
                onChange={this.setEnd}
                data-cy="hour-range-end"
              >
                {END_OPTIONS.map(option => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
              </select>
            </MobileField>
          </div>
          <p class={kitStyle.footnote}>
            {invalid && <Text id="integration.energyMonitoring.mobile.rangeInvalid" />}
            {!invalid && endsNextDay(start, end) && <Text id="integration.energyMonitoring.mobile.rangeNextDayHelp" />}
            {!invalid && !endsNextDay(start, end) && <Text id="integration.energyMonitoring.mobile.rangeHelp" />}
          </p>
          <div class={`${kitStyle.buttons} mt-3`}>
            <BigButton variant="primary" onClick={this.validate} disabled={invalid} data-cy="hour-range-validate">
              <Text
                id={
                  editedIndex === null
                    ? 'integration.energyMonitoring.mobile.rangeAdd'
                    : 'integration.energyMonitoring.mobile.rangeUpdate'
                }
              />
            </BigButton>
          </div>
        </BottomSheet>
      </div>
    );
  }
}

export default MobileHourRanges;
