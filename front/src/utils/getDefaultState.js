import config from '../../config';
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
