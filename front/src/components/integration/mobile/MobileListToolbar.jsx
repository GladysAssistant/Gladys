import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { kitStyle } from '../../mobile';
import style from './style.css';

// the sort glyph of SortSelect (Feather has none): three lines getting shorter
const SortIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
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
 * @description A 44px control of the toolbar (refresh, scan again). `label` (a node) names it:
 * shown next to the icon, or read by a screen reader only with `iconOnly`.
 */
const ToolButton = ({ icon, label, iconOnly, spinning, ...props }) => (
  <button type="button" class={style.toolButton} {...props}>
    <i class={cx('fe', `fe-${icon}`, { [style.spinning]: spinning })} aria-hidden="true" />
    <span class={cx({ 'sr-only': iconOnly })}>{label}</span>
  </button>
);

/**
 * @description The toolbar above a list of devices on a phone
 * (docs/specs/mobile-pages/integration-devices.md, B): the search (16px, so iOS does not zoom
 * into it), the sort order as one button that flips it, then the actions of the list.
 *
 * onSearch / onOrderChange are the handlers of the desktop header (CardFilter): they get the
 * same event, so the phone list never has its own request.
 */
const MobileListToolbar = ({
  searchValue,
  onSearch,
  searchPlaceholderId = 'device.searchPlaceHolder',
  orderDir = 'asc',
  onOrderChange,
  children
}) => (
  <div class={style.toolbar}>
    {onSearch && (
      <label class={kitStyle.search}>
        <i class="fe fe-search" aria-hidden="true" />
        <Localizer>
          <input
            type="search"
            class={kitStyle.searchInput}
            value={searchValue}
            onInput={onSearch}
            placeholder={<Text id={searchPlaceholderId} />}
            aria-label={<Text id={searchPlaceholderId} />}
            autocomplete="off"
            autocapitalize="off"
            enterkeyhint="search"
            data-cy="integration-mobile-search"
          />
        </Localizer>
      </label>
    )}
    {onOrderChange && (
      <button
        type="button"
        class={style.toolButton}
        // the handler of the desktop <select>: it reads the new order from the event
        onClick={() => onOrderChange({ target: { value: orderDir === 'desc' ? 'asc' : 'desc' } })}
        data-cy="integration-mobile-sort"
      >
        <SortIcon />
        <span class="sr-only">
          <Text id="global.orderDirLabel" />
        </span>
        <span>
          <Text id={orderDir === 'desc' ? 'global.orderDirDesc' : 'global.orderDirAsc'} />
        </span>
      </button>
    )}
    {children}
  </div>
);

export { ToolButton };
export default MobileListToolbar;
