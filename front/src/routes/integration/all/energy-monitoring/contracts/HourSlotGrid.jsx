import { Text } from 'preact-i18n';
import cx from 'classnames';
import { SLOTS_PER_DAY, slotToLabel, intervalsToSlots, slotsToIntervals } from './contractUtils';

// The 48-button grid of the previous "Energy Rates" tab, kept for the `time_intervals`
// inputs of the templates (off-peak hours): the value is a list of ["HH:MM", "HH:MM"].
const HourSlotGrid = ({ value, onChange }) => {
  const slots = intervalsToSlots(value);
  const toggle = slot => {
    const next = new Set(slots);
    if (next.has(slot)) {
      next.delete(slot);
    } else {
      next.add(slot);
    }
    onChange(slotsToIntervals(next));
  };
  const intervals = slotsToIntervals(slots);
  return (
    <div>
      <div class="row">
        {Array.from({ length: SLOTS_PER_DAY }, (_, slot) => (
          <div class="col-3 col-sm-2 mb-2" key={slot}>
            <button
              type="button"
              class={cx('btn btn-sm btn-block text-center py-2 text-nowrap', {
                'btn-primary': slots.has(slot),
                'btn-outline-secondary': !slots.has(slot)
              })}
              onClick={() => toggle(slot)}
            >
              {slotToLabel(slot)}
            </button>
          </div>
        ))}
      </div>
      <div class="d-flex align-items-center">
        <button type="button" class="btn btn-sm btn-outline-secondary mr-2" onClick={() => onChange([])}>
          <Text id="integration.energyMonitoring.clear" />
        </button>
        <small class="text-muted">
          <Text id="integration.energyMonitoring.selected" />{' '}
          {intervals.length === 0 ? (
            <Text id="integration.energyMonitoring.none" />
          ) : (
            intervals.map(([start, end]) => `${start} → ${end}`).join(', ')
          )}
        </small>
      </div>
    </div>
  );
};

export default HourSlotGrid;
