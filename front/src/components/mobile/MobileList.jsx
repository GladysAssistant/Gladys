import { Link } from 'preact-router/match';
import cx from 'classnames';

import style from './kit.css';

/**
 * @description The title above a group of rows, with an optional action on its right
 * ("Rooms" … "Add").
 */
const MobileSectionHeader = ({ title, action }) => (
  <div class={style.sectionHeader}>
    <h2 class={style.sectionTitle}>{title}</h2>
    {action}
  </div>
);

/**
 * @description One card holding rows separated by hairlines
 * (docs/specs/mobile-pages/README.md, C.2).
 */
const MobileGroup = ({ children, class: className, ...props }) => (
  <div class={cx(style.group, className)} {...props}>
    {children}
  </div>
);

/**
 * @description A row of a phone list (docs/specs/mobile-pages/README.md, C.2): an icon tile, a
 * title, up to two lines under it, what the row is set to (`value`) and what ends it — a
 * chevron when the row opens something, or `trailing` (a switch, a pill, a 44px button).
 *
 * The whole row is the target: a link with `href`, a button with `onClick`, a plain block
 * otherwise (a row holding its own control in `trailing` must not be a button itself).
 * `card`: the row is its own card (outside a MobileGroup). `tone`: 'danger' | 'accent' colors
 * the title; `iconTone`: 'neutral' | 'success' | 'warning' | 'danger' colors the tile.
 */
const MobileRow = ({
  icon,
  iconTone,
  tile,
  title,
  subtitle,
  meta,
  value,
  trailing,
  chevron,
  href,
  onClick,
  card,
  tone,
  disabled,
  dataCy,
  class: className,
  children,
  ...props
}) => {
  const content = [
    tile,
    !tile && icon && (
      <span class={cx(style.rowTile, { [style[`rowTile-${iconTone}`]]: iconTone })} aria-hidden="true">
        <i class={`fe fe-${icon}`} />
      </span>
    ),
    <span class={style.rowText}>
      <span class={style.rowTitle}>{title}</span>
      {subtitle && <span class={style.rowSub}>{subtitle}</span>}
      {meta && <span class={style.rowMeta}>{meta}</span>}
      {children}
    </span>,
    value !== undefined && value !== null && <span class={style.rowValue}>{value}</span>,
    trailing,
    (chevron === undefined ? Boolean(href || onClick) && !trailing : chevron) && (
      <i class={cx('fe', 'fe-chevron-right', style.rowChevron)} aria-hidden="true" />
    )
  ];
  const classes = cx(style.row, className, {
    [style.rowCard]: card,
    [style.rowDanger]: tone === 'danger',
    [style.rowAccent]: tone === 'accent'
  });
  if (href) {
    return (
      <Link href={href} class={classes} data-cy={dataCy} {...props}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" class={classes} onClick={onClick} disabled={disabled} data-cy={dataCy} {...props}>
        {content}
      </button>
    );
  }
  return (
    <div class={classes} data-cy={dataCy} {...props}>
      {content}
    </div>
  );
};

/**
 * @description A status pill ("Running", "Failed"). tone: 'success' | 'warning' | 'danger' |
 * 'accent', neutral when omitted.
 */
const MobilePill = ({ tone, children, class: className, ...props }) => (
  <span class={cx(style.pill, className, { [style[`pill-${tone}`]]: tone })} {...props}>
    {children}
  </span>
);

/**
 * @description A 44px round button ending a row (delete, more). `label` (a string) names it.
 */
const MobileRowButton = ({ icon, label, danger, ...props }) => (
  <button
    type="button"
    class={cx(style.rowIconButton, { [style.rowIconButtonDanger]: danger })}
    aria-label={label}
    {...props}
  >
    <i class={`fe fe-${icon}`} aria-hidden="true" />
  </button>
);

/**
 * @description A notice of a phone page. tone: 'warning' | 'danger' | 'success', informative
 * when omitted.
 */
const MobileNotice = ({ tone, icon, children, class: className, ...props }) => (
  <div class={cx(style.notice, className, { [style[`notice-${tone}`]]: tone })} {...props}>
    {icon && <i class={`fe fe-${icon}`} aria-hidden="true" />}
    <div class={style.noticeBody}>{children}</div>
  </div>
);

/**
 * @description What a list shows when it has nothing to list.
 */
const MobileEmptyState = ({ icon, title, text, children }) => (
  <div class={style.empty}>
    {icon && (
      <span class={style.emptyIcon} aria-hidden="true">
        <i class={`fe fe-${icon}`} />
      </span>
    )}
    {title && <h2 class={style.emptyTitle}>{title}</h2>}
    {text && <p class={style.emptyText}>{text}</p>}
    {children}
  </div>
);

export { MobileSectionHeader, MobileGroup, MobileRow, MobilePill, MobileRowButton, MobileNotice, MobileEmptyState };
