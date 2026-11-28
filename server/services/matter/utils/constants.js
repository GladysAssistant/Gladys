const VARIABLES = {
  MATTER_ENABLED: 'MATTER_ENABLED',
  MATTER_BACKUP: 'MATTER_BACKUP',
  // JSON { nodeId: ISO date }: the last contact of each node, kept across restarts
  MATTER_LAST_CONTACTS: 'MATTER_LAST_CONTACTS',
};

const MATTER_NODE_CONNECTION_TIMEOUT_MS = 15000;
const MATTER_NODE_REFRESH_CONCURRENCY = 3;
// Value of NodeStates.Connected in matter.js (PairedNode connection state)
const MATTER_NODE_STATE_CONNECTED = 0;

// The connection status of a node, as shown to the user, by NodeStates value of matter.js
// (Connected 0, Disconnected 1, Reconnecting 2, WaitingForDeviceDiscovery 3)
const MATTER_NODE_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  WAITING_FOR_DISCOVERY: 'waiting-for-discovery',
};
const MATTER_NODE_STATUS_BY_STATE = [
  MATTER_NODE_STATUS.CONNECTED,
  MATTER_NODE_STATUS.DISCONNECTED,
  MATTER_NODE_STATUS.RECONNECTING,
  MATTER_NODE_STATUS.WAITING_FOR_DISCOVERY,
];

// A node which reconnects (a subscription renewed, a short network glitch) stays available this long,
// so that its devices do not blink "unavailable" for a few seconds
const MATTER_NODE_UNAVAILABLE_GRACE_MS = 30000;

// Why a Matter device is unavailable
const MATTER_UNAVAILABLE_REASONS = {
  NODE_OFFLINE: 'node-offline',
  BRIDGED_UNREACHABLE: 'bridged-unreachable',
};

// Bounded live reads of the node sheet, so that a slow node never blocks the page
const MATTER_NODE_READ_TIMEOUT_MS = 5000;
// How long the node blinks when the user asks to identify it
const MATTER_IDENTIFY_DURATION_SECONDS = 15;
// How long a commissioning window opened to share a node with another ecosystem stays open
const MATTER_SHARE_WINDOW_SECONDS = 900;

module.exports = {
  VARIABLES,
  MATTER_NODE_CONNECTION_TIMEOUT_MS,
  MATTER_NODE_REFRESH_CONCURRENCY,
  MATTER_NODE_STATE_CONNECTED,
  MATTER_NODE_STATUS,
  MATTER_NODE_STATUS_BY_STATE,
  MATTER_NODE_UNAVAILABLE_GRACE_MS,
  MATTER_UNAVAILABLE_REASONS,
  MATTER_NODE_READ_TIMEOUT_MS,
  MATTER_IDENTIFY_DURATION_SECONDS,
  MATTER_SHARE_WINDOW_SECONDS,
};
