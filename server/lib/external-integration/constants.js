// Docker label used to find back integration containers (reconciliation
// at boot and after a backup restore).
const EXTERNAL_INTEGRATION_LABEL = 'io.gladysassistant.external-integration';
// Docker image label containing a copy of the manifest, used for
// the "dev" install mode by image name (without a GitHub repo).
const MANIFEST_IMAGE_LABEL = 'io.gladysassistant.manifest';
// Name of the manifest file at the root of the integration GitHub repo.
const MANIFEST_FILE_NAME = 'gladys-assistant-integration.json';
// Dedicated bridge network. icc is disabled so integrations are isolated
// from each other; container -> gateway (Gladys) and container -> internet
// still work.
const INTEGRATIONS_NETWORK_NAME = 'gladys-integrations';
// Subnet pinned by IPAM so the gateway (= the host, where the Gladys API
// listens) is deterministic on almost all installs.
const INTEGRATIONS_NETWORK_SUBNET = '172.30.0.0/24';
const INTEGRATIONS_NETWORK_GATEWAY = '172.30.0.1';
// Private bridge network of a multi-container integration (icc stays
// enabled inside: the main container must reach its sub-containers, e.g.
// Frigate -> Mosquitto). DNS alias of each sub-container = its `name`.
const PRIVATE_NETWORK_PREFIX = 'gladys-int-';
// Docker label carrying the sub-container `name` (the main container has
// only the reconciliation label).
const SUB_CONTAINER_LABEL = 'io.gladysassistant.container';
// uid/gid of the `node` user in the official node images: the template
// runs the integration as this unprivileged user (USER node), so the /data
// bind source is created and chowned to it before the container exists —
// Docker would otherwise create the folder owned by root:root, leaving the
// only writable path of the container read-only for the integration.
const INTEGRATION_DATA_UID = 1000;
const INTEGRATION_DATA_GID = 1000;
// An image pulled more recently than this is never swept by cleanImages.
// install/update pull their images *before* writing the t_service row that
// declares them, so between the two the sweep would see a brand new image as
// an orphan and delete it under the operation that just fetched it. One hour
// dwarfs the slowest install and only delays a genuine orphan by a day.
const RECENTLY_PULLED_PROTECTION_MS = 60 * 60 * 1000;
// Bounds of the `containers` manifest field (same rules as the indexer).
const MAX_SUB_CONTAINERS = 5;
const MAX_SUB_CONTAINER_VOLUMES = 5;
const MAX_SUB_CONTAINER_PORTS = 3;
const SUB_CONTAINER_NAME_REGEX = /^[a-z0-9-]{2,20}$/;
// Optional stable identifier of a declared port, unique across the whole
// manifest: referenced by the {{port:<name>}} placeholder of the section
// texts, resolved by the frontend with the assigned host port (C.1).
const SUB_CONTAINER_PORT_NAME_REGEX = /^[a-z0-9_]{2,20}$/;
const SUB_CONTAINER_MEMORY_MIN_MB = 32;
const SUB_CONTAINER_MEMORY_MAX_MB = 4096;
const SUB_CONTAINER_MEMORY_DEFAULT_MB = 256;
const SUB_CONTAINER_CPU_MIN = 0.1;
const SUB_CONTAINER_CPU_MAX = 2;
const SUB_CONTAINER_CPU_DEFAULT = 0.5;
const SUB_CONTAINER_SHM_MIN_MB = 64;
const SUB_CONTAINER_SHM_MAX_MB = 512;
const SUB_CONTAINER_SHM_DEFAULT_MB = 64;
const SUB_CONTAINER_START_MODES = ['auto', 'manual'];
// Named hardware access classes (curated list, never a free /dev path).
// `path`: the class is a fixed path relative to /dev; `prefix`: every /dev
// entry starting with the prefix belongs to the class (e.g. /dev/video0...).
const HARDWARE_CLASSES = {
  'coral-usb': { path: 'bus/usb' },
  'coral-pcie': { prefix: 'apex_' },
  gpu: { path: 'dri' },
  video: { prefix: 'video' },
};
// Per-integration variables (scoped by service_id) holding the
// sub-container runtime state that must survive container recreations.
const SUB_CONTAINER_PORTS_VARIABLE = 'EXTERNAL_INTEGRATION_CONTAINER_PORTS';
const SUB_CONTAINER_DESIRED_VARIABLE = 'EXTERNAL_INTEGRATION_CONTAINERS_DESIRED';
const SUB_CONTAINER_ENV_VARIABLE = 'EXTERNAL_INTEGRATION_CONTAINERS_ENV';
// The secret signing the integration JWTs, generated once and persisted:
// without a JWT_SECRET env var the process-level secret is regenerated at
// every boot, which used to invalidate every token baked in the container
// envs ("authentication refused (close code 4000)" loops after each
// restart of Gladys).
const INTEGRATION_JWT_SECRET_VARIABLE = 'EXTERNAL_INTEGRATION_JWT_SECRET';
// Selector prefix, avoiding any collision with a future native service
// (service.load looks up services by name).
const SELECTOR_PREFIX = 'ext-';
const DEV_SELECTOR_PREFIX = 'ext-dev-';
// Highest manifest_version this Gladys knows how to handle.
const SUPPORTED_MANIFEST_VERSION = 1;
// State machine timings (see RFC):
// a started container is not a working integration: without a first
// successful WS auth or HTTP heartbeat within this delay -> DEGRADED.
const STARTUP_TIMEOUT_MS = 60 * 1000;
// checkHealth runs every 30 seconds.
const CHECK_HEALTH_INTERVAL_MS = 30 * 1000;
// A RUNNING status older than this without any heartbeat -> DEGRADED.
const HEARTBEAT_TIMEOUT_MS = 60 * 1000;
// failure_count is reset after this duration of stable RUNNING.
const STABLE_RUNNING_RESET_MS = 60 * 1000;
// After this number of supervisor restarts without stable recovery -> ERROR.
const MAX_FAILURE_COUNT = 5;
// Restart backoff: min(10s * 2^n, 15min).
const RESTART_BACKOFF_BASE_MS = 10 * 1000;
const RESTART_BACKOFF_MAX_MS = 15 * 60 * 1000;
// WebSocket protocol ping interval; 2 missed pongs -> DEGRADED.
const WEBSOCKET_PING_INTERVAL_MS = 20 * 1000;
const MAX_MISSED_PINGS = 2;
// Commands sent to the integration must be acked within this delay
// (manifest actions override it with their declared timeout_seconds).
const COMMAND_TIMEOUT_MS = 5 * 1000;
// A message is not an interactive command: at boot the container is started
// by service.startAll but authenticates on the WebSocket a few hundred
// milliseconds later, and the notifications sent right after (the "Gladys
// just upgraded" message) used to be lost on EXTERNAL_INTEGRATION_NOT_CONNECTED.
// The message relay waits for the connection, but only inside the startup
// window and only up to this delay — a stopped or broken integration still
// fails immediately.
const MESSAGE_CONNECTION_WAIT_MS = 15 * 1000;
// Manifest actions: on-demand operations rendered as buttons in the
// Configuration screen. Their ack delay is per-action (they can be long:
// protocol detection, re-pairing...), bounded 5-120s.
const MAX_ACTIONS = 10;
const ACTION_MIN_TIMEOUT_SECONDS = 5;
const ACTION_MAX_TIMEOUT_SECONDS = 120;
const ACTION_DEFAULT_TIMEOUT_SECONDS = 30;
// Host API limits.
// Discovery is fleet-wide by construction: a network integration (UniFi,
// router-based presence...) publishes one discovered device per client on
// the network, which reaches ~1000 entries on a large home/small business
// setup. The list is memory-only and cheap; the HTTP body bound
// (jsonBodyMiddleware) is sized so this count stays the binding limit.
const MAX_DISCOVERED_DEVICES = 2000;
const MAX_STATES_PER_REQUEST = 100;
const MAX_STATES_PER_MINUTE = 300;
// Communication integrations: user <-> contact link. The link itself is a
// variable scoped (service_id, user_id) — no migration needed; the short
// link codes live in the in-memory cache with a 15 minutes TTL.
const CONTACT_VARIABLE = 'EXTERNAL_INTEGRATION_CONTACT';
// Send-only communication channels (messaging.receive false — the Free
// Mobile family): no inbound path, so the code-based link is impossible by
// construction. The per-user identity comes from the manifest
// contact_schema instead, filled by each user in the "My account" block
// and stored as one JSON object per (service_id, user_id).
const CONTACT_PROFILE_VARIABLE = 'EXTERNAL_INTEGRATION_CONTACT_PROFILE';
const LINK_CODE_CACHE_PREFIX = 'external-integration-link-code';
const LINK_CODE_TTL_MS = 15 * 60 * 1000;
const LINK_CODE_LENGTH = 8;
const MAX_MESSAGE_TEXT_LENGTH = 4096;
// Mediated network discovery (B.16): the core captures and emits from
// its network=host position, the integration interprets and forges (it
// knows the protocol, the core never parses nor builds a payload).
// Curated capture types only — never arbitrary capture.
const NETWORK_DISCOVERY_TYPES = ['udp-broadcast', 'udp-active-broadcast', 'mdns', 'ssdp'];
const MAX_NETWORK_DISCOVERY_ENTRIES = 5;
const MAX_UDP_BROADCAST_PORTS = 5;
const NETWORK_DISCOVERY_MIN_TIMEOUT_SECONDS = 1;
const NETWORK_DISCOVERY_MAX_TIMEOUT_SECONDS = 30;
const NETWORK_DISCOVERY_DEFAULT_TIMEOUT_SECONDS = 10;
// Active scan (query/response protocols, the TP-Link Kasa case: the
// integration forges the request, the core broadcasts it and relays the
// unicast replies). Emission guardrails — the core sends a packet forged
// by a third party, the primitive must stay uninteresting to hijack:
// broadcast only (never a chosen unicast target), declared ports only,
// small payload, one scan per 10 seconds per integration.
const MAX_ACTIVE_BROADCAST_PAYLOAD_BYTES = 512;
const ACTIVE_BROADCAST_MIN_INTERVAL_MS = 10 * 1000;
// Wake-on-LAN (POST /network/wake): the payload is the fixed magic packet
// (never integration-provided bytes), and the emission rate is bounded so
// the primitive cannot be turned into a UDP flood from the core's network
// namespace. 2 seconds still allows the usual "send a few packets until
// the device wakes up" retry loop.
const NETWORK_WAKE_MIN_INTERVAL_MS = 2 * 1000;
// Camera images: pushed through POST /camera/image (core's 150 KB bound),
// never through POST /state (dedicated saveStringState path, no state
// history). Continuous video streaming is out of the v1 scope.
const MAX_CAMERA_IMAGES_PER_MINUTE = 12;
// mirror of the core bound (camera.setImage MAX_SIZE_IMAGE)
const MAX_CAMERA_IMAGE_SIZE = 150 * 1024;
// on-demand fresh image (dashboard live view): an ffmpeg capture can be
// slow, this is the second exception to the 5s ack rule
const CAMERA_GET_IMAGE_TIMEOUT_MS = 15 * 1000;
// Weather providers (B.18): weather.get triggers a fresh third-party API
// call from the integration, same exception to the 5s ack rule as the
// camera image.
const WEATHER_GET_TIMEOUT_MS = 15 * 1000;
// Bounds of the normalized pivot weather format (B.18): the payload comes
// from unaudited code, everything is whitelisted, coerced and capped
// before entering the core.
const MAX_WEATHER_HOURS = 24;
const MAX_WEATHER_DAYS = 8;
const MAX_WEATHER_ALERTS = 10;
const MAX_WEATHER_ALERT_EVENT_LENGTH = 100;
// CAP descriptions run long (NWS bulletins regularly exceed 2000 chars,
// the MF vigilance bulletin runs up to ~4000): 5000 keeps the full text.
const MAX_WEATHER_ALERT_DESCRIPTION_LENGTH = 5000;
// Minimal interval between two accepted freshness nudges of one
// integration (B.18 point 5); beyond it the nudge is silently dropped.
const WEATHER_REFRESH_MIN_INTERVAL_MS = 60 * 1000;
// Provider images (B.18 point 6): declared as metadata in the pivot
// payload, bytes fetched on demand and validated before entering the core.
const MAX_WEATHER_IMAGES = 3;
const WEATHER_IMAGE_KEY_REGEX = /^[a-z0-9][a-z0-9-]{0,31}$/;
const MAX_WEATHER_IMAGE_LABEL_LENGTH = 50;
const MAX_WEATHER_IMAGE_BYTES = 500 * 1024;
const WEATHER_IMAGE_CACHE_TTL_MS = 10 * 60 * 1000;
const WEATHER_IMAGE_CACHE_PREFIX = 'weather-image';
// The generic condition enum of the pivot format; anything else is
// coerced to 'unknown' (the frontend renders a neutral icon).
// 'night' is deprecated for providers: send the real condition plus
// is_day: false instead (a rainy night stays 'rain').
const WEATHER_CONDITIONS = [
  'clear',
  'partly-cloudy',
  'cloud',
  'fog',
  'drizzle',
  'rain',
  'pouring',
  'sleet',
  'hail',
  'snow',
  'thunderstorm',
  'wind',
  'night',
  'unknown',
];
// CAP-style severities (Common Alerting Protocol) — generic, never one
// provider's scale (Météo France vigilance: yellow -> moderate,
// orange -> severe, red -> extreme).
const WEATHER_ALERT_SEVERITIES = ['minor', 'moderate', 'severe', 'extreme'];
// Generic alert phenomenon types, generalized from the MF vigilance
// phenomena, the MeteoAlarm awareness types and the NWS event catalog.
// Optional metadata: an invalid type is dropped, the alert is kept.
const WEATHER_ALERT_TYPES = [
  'wind',
  'rain',
  'flood',
  'thunderstorm',
  'snow',
  'heat',
  'cold',
  'avalanche',
  'coastal',
  'fog',
];
// Reserved GLADYS_* params namespace in discovered devices: only the
// semantics defined by the spec are accepted. GLADYS_TRANSPORT is the
// effective transport of the device (cloud/local badge in the UI) —
// purely declarative, zero routing semantics in the core.
const RESERVED_PARAM_PREFIX = 'GLADYS_';
const TRANSPORT_PARAM = 'GLADYS_TRANSPORT';
const DEVICE_TRANSPORTS = ['local', 'cloud', 'unreachable'];
const MAX_TRANSPORTS_PER_REQUEST = 100;
// Degraded transport state, orthogonal to the transport enum ("which
// channel is used right now" and "is it the nominal state" are two
// different informations — e.g. local detected but sessions refused,
// falling back to cloud): GLADYS_TRANSPORT_DEGRADED = "true" (absent
// otherwise) + GLADYS_TRANSPORT_MESSAGE = the reason, a multi-language
// object serialized as JSON (en required, 200 chars max per language).
const TRANSPORT_DEGRADED_PARAM = 'GLADYS_TRANSPORT_DEGRADED';
const TRANSPORT_MESSAGE_PARAM = 'GLADYS_TRANSPORT_MESSAGE';
const MAX_TRANSPORT_MESSAGE_LENGTH = 200;
// Manifest transports field + the standard "prefer local" user preference,
// stored as a reserved config key (readable by the integration, never
// writable by it).
const MANIFEST_TRANSPORTS = ['local', 'cloud'];
const PREFER_LOCAL_CONFIG_KEY = 'GLADYS_PREFER_LOCAL';
// The two config field types that link a provider account instead of holding a
// value: both render a Connect button fed by the connection status, and both
// keep their credentials off-schema. `oauth2` is the redirect-based OAuth2 flow
// (the provider comes back to a redirect URI with a code); `account_link` is for
// a provider that never redirects back — a QR sign-in approved in the vendor
// app, a pairing confirmed on a device — so it has no redirect URI, no anti-CSRF
// state and no callback, and the integration reports the approval itself.
const ACCOUNT_FIELD_TYPES = ['oauth2', 'account_link'];
// Optional `categories` manifest field: browse categories of the integration
// catalog (docs/specs/integration-catalog-categories.md). More than 3 means
// the assignment is lazy, not the vocabulary too narrow.
const MAX_MANIFEST_CATEGORIES = 3;
// Inbound webhooks via Gladys Plus (B.17): the gateway relays third-party
// webhook calls to the instance under a single integration-agnostic action;
// the supervisor routes them to the declared integration. Two modes exist
// on the field: fire_and_forget (the third party only wants an ack, the
// Netatmo class) and sync (the caller waits for the integration's response
// — challenge/response registrations). The user-pasted Open API key is a
// reserved config secret; the core builds the full webhook URLs.
const MAX_WEBHOOKS = 3;
const WEBHOOK_MODES = ['fire_and_forget', 'sync'];
const WEBHOOK_DEFAULT_MODE = 'fire_and_forget';
const OPEN_API_KEY_CONFIG_KEY = 'GLADYS_OPEN_API_KEY';
// bounded both ways: mirror of the gateway inbound bound, and the cap of
// the sync response body relayed back to the third party
const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;
const MAX_WEBHOOK_RESPONSE_BODY_BYTES = 64 * 1024;
// a sync response can express client errors but never a server identity
// (5xx would let the integration make Gladys Plus look broken)
const WEBHOOK_RESPONSE_MIN_STATUS = 200;
const WEBHOOK_RESPONSE_MAX_STATUS = 499;

module.exports = {
  EXTERNAL_INTEGRATION_LABEL,
  MANIFEST_IMAGE_LABEL,
  MANIFEST_FILE_NAME,
  PRIVATE_NETWORK_PREFIX,
  SUB_CONTAINER_LABEL,
  INTEGRATION_DATA_UID,
  INTEGRATION_DATA_GID,
  RECENTLY_PULLED_PROTECTION_MS,
  MAX_SUB_CONTAINERS,
  MAX_SUB_CONTAINER_VOLUMES,
  MAX_SUB_CONTAINER_PORTS,
  SUB_CONTAINER_NAME_REGEX,
  SUB_CONTAINER_PORT_NAME_REGEX,
  SUB_CONTAINER_MEMORY_MIN_MB,
  SUB_CONTAINER_MEMORY_MAX_MB,
  SUB_CONTAINER_MEMORY_DEFAULT_MB,
  SUB_CONTAINER_CPU_MIN,
  SUB_CONTAINER_CPU_MAX,
  SUB_CONTAINER_CPU_DEFAULT,
  SUB_CONTAINER_SHM_MIN_MB,
  SUB_CONTAINER_SHM_MAX_MB,
  SUB_CONTAINER_SHM_DEFAULT_MB,
  SUB_CONTAINER_START_MODES,
  HARDWARE_CLASSES,
  SUB_CONTAINER_PORTS_VARIABLE,
  SUB_CONTAINER_DESIRED_VARIABLE,
  SUB_CONTAINER_ENV_VARIABLE,
  INTEGRATIONS_NETWORK_NAME,
  INTEGRATIONS_NETWORK_SUBNET,
  INTEGRATIONS_NETWORK_GATEWAY,
  INTEGRATION_JWT_SECRET_VARIABLE,
  SELECTOR_PREFIX,
  DEV_SELECTOR_PREFIX,
  SUPPORTED_MANIFEST_VERSION,
  STARTUP_TIMEOUT_MS,
  CHECK_HEALTH_INTERVAL_MS,
  HEARTBEAT_TIMEOUT_MS,
  STABLE_RUNNING_RESET_MS,
  MAX_FAILURE_COUNT,
  RESTART_BACKOFF_BASE_MS,
  RESTART_BACKOFF_MAX_MS,
  WEBSOCKET_PING_INTERVAL_MS,
  MAX_MISSED_PINGS,
  COMMAND_TIMEOUT_MS,
  MESSAGE_CONNECTION_WAIT_MS,
  MAX_ACTIONS,
  ACTION_MIN_TIMEOUT_SECONDS,
  ACTION_MAX_TIMEOUT_SECONDS,
  ACTION_DEFAULT_TIMEOUT_SECONDS,
  MAX_DISCOVERED_DEVICES,
  MAX_STATES_PER_REQUEST,
  MAX_STATES_PER_MINUTE,
  CONTACT_VARIABLE,
  CONTACT_PROFILE_VARIABLE,
  LINK_CODE_CACHE_PREFIX,
  LINK_CODE_TTL_MS,
  LINK_CODE_LENGTH,
  MAX_MESSAGE_TEXT_LENGTH,
  NETWORK_DISCOVERY_TYPES,
  MAX_NETWORK_DISCOVERY_ENTRIES,
  MAX_UDP_BROADCAST_PORTS,
  MAX_ACTIVE_BROADCAST_PAYLOAD_BYTES,
  ACTIVE_BROADCAST_MIN_INTERVAL_MS,
  NETWORK_WAKE_MIN_INTERVAL_MS,
  NETWORK_DISCOVERY_MIN_TIMEOUT_SECONDS,
  NETWORK_DISCOVERY_MAX_TIMEOUT_SECONDS,
  NETWORK_DISCOVERY_DEFAULT_TIMEOUT_SECONDS,
  MAX_CAMERA_IMAGES_PER_MINUTE,
  MAX_CAMERA_IMAGE_SIZE,
  CAMERA_GET_IMAGE_TIMEOUT_MS,
  WEATHER_GET_TIMEOUT_MS,
  MAX_WEATHER_HOURS,
  MAX_WEATHER_DAYS,
  MAX_WEATHER_ALERTS,
  MAX_WEATHER_ALERT_EVENT_LENGTH,
  MAX_WEATHER_ALERT_DESCRIPTION_LENGTH,
  WEATHER_CONDITIONS,
  WEATHER_ALERT_SEVERITIES,
  WEATHER_ALERT_TYPES,
  WEATHER_REFRESH_MIN_INTERVAL_MS,
  MAX_WEATHER_IMAGES,
  WEATHER_IMAGE_KEY_REGEX,
  MAX_WEATHER_IMAGE_LABEL_LENGTH,
  MAX_WEATHER_IMAGE_BYTES,
  WEATHER_IMAGE_CACHE_TTL_MS,
  WEATHER_IMAGE_CACHE_PREFIX,
  RESERVED_PARAM_PREFIX,
  TRANSPORT_PARAM,
  DEVICE_TRANSPORTS,
  MAX_TRANSPORTS_PER_REQUEST,
  TRANSPORT_DEGRADED_PARAM,
  TRANSPORT_MESSAGE_PARAM,
  MAX_TRANSPORT_MESSAGE_LENGTH,
  MANIFEST_TRANSPORTS,
  PREFER_LOCAL_CONFIG_KEY,
  ACCOUNT_FIELD_TYPES,
  MAX_MANIFEST_CATEGORIES,
  MAX_WEBHOOKS,
  WEBHOOK_MODES,
  WEBHOOK_DEFAULT_MODE,
  OPEN_API_KEY_CONFIG_KEY,
  MAX_WEBHOOK_BODY_BYTES,
  MAX_WEBHOOK_RESPONSE_BODY_BYTES,
  WEBHOOK_RESPONSE_MIN_STATUS,
  WEBHOOK_RESPONSE_MAX_STATUS,
};
