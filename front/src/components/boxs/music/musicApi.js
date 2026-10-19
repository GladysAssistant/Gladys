import get from 'get-value';

// The on-demand music routes of a player (docs/specs/external-integrations/capabilities/music.md,
// section 4.3): every one of them sits under the device.
export const musicRoute = (deviceSelector, path) =>
  `/api/v1/device/${encodeURIComponent(deviceSelector)}/music/${path}`;

export const getErrorStatus = e => get(e, 'response.status');

// mm:ss (h:mm:ss beyond an hour) for a number of seconds; an unknown duration reads as a dash
export const formatSeconds = seconds => {
  if (seconds === null || seconds === undefined || Number.isNaN(Number(seconds))) {
    return '–';
  }
  const total = Math.max(0, Math.round(Number(seconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const pad = value => `${value}`.padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(rest)}`;
  }
  return `${minutes}:${pad(rest)}`;
};

// The page the queue panel shows: the first page, unless the playing item falls outside it, in
// which case the page starts a few items before it (section 4.3)
export const QUEUE_PAGE_SIZE = 50;
export const QUEUE_ITEMS_BEFORE_CURRENT = 10;
export const BROWSE_PAGE_SIZE = 50;
export const SEARCH_LIMIT = 20;
export const SEARCH_DEBOUNCE_MS = 300;
// how long a row shows that its item was started or enqueued, and a failed command its notice
export const ITEM_FEEDBACK_MS = 2500;
export const COMMAND_ERROR_MS = 5000;
// a write to a feature with feedback is confirmed by the player's new state: the 5 s set-value
// ack, plus the next poll of a cloud player
export const CONFIRMATION_TIMEOUT_MS = 8000;

export const queueOffsetAround = currentIndex => Math.max(0, currentIndex - QUEUE_ITEMS_BEFORE_CURRENT);
