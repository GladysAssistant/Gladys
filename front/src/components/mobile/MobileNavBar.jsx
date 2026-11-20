import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import style from './kit.css';

/**
 * @description The navigation bar of a phone page (docs/specs/mobile-pages/README.md, C.1): the
 * way back on the left ("‹ Devices"), the title in the middle, one action on the right.
 *
 * backHref / onBack: where the back control leads (a link, or a handler when the page has a
 * leave guard). backLabel: the name of the page it goes back to (a node); "Back" when omitted.
 * action: the node on the right — a `MobileNavBar.TextButton` or `MobileNavBar.IconButton`.
 */
const MobileNavBar = ({ title, backHref, onBack, backLabel, action, dataCy }) => {
  const backContent = [
    <i class="fe fe-chevron-left" aria-hidden="true" />,
    <span class={style.navBackLabel}>{backLabel || <Text id="mobileKit.back" />}</span>
  ];
  return (
    <div class={style.navBar} data-cy={dataCy}>
      <div class={style.navSide}>
        {onBack && (
          <button type="button" class={style.navBack} onClick={onBack} data-cy="mobile-nav-back">
            {backContent}
          </button>
        )}
        {!onBack && backHref && (
          <Link href={backHref} class={style.navBack} data-cy="mobile-nav-back">
            {backContent}
          </Link>
        )}
      </div>
      <h1 class={style.navTitle}>{title}</h1>
      <div class={cx(style.navSide, style.navSideEnd)}>{action}</div>
    </div>
  );
};

const TextButton = ({ children, ...props }) => (
  <button type="button" class={style.navTextButton} {...props}>
    {children}
  </button>
);

// an icon button has no visible text: `label` (a string) names it
const IconButton = ({ icon, label, ...props }) => (
  <button type="button" class={style.navIconButton} aria-label={label} {...props}>
    <i class={`fe fe-${icon}`} aria-hidden="true" />
  </button>
);

MobileNavBar.TextButton = TextButton;
MobileNavBar.IconButton = IconButton;

export default MobileNavBar;
