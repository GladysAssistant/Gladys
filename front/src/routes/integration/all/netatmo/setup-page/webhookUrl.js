import { WEBHOOK_BASE_URL } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';

// The user usually only provides their Open API key; pasting a full URL also works
// (and keeps a stored URL pointing to another gateway host untouched).
export const buildWebhookUrl = key => {
  const trimmedKey = (key || '').trim();
  if (trimmedKey === '') {
    return '';
  }
  if (trimmedKey.toLowerCase().startsWith('http')) {
    return trimmedKey;
  }
  return `${WEBHOOK_BASE_URL}${trimmedKey}`;
};

export const extractWebhookKey = url => {
  const trimmedUrl = (url || '').trim();
  if (trimmedUrl.startsWith(WEBHOOK_BASE_URL)) {
    return trimmedUrl.slice(WEBHOOK_BASE_URL.length);
  }
  return trimmedUrl;
};

export const isWebhookKeyInvalid = key => {
  const url = buildWebhookUrl(key);
  if (url === '') {
    return false;
  }
  try {
    return new URL(url).protocol !== 'https:';
  } catch (e) {
    return true;
  }
};
