import config from '../config';
import keyValStore from './keyValueStore';
import { USER_ROLE } from '../../../server/utils/constants';

// The yearly community survey, announced in the navigation rail
// (components/header/SurveyNotice.jsx) until it closes. Everything lives in
// this file: there is no remote call, the notice ships with the release and
// disappears by itself after `endsAt`. For the next survey, change the id (a
// new id shows the notice again to those who hid this one), the forms and the
// end date.
const SURVEY = {
  id: '2026',
  // the survey closes at the end of 31 December 2026, Paris time
  endsAt: new Date('2027-01-01T00:00:00+01:00'),
  // one form per language: French, and English for every other language
  forms: {
    fr: 'https://tally.so/r/bZWkq6',
    default: 'https://tally.so/r/1W9Kk1'
  }
};

const DISMISSED_SURVEY_KEY = 'dismissed_survey_notice';

// The hidden "source" field of the form tells the answers coming from Gladys
// apart from those coming from the newsletter, the forum or social networks.
const getSurveyUrl = language => `${SURVEY.forms[language] || SURVEY.forms.default}?source=app`;

const isSurveyNoticeDismissed = () => keyValStore.get(DISMISSED_SURVEY_KEY) === SURVEY.id;

const dismissSurveyNotice = () => keyValStore.set(DISMISSED_SURVEY_KEY, SURVEY.id);

// A browser in tablet mode is a wall tablet: a survey has nothing to do there.
const isTabletModeBrowser = session =>
  Boolean(
    session &&
      typeof session.getTabletModeCurrentHouseSelector === 'function' &&
      session.getTabletModeCurrentHouseSelector()
  );

// Shown to admins only (the person who installed Gladys, not the rest of the
// household), never on the demo (its visitors are discovering Gladys), never
// on a wall tablet, and only until the survey closes or the user hides it.
const shouldShowSurveyNotice = ({ user, session, now = new Date() }) =>
  !config.demoMode &&
  now < SURVEY.endsAt &&
  Boolean(user) &&
  user.role === USER_ROLE.ADMIN &&
  !isTabletModeBrowser(session) &&
  !isSurveyNoticeDismissed();

export { SURVEY, getSurveyUrl, shouldShowSurveyNotice, dismissSurveyNotice };
