import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import style from './kit.css';

/**
 * @description The bar fixed at the bottom of a phone page, above the safe area
 * (docs/specs/mobile-pages/README.md, C.4): where the primary action of the page lives. The
 * page content needs the `contentWithBottomBar` class of the kit to stay clear of it.
 *
 * error / onCloseError: an error shown above the buttons, visible wherever the user is in the
 * page, with a close button.
 */
const MobileBottomBar = ({ children, error, onCloseError, dataCy }) => (
  <div class={style.bottomBar} data-cy={dataCy}>
    {error && (
      <div class={style.errorBanner} role="alert" data-cy="mobile-bottom-bar-error">
        <div class={style.errorBannerText}>{error}</div>
        {onCloseError && (
          <Localizer>
            <button
              type="button"
              class={style.errorBannerClose}
              onClick={onCloseError}
              aria-label={<Text id="mobileKit.close" />}
            >
              <i class="fe fe-x" aria-hidden="true" />
            </button>
          </Localizer>
        )}
      </div>
    )}
    <div class={style.bottomBarRow}>{children}</div>
  </div>
);

/**
 * @description "● Unsaved changes", on the left of the bottom bar.
 */
const DirtyLabel = ({ children }) => (
  <div class={style.dirtyLabel}>
    <span class={style.dirtyDot} aria-hidden="true" />
    <span>{children || <Text id="mobileKit.unsavedChanges" />}</span>
  </div>
);

/**
 * @description A 52px button of the phone pages. variant: 'primary' | 'danger' | 'dangerSoft' |
 * 'ghost', neutral when omitted. `loading` shows a spinner and disables it; `fit` keeps its
 * natural width in a bottom bar; `href` renders a link (a button while disabled or loading).
 */
const BigButton = ({ variant, loading, fit, href, icon, children, disabled, class: className, ...props }) => {
  const classes = cx(style.bigButton, className, {
    [style.bigButtonPrimary]: variant === 'primary',
    [style.bigButtonDanger]: variant === 'danger',
    [style.bigButtonDangerSoft]: variant === 'dangerSoft',
    [style.bigButtonGhost]: variant === 'ghost',
    [style.bigButtonFit]: fit
  });
  const content = [
    loading && <span class={style.buttonSpinner} aria-hidden="true" />,
    !loading && icon && <i class={`fe fe-${icon}`} aria-hidden="true" />,
    children
  ];
  // a link that is disabled or loading is a disabled button: it leads nowhere meanwhile
  if (href && !disabled && !loading) {
    return (
      <a href={href} class={classes} {...props}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" class={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
};

MobileBottomBar.DirtyLabel = DirtyLabel;

export { BigButton, DirtyLabel };
export default MobileBottomBar;
