import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { getSurveyUrl, dismissSurveyNotice } from '../../utils/survey';
import style from './style.css';

// The yearly community survey (see utils/survey.js), at the bottom of the
// navigation rail like the other notices. Opening the form hides it too: there
// is no reason to keep asking someone who went to answer. Unlike the update,
// payment and clock notices, it does not light the dot of the menu button: that
// dot means "something here needs your attention", and a survey does not.
const SurveyNotice = ({ user, onDismiss }) => {
  const hide = () => {
    dismissSurveyNotice();
    // the dismissal lives in localStorage: the header owns this notice, so it
    // is the one told to re-read it
    onDismiss();
  };
  // deferred: the form opens in a new tab from this very click, before the
  // notice (and the link) leave the page
  const hideAfterOpening = () => setTimeout(hide, 0);

  return (
    <div class={style.updateNoticeCard} data-cy="survey-notice">
      <Localizer>
        <button
          type="button"
          class={style.updateNoticeDismiss}
          onClick={hide}
          aria-label={<Text id="header.surveyNoticeDismiss" />}
          data-cy="survey-notice-dismiss"
        >
          <i class="fe fe-x" />
        </button>
      </Localizer>
      <div class={style.updateNoticeTitle}>
        <i class={cx('fe fe-message-square', style.updateNoticeIcon)} />
        <span>
          <Text id="header.surveyNoticeTitle" />
        </span>
      </div>
      <div class={style.updateNoticeText}>
        <Text id="header.surveyNoticeText" />
      </div>
      <a
        href={getSurveyUrl(user.language)}
        target="_blank"
        rel="noopener noreferrer"
        class={style.updateNoticeCta}
        onClick={hideAfterOpening}
        data-cy="survey-notice-link"
      >
        <Text id="header.surveyNoticeButton" />
      </a>
    </div>
  );
};

export default SurveyNotice;
