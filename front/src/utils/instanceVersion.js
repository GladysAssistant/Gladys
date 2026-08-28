import keyValStore from './keyValueStore';

// The hosted Gladys Plus front redeploys the moment a release is published,
// while the local instance waits for Watchtower to pull the new image (up to
// ~24 hours). During that window the front can be ahead of the backend and
// call APIs the instance does not have yet: the header announces the mismatch
// (see components/header/InstanceUpdateNotice) instead of letting it surface
// as random bugs.

// Injected at build time from the root package.json (vite.config.mjs), the
// same field the server reads at startup — so front and instance versions
// come from one source and are directly comparable.
const FRONT_VERSION = process.env.GLADYS_FRONT_VERSION;

const DISMISSED_NOTICE_KEY = 'dismissed_instance_update_notice';

// Both versions come from the release process ("x.y.z", the instance with a
// leading "v"): a plain major.minor.patch comparison is enough, the full
// semver grammar is not worth shipping in the bundle (same trade-off as the
// demo store compatibility badge).
const parseVersion = version => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(version || '').trim());
  if (!match) {
    return null;
  }
  return match.slice(1, 4).map(Number);
};

const getFrontVersion = () => FRONT_VERSION;

// Strictly greater only: an instance AHEAD of the front (stale front cached
// by the browser) is not something the update button could fix, so it must
// not raise the notice. An unparseable version on either side means "don't
// know", which renders as no notice rather than a wrong one.
const isInstanceBehindFront = instanceVersion => {
  const front = parseVersion(FRONT_VERSION);
  const instance = parseVersion(instanceVersion);
  if (!front || !instance) {
    return false;
  }
  for (let i = 0; i < 3; i += 1) {
    if (front[i] !== instance[i]) {
      return front[i] > instance[i];
    }
  }
  return false;
};

// The dismissal is scoped to the exact (front, instance) pair: waiting for
// Watchtower is a legitimate choice and must not be nagged, but the next
// release is a new situation and shows the notice again.
const dismissedNoticeValue = instanceVersion => `${FRONT_VERSION}|${instanceVersion}`;

const isUpdateNoticeDismissed = instanceVersion =>
  keyValStore.get(DISMISSED_NOTICE_KEY) === dismissedNoticeValue(instanceVersion);

const dismissUpdateNotice = instanceVersion =>
  keyValStore.set(DISMISSED_NOTICE_KEY, dismissedNoticeValue(instanceVersion));

export { getFrontVersion, isInstanceBehindFront, isUpdateNoticeDismissed, dismissUpdateNotice };
