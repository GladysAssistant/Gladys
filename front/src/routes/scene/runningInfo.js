/**
 * @description Compute how many instances of a scene are currently running
 * and for how long the oldest one has been executing.
 * @param {Array} runningScenes - The list of running scene executions.
 * @param {string} sceneSelector - The selector of the scene to look for.
 * @param {number} [now] - The current timestamp in milliseconds.
 * @returns {object} An object `{ count, elapsedMs }`, or `null` if not running.
 * @example
 * computeRunningInfo(runningScenes, 'my-scene', Date.now());
 */
export const computeRunningInfo = (runningScenes, sceneSelector, now) => {
  const instances = (runningScenes || []).filter(runningScene => runningScene.sceneSelector === sceneSelector);
  if (instances.length === 0) {
    return null;
  }
  const oldestStartedAt = Math.min(...instances.map(instance => new Date(instance.startedAt).getTime()));
  const elapsedMs = Math.max(0, (now || Date.now()) - oldestStartedAt);
  return { count: instances.length, elapsedMs };
};

/**
 * @description Format an elapsed duration in milliseconds as `h:mm:ss` or `m:ss`.
 * @param {number} elapsedMs - The elapsed duration in milliseconds.
 * @returns {string} The formatted duration.
 * @example
 * formatElapsed(65000); // '1:05'
 */
export const formatElapsed = elapsedMs => {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = value => String(value).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
};
