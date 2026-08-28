import cx from 'classnames';
import { Text, Localizer } from 'preact-i18n';

import style from './SortSelect.css';

/* Feather's set has no sort glyph, so here is one drawn in its language
   (24×24, 2px round strokes): three lines getting shorter, the icon every
   list sorter uses. It sits in the same .input-icon-addon as the search
   field's magnifier, so both controls carry their affordance the same way. */
const SortIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={style.sortIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <line x1="4" y1="6" x2="19" y2="6" />
    <line x1="4" y1="12" x2="13" y2="12" />
    <line x1="4" y1="18" x2="8" y2="18" />
  </svg>
);

/**
 * The sort control of the page headers (scenes, integration catalog, device
 * lists). A bare <select> next to a search field of the same pill family read
 * as an empty search box — no icon, and no caret either, Tabler's .custom-select
 * arrow being lost to a broken data URI (see SortSelect.css). It says what it
 * is here: sort icon on the left, caret on the right, and the quiet label ink
 * of the buttons it sits next to.
 */
const SortSelect = ({ value, onChange, options, class: className, selectClass }) => (
  <div class={cx('input-icon', style.sortSelect, className)}>
    <span class="input-icon-addon">
      <SortIcon />
    </span>
    <Localizer>
      <select
        onChange={onChange}
        value={value}
        aria-label={<Text id="global.orderDirLabel" />}
        class={cx('form-control', 'custom-select', 'w-auto', style.select, selectClass)}
      >
        {options.map(({ value: optionValue, labelId }) => (
          <option key={optionValue} value={optionValue}>
            <Text id={labelId} />
          </option>
        ))}
      </select>
    </Localizer>
  </div>
);

export default SortSelect;
