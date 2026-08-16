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
 * @description Merge a freshly fetched list of running scenes with the entries
 * already present in the state, deduplicating by executionId. This avoids a
 * late-resolving fetch overwriting updates already applied by websocket events
 * (scene.started / scene.stopped) received while the fetch was in flight.
 *
 * Websocket removals are authoritative: an execution the server still listed
 * when the request was built may have finished before the response landed, so
 * every id reported stopped while the fetch was in flight is dropped. Without
 * it a stale response resurrects a finished execution and the UI stays stuck on
 * "running" until the next event.
 * @param {Array} fetched - The list returned by GET /api/v1/scene/running.
 * @param {Array} current - The running scenes currently in the state.
 * @param {Set} [stoppedDuringFetch] - Execution ids stopped while fetching.
 * @returns {Array} The merged list (fetched entries win on conflict).
 * @example
 * mergeRunningScenes(fetched, prevState.runningScenes, stoppedDuringFetch);
 */
export const mergeRunningScenes = (fetched, current, stoppedDuringFetch) => {
  const byExecutionId = new Map();
  (current || []).forEach(runningScene => byExecutionId.set(runningScene.executionId, runningScene));
  (fetched || []).forEach(runningScene => byExecutionId.set(runningScene.executionId, runningScene));
  if (stoppedDuringFetch) {
    stoppedDuringFetch.forEach(executionId => byExecutionId.delete(executionId));
  }
  return Array.from(byExecutionId.values());
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
