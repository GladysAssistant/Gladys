import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import withIntlAsProp from '../../utils/withIntlAsProp';
import { kitStyle } from '../mobile';
import style from './mobileHouse.css';

// The rooms most houses have, in the order they are offered. Their names come from the
// dictionary of the user (housesSettings.mobile.roomSuggestions).
const ROOM_SUGGESTION_KEYS = [
  'livingRoom',
  'kitchen',
  'bedroom',
  'bathroom',
  'entrance',
  'office',
  'diningRoom',
  'kidsRoom',
  'toilet',
  'garage',
  'laundryRoom',
  'garden'
];

const sameName = (a, b) =>
  String(a || '')
    .trim()
    .toLowerCase() ===
  String(b || '')
    .trim()
    .toLowerCase();

/**
 * @description Rooms to add in one tap (docs/specs/mobile-pages/house-and-rooms.md, C.3): the
 * common rooms as toggles, plus the rooms the user added by name (`extraNames`).
 *
 * selectedNames: the rooms the house holds. excludedNames: suggestions not to offer (the rooms
 * the house already had, which this list must not remove). onToggle(name, selected): the chip
 * of `name` was tapped while `selected`.
 */
const RoomSuggestions = ({ selectedNames = [], excludedNames = [], extraNames = [], onToggle, intl }) => {
  const suggestions = ROOM_SUGGESTION_KEYS.map(key =>
    get(intl.dictionary, `housesSettings.mobile.roomSuggestions.${key}`)
  ).filter(name => name && !excludedNames.some(excluded => sameName(excluded, name)));
  const names = [...suggestions, ...extraNames.filter(extra => !suggestions.some(name => sameName(name, extra)))];
  if (names.length === 0) {
    return null;
  }
  return (
    <div class={style.roomChips} role="group" data-cy="room-suggestions">
      <span class={style.roomChipsLabel}>
        <Text id="housesSettings.mobile.roomSuggestionsLabel" />
      </span>
      {names.map(name => {
        const selected = selectedNames.some(selectedName => sameName(selectedName, name));
        return (
          <button
            key={name}
            type="button"
            class={cx(kitStyle.chip, style.roomChip, { [kitStyle.chipSelected]: selected })}
            aria-pressed={selected ? 'true' : 'false'}
            onClick={() => onToggle(name, selected)}
            data-cy="room-suggestion"
          >
            <i class={cx('fe', selected ? 'fe-check' : 'fe-plus')} aria-hidden="true" />
            {name}
          </button>
        );
      })}
    </div>
  );
};

export { sameName };
export default withIntlAsProp(RoomSuggestions);
