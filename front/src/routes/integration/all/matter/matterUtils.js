import get from 'get-value';

// The endpoint path of a Matter device or feature: `matter:<nodeId>:<devicePath>[:<clusterId>...]`
export const getNodeIdOfExternalId = externalId => externalId.split(':')[1];

export const getDevicePath = externalId =>
  externalId
    .split(':')
    .slice(2)
    .join(':');

const isDevicePathUnder = (devicePath, bridgedPath) =>
  devicePath === bridgedPath || devicePath.startsWith(`${bridgedPath}:`);

export const UNAVAILABLE_REASONS = {
  NODE_OFFLINE: 'node-offline',
  BRIDGED_UNREACHABLE: 'bridged-unreachable'
};

/**
 * @description The status of each node, by node id, as GET /node and the
 * `matter.node-status-changed` message give it (server/services/matter/docs/specs/matter.md).
 * @param {Array} nodes - The nodes.
 * @returns {Map} The status of each node.
 * @example
 * buildNodesStatus([{ node_id: '1', available: true, unreachable_device_paths: [] }]);
 */
export const buildNodesStatus = nodes =>
  new Map(
    nodes.map(node => [
      node.node_id,
      {
        status: node.status,
        available: node.available !== undefined ? node.available : node.is_connected,
        last_contact: node.last_contact,
        unreachable_device_paths: node.unreachable_device_paths || []
      }
    ])
  );

/**
 * @description The status of the nodes, with the one a WebSocket message brings.
 * @param {Map} nodesStatus - The current status of the nodes.
 * @param {object} payload - The payload of `matter.node-status-changed`.
 * @returns {Map} A new map.
 * @example
 * applyNodeStatus(nodesStatus, { node_id: '1', status: 'disconnected', available: false });
 */
export const applyNodeStatus = (nodesStatus, payload) => {
  const updated = new Map(nodesStatus);
  const previous = nodesStatus.get(payload.node_id);
  updated.set(payload.node_id, {
    status: payload.status,
    available: payload.available,
    last_contact: payload.last_contact || (previous && previous.last_contact),
    unreachable_device_paths: payload.unreachable_device_paths || []
  });
  return updated;
};

/**
 * @description The nodes of the settings page, with the status a WebSocket message brings for one of
 * them; every other field of the node is kept.
 * @param {Array} nodes - The nodes (GET /node).
 * @param {object} payload - The payload of `matter.node-status-changed`.
 * @returns {Array} A new array.
 * @example
 * applyNodeStatusToNodes(nodes, { node_id: '1', status: 'disconnected', available: false });
 */
export const applyNodeStatusToNodes = (nodes, payload) =>
  nodes.map(node =>
    node.node_id === payload.node_id
      ? {
          ...node,
          status: payload.status,
          available: payload.available,
          last_contact: payload.last_contact || node.last_contact,
          unreachable_device_paths: payload.unreachable_device_paths || []
        }
      : node
  );

/**
 * @description Follows the status messages received while a list of nodes is requested: they are
 * newer than its answer, which must not overwrite them.
 * @returns {object} { record(payload), during(request) }: `during` resolves to the answer of the
 * request and the latest message of each node received meanwhile.
 * @example
 * const statusEvents = createStatusEventsTracker();
 * const { result, events } = await statusEvents.during(() => httpClient.get('/api/v1/service/matter/node'));
 */
export const createStatusEventsTracker = () => {
  const pending = new Set();
  return {
    record: payload => pending.forEach(events => events.set(payload.node_id, payload)),
    during: async request => {
      const events = new Map();
      pending.add(events);
      try {
        const result = await request();
        return { result, events: Array.from(events.values()) };
      } finally {
        pending.delete(events);
      }
    }
  };
};

/**
 * @description Whether a Matter device is available: its node answers, and its bridge (if any) can
 * reach it. Null when the status of its node is not known yet (nothing is shown then).
 * @param {object} device - The Gladys (or paired) device.
 * @param {Map} nodesStatus - The status of each node.
 * @returns {object|null} { available, reason }.
 * @example
 * getDeviceAvailability(device, nodesStatus);
 */
export const getDeviceAvailability = (device, nodesStatus) => {
  const nodeStatus = nodesStatus.get(getNodeIdOfExternalId(device.external_id));
  if (!nodeStatus) {
    return null;
  }
  if (nodeStatus.available === false) {
    return { available: false, reason: UNAVAILABLE_REASONS.NODE_OFFLINE };
  }
  const devicePath = getDevicePath(device.external_id);
  if (nodeStatus.unreachable_device_paths.some(bridgedPath => isDevicePathUnder(devicePath, bridgedPath))) {
    return { available: false, reason: UNAVAILABLE_REASONS.BRIDGED_UNREACHABLE };
  }
  return { available: true, reason: null };
};

/**
 * @description The name Gladys suggests for a device paired in Matter, in the language of the user,
 * from the naming hints of the server: "Living room plug – Outlet 2", "Office sensor – Humidity", or
 * the product alone when it is the only device of its product (server/services/matter/docs/specs/matter.md).
 * @param {object} device - The paired device, with matter_naming { product, role, index, count, alone }.
 * @param {object} dictionary - The dictionary of the language of the user.
 * @returns {string} The name.
 * @example
 * suggestDeviceName(device, dictionary); // 'Prise salon – Sortie 2'
 */
export const suggestDeviceName = (device, dictionary) => {
  const naming = device.matter_naming;
  if (!naming) {
    return device.name;
  }
  const product = naming.product || device.name;
  if (naming.alone) {
    return product;
  }
  let role = naming.role && get(dictionary, `integration.matter.roles.${naming.role}`);
  if (!role) {
    const mainFeature = (device.features || [])[0];
    role = mainFeature && get(dictionary, `deviceFeatureCategory.${mainFeature.category}.shortCategoryName`);
  }
  if (!role) {
    return `${product} ${naming.index}`;
  }
  return naming.count > 1 ? `${product} – ${role} ${naming.index}` : `${product} – ${role}`;
};

/**
 * @description The name Gladys suggests for a feature, in the language of the user: its type
 * ("Temperature", "Power"), its category, or the name the server gave. Two features of a device
 * named the same are numbered.
 * @param {Array} features - The features of the device.
 * @param {object} dictionary - The dictionary of the language of the user.
 * @returns {Array<string>} The names, in the order of the features.
 * @example
 * suggestFeatureNames([{ category: 'switch', type: 'binary' }], dictionary); // ['Commutateur']
 */
export const suggestFeatureNames = (features, dictionary) => {
  const names = features.map(
    feature =>
      get(dictionary, `deviceFeatureCategory.${feature.category}.${feature.type}`) ||
      get(dictionary, `deviceFeatureCategory.${feature.category}.shortCategoryName`) ||
      feature.name
  );
  return names.map((name, index) => {
    const sameNames = names.filter(other => other === name);
    if (sameNames.length === 1) {
      return name;
    }
    const rank = names.slice(0, index + 1).filter(other => other === name).length;
    return `${name} ${rank}`;
  });
};

/**
 * @description A paired device ready to be created in Gladys: named, and its features named, in
 * the language of the user. The naming hints are not saved.
 * @param {object} device - The paired device.
 * @param {object} dictionary - The dictionary of the language of the user.
 * @returns {object} A copy of the device.
 * @example
 * nameNewDevice(device, dictionary);
 */
export const nameNewDevice = (device, dictionary) => {
  const { matter_naming: naming, ...deviceToSave } = device;
  const features = device.features || [];
  const featureNames = suggestFeatureNames(features, dictionary);
  return {
    ...deviceToSave,
    name: suggestDeviceName(device, dictionary),
    features: features.map((feature, index) => ({ ...feature, name: featureNames[index] }))
  };
};

/**
 * @description The features of a paired device merged into a device already in Gladys: the
 * features Gladys already has keep the name the user may have given them, a new feature gets a
 * suggested name.
 * @param {Array} pairedFeatures - The features of the paired device.
 * @param {Function} findExistingFeature - Finds the Gladys feature matching a paired feature.
 * @param {object} dictionary - The dictionary of the language of the user.
 * @returns {Array} The features, with their names.
 * @example
 * keepFeatureNames(pairedDevice.features, feature => gladysDevice.features.find(...), dictionary);
 */
export const keepFeatureNames = (pairedFeatures, findExistingFeature, dictionary) => {
  const suggestedNames = suggestFeatureNames(pairedFeatures, dictionary);
  return pairedFeatures.map((feature, index) => {
    const existingFeature = findExistingFeature(feature);
    return { ...feature, name: existingFeature ? existingFeature.name : suggestedNames[index] };
  });
};

// How the status of a node is shown: a reconnecting node stays "reconnecting" during the grace
// delay of the server, then is offline (server/services/matter/docs/specs/matter.md)
export const getNodeStatusDisplay = node => {
  if (node.status === 'connected') {
    return { key: 'connected', tone: 'success' };
  }
  if (node.status === 'reconnecting' && node.available) {
    return { key: 'reconnecting', tone: 'warning' };
  }
  return { key: 'offline', tone: 'danger' };
};

const NETWORK_ICONS = {
  wifi: 'wifi',
  thread: 'share-2',
  ethernet: 'server'
};

export const getNetworkIcon = networkType => NETWORK_ICONS[networkType] || 'cpu';

/**
 * @description The name of a node as the user knows it: its label or product, else its id.
 * @param {object} node - The node (GET /node or GET /node/:node_id).
 * @param {object} dictionary - The dictionary of the language of the user.
 * @returns {string} The name.
 * @example
 * getNodeDisplayName({ node_id: '12', name: null }, dictionary); // 'Nœud 12'
 */
export const getNodeDisplayName = (node, dictionary) => {
  if (node.name) {
    return node.name;
  }
  const label = get(dictionary, 'integration.matter.node.unnamed');
  return label ? label.replace('{{nodeId}}', node.node_id) : node.node_id;
};

// A manual pairing code as the other apps print it: 1234-567-8901 (or 1234-567-8901-2345-6789-0)
export const formatManualPairingCode = code =>
  code.length === 11 ? `${code.slice(0, 4)}-${code.slice(4, 7)}-${code.slice(7)}` : code;
