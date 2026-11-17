import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import MobileAuthLayout from '../../components/auth/MobileAuthLayout';
import { MobileAuthTitle, MobileAuthBar } from '../../components/auth/mobile';
import { MobileField, BigButton, fieldClass } from '../../components/mobile';
import style from './style.css';

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const CODE_DOT = '•';

/**
 * @description The keypad of an armed house on a phone (docs/specs/mobile-pages/auth.md, C.4):
 * the code as it is typed, twelve keys a thumb cannot miss — the digits and the correction —
 * and "Validate" in the bottom bar. Same handlers as the desktop card: the phone layout types
 * the same code and sends the same request.
 */
const MobileLocked = ({
  currentCode,
  typeLetter,
  clearPreviousLetter,
  validateCode,
  validating,
  error,
  errorMessage,
  errorStatus,
  wrongCode,
  tooManyRequests,
  waitTimeInMinute
}) => {
  let barError = null;
  if (tooManyRequests) {
    barError = <Text id="locked.tooManyRequests" fields={{ count: waitTimeInMinute }} />;
  } else if (error) {
    barError = (
      <span>
        <Text id="locked.error" />
        {errorMessage && <br />}
        {errorMessage && `${errorStatus || ''} ${errorMessage}`}
      </span>
    );
  }
  return (
    <MobileAuthLayout dataCy="locked-mobile">
      <form onSubmit={validateCode} autocomplete="off" class={style.mobileLocked}>
        <div class={style.mobileLockedIntro}>
          <MobileAuthTitle lead={<Text id="locked.description" />}>
            <Text id="locked.cardTitle" />
          </MobileAuthTitle>
          <MobileField htmlFor="locked-code" error={wrongCode && <Text id="locked.wrongCodeError" />}>
            <Localizer>
              <input
                id="locked-code"
                // not a password field: a password manager would offer to save or fill the code of
                // the alarm. The field only ever holds one dot per digit typed — the code itself
                // stays in the state of the page
                type="text"
                class={cx(fieldClass.input, style.mobileCode, { [fieldClass.invalid]: wrongCode })}
                value={CODE_DOT.repeat(currentCode.length)}
                data-length={currentCode.length}
                aria-invalid={wrongCode ? 'true' : 'false'}
                aria-describedby={wrongCode ? 'locked-code-error' : undefined}
                // the keypad below is the keyboard: the one of the phone stays closed
                readonly
                inputmode="none"
                autocomplete="off"
                tabindex="-1"
                placeholder={<Text id="locked.codePlaceholder" />}
                aria-label={<Text id="locked.codePlaceholder" />}
                data-cy="locked-code"
              />
            </Localizer>
          </MobileField>
        </div>
        <div class={style.mobileKeypad} data-cy="locked-keypad">
          {KEYS.map(key => (
            <button
              key={key}
              type="button"
              class={style.mobileKey}
              onClick={e => typeLetter(e, key)}
              data-cy={`locked-key-${key}`}
            >
              {key}
            </button>
          ))}
          <span aria-hidden="true" />
          <button type="button" class={style.mobileKey} onClick={e => typeLetter(e, 0)} data-cy="locked-key-0">
            0
          </button>
          <Localizer>
            <button
              type="button"
              class={cx(style.mobileKey, style.mobileKeyDelete)}
              onClick={clearPreviousLetter}
              disabled={!currentCode}
              aria-label={<Text id="locked.mobile.deleteDigit" />}
              data-cy="locked-key-delete"
            >
              <i class="fe fe-delete" aria-hidden="true" />
            </button>
          </Localizer>
        </div>
        <MobileAuthBar error={barError}>
          <BigButton variant="primary" type="submit" loading={validating} data-cy="locked-validate">
            <Text id="locked.validateButton" />
          </BigButton>
        </MobileAuthBar>
      </form>
    </MobileAuthLayout>
  );
};

export default MobileLocked;
