// A layer is downloaded, then extracted. The download is limited by the connection, the extraction by the disk (the
// SD card of a Raspberry Pi): neither takes most of the time everywhere, each counts for half of the layer.
const DOWNLOAD_SHARE = 0.5;

// Progress of a layer at the beginning and at the end of each status of the pull events. The other events are about
// the image itself ("Pulling from", "Digest", "Status"), or about a layer already on disk ("Already exists"), which
// is no work to wait for.
const LAYER_PROGRESS_BY_STATUS = {
  'Pulling fs layer': [0, 0],
  Waiting: [0, 0],
  Downloading: [0, DOWNLOAD_SHARE],
  'Verifying Checksum': [DOWNLOAD_SHARE, DOWNLOAD_SHARE],
  'Download complete': [DOWNLOAD_SHARE, DOWNLOAD_SHARE],
  Extracting: [DOWNLOAD_SHARE, 1],
  'Pull complete': [1, 1],
};

/**
 * @description Add a progress event of a pull to the layers of the image seen so far.
 * @param {object} layers - Layers seen so far, by id: what the previous call returned, or {} before the first event.
 * @param {object} event - Progress event sent by Docker, like { status: 'Downloading', id, progressDetail }.
 * @returns {object} The layers seen so far, with this event, without changing the layers given: the same object when
 * the event tells nothing new, so that the caller knows whether the pull made progress.
 * @example
 * layers = addPullEvent(layers, { status: 'Downloading', id: '8a49fdb3b6a5', progressDetail: { current: 5 } });
 */
function addPullEvent(layers, event) {
  const { id, status, progressDetail = {} } = event || {};
  if (!id || LAYER_PROGRESS_BY_STATUS[status] === undefined) {
    return layers;
  }
  const previousLayer = layers[id] || {};
  const layer = {
    status,
    current: progressDetail.current || 0,
    // Only the downloading and extracting events tell the size of the layer
    total: progressDetail.total || previousLayer.total || null,
  };
  // Docker repeats the position of each layer at a fixed pace with its containerd image store, even when the download
  // makes no progress
  if (
    layer.status === previousLayer.status &&
    layer.current === previousLayer.current &&
    layer.total === previousLayer.total
  ) {
    return layers;
  }
  return {
    ...layers,
    [id]: layer,
  };
}

/**
 * @description Compute the progress of a pull from the layers of the image seen so far, each layer counting for its
 * size. Docker tells the size of a layer only once it downloads it: until then, a layer counts for the average size
 * of the others, so the progress can go back a little when a large layer starts.
 * @param {object} layers - Layers seen so far, see addPullEvent.
 * @returns {number} Progress in percent, an integer from 0 to 100.
 * @example
 * const progress = getPullProgress(layers);
 */
function getPullProgress(layers) {
  const layerList = Object.values(layers);
  const knownSizes = layerList.map(({ total }) => total).filter((total) => total !== null);
  const averageSize = knownSizes.length > 0 ? knownSizes.reduce((sum, size) => sum + size, 0) / knownSizes.length : 1;
  let doneSize = 0;
  let totalSize = 0;
  layerList.forEach(({ status, current, total }) => {
    const [start, end] = LAYER_PROGRESS_BY_STATUS[status];
    const size = total === null ? averageSize : total;
    const statusProgress = total === null ? 0 : Math.min(current / total, 1);
    doneSize += size * (start + (end - start) * statusProgress);
    totalSize += size;
  });
  return totalSize === 0 ? 0 : Math.floor((doneSize / totalSize) * 100);
}

module.exports = {
  addPullEvent,
  getPullProgress,
};
