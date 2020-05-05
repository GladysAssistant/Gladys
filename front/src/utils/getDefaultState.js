import config from '../../config';
import { AVAILABLE_LANGUAGES_LIST, AVAILABLE_LANGUAGES } from '../../../server/utils/constants';
import { getCurrentUrl } from 'preact-router';
import { HttpClient } from '../utils/HttpClient';
import { DemoHttpClient } from '../utils/DemoHttpClient';
import { Session } from './Session';
import { DemoSession } from './DemoSession';
import { GatewaySession } from './GatewaySession';
import { GatewayHttpClient } from './GatewayHttpClient';

function getDefaultState() {
  const session = config.gatewayMode ? new GatewaySession() : config.demoMode ? new DemoSession() : new Session();
  const httpClient = config.demoMode
    ? new DemoHttpClient()
    : config.gatewayMode
    ? new GatewayHttpClient(session)
    : new HttpClient(session);

  // Load language from local storage
  let language;
  try {
    const user = session.getUser();
    if (user && user.language && AVAILABLE_LANGUAGES_LIST.includes(user.language)) {
      language = user.language;
    }
  } catch (e) {}

  // if not available, load it from navigator language
  if (!language) {
    language = navigator.language === AVAILABLE_LANGUAGES.FR ? AVAILABLE_LANGUAGES.FR : AVAILABLE_LANGUAGES.EN;
  }

  const state = {
    httpClient,
    session,
    currentUrl: getCurrentUrl(),
    user: {
      language
    },
    showDropDown: false
  };
  return state;
}

export { getDefaultState };
