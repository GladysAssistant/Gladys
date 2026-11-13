import get from 'get-value';

import withIntlAsProp from '../../utils/withIntlAsProp';
import style from './DayPills.css';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
// 2024-01-01 was a Monday: the short names of the days come from the language of the user
const MONDAY = Date.UTC(2024, 0, 1);

const getShortNames = language => {
  try {
    const formatter = new Intl.DateTimeFormat(language || 'en', { weekday: 'short', timeZone: 'UTC' });
    return DAYS.map((day, index) => formatter.format(new Date(MONDAY + index * 24 * 60 * 60 * 1000)).replace('.', ''));
  } catch (e) {
    return null;
  }
};

/**
 * @description The days of the week as seven toggles, for a phone: a multi-select of seven
 * options is a menu to open seven times (docs/specs/scene-editor-mobile.md, E.11). The selection
 * is returned in the order of the week, as the select of the desktop form stores it.
 * @param {Object} props - The props.
 * @param {Array} props.value - The selected days ("monday"…).
 * @param {Function} props.onChange - Called with the new array of days.
 * @param {string} props.language - The language of the user, for the short names of the days.
 * @returns {Object} The seven toggles.
 * @example
 * <DayPills value={trigger.days_of_the_week} onChange={this.setDays} language="fr" />
 */
const DayPills = ({ value, onChange, intl, language }) => {
  const selected = Array.isArray(value) ? value : [];
  const shortNames = getShortNames(language);
  const toggle = day => () => {
    const next = selected.includes(day) ? selected.filter(item => item !== day) : selected.concat([day]);
    onChange(DAYS.filter(item => next.includes(item)));
  };
  return (
    <div class={style.days} role="group">
      {DAYS.map((day, index) => {
        const name = get(intl.dictionary, `editScene.triggersCard.scheduledTrigger.daysOfTheWeek.${day}`) || day;
        return (
          <button
            type="button"
            key={day}
            class={selected.includes(day) ? `${style.day} ${style.daySelected}` : style.day}
            aria-pressed={selected.includes(day) ? 'true' : 'false'}
            aria-label={name}
            onClick={toggle(day)}
            data-cy={`day-pill-${day}`}
          >
            {shortNames ? shortNames[index] : name.slice(0, 3)}
          </button>
        );
      })}
    </div>
  );
};

export default withIntlAsProp(DayPills);
