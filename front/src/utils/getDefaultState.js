import { getCurrentUrl } from 'preact-router';
import { HttpClient } from '../utils/HttpClient';
import { DemoHttpClient } from '../utils/DemoHttpClient';
import { Session } from '../utils/Session';

function getDefaultState() {
  const session = new Session();
  const httpClient = process.env.DEMO_MODE === 'true' ? new DemoHttpClient() : new HttpClient(session);
  const state = {
    httpClient,
    session,
    currentUrl: getCurrentUrl(),
    user: {
      language: navigator.language === 'fr' ? 'fr' : 'en'
    },
    showDropDown: false
  };
  return state;
}

export { getDefaultState };
