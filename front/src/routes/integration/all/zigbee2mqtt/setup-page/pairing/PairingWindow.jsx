import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../../server/utils/constants';
import config from '../../../../../../config';
import withIntlAsProp from '../../../../../../utils/withIntlAsProp';
import { stripDeviceStatesForSave } from '../../../../../../utils/device';
import { MobileGroup, MobileRow, MobileNotice, MobilePill, BigButton } from '../../../../../../components/mobile';
import { MobileDeviceItem } from '../../../../../../components/integration/mobile';
import { getDeviceIcon } from '../../../../../../components/integration/mobile/utils';
import { PERMIT_JOIN_CONFIRM_TIMEOUT_IN_MS } from '../constants';
import { PAIRING_STATUS, getDevicePhotoUrl, suggestName, formatCountdown } from './pairingUtils';
import style from './pairing.css';

const T = 'integration.zigbee2mqtt.pairing';
const TIPS = ['approach', 'mode', 'add'];
const EDIT_URL = '/dashboard/integration/device/zigbee2mqtt/edit';
const REQUEST = { ALLOW: 'allow', STOP: 'stop' };

// The photo of a device model; the icon of its category without Internet or without known photo (D58)
class DevicePhoto extends Component {
  showIcon = () => this.setState({ failedUrl: getDevicePhotoUrl(this.props.model) });

  render({ model, device }, { failedUrl }) {
    const url = getDevicePhotoUrl(model);
    return (
      <span class={style.photo} data-cy="z2m-pairing-photo">
        {url && url !== failedUrl ? (
          <img src={url} alt="" loading="lazy" referrerpolicy="no-referrer" onError={this.showIcon} />
        ) : (
          <i class={`fe fe-${getDeviceIcon(device)}`} aria-hidden="true" />
        )}
      </span>
    );
  }
}

// Joined → Interview → Ready, each step done, running, failed or to come
const getSteps = status => {
  switch (status) {
    case PAIRING_STATUS.JOINED:
      return ['done', 'todo', 'todo'];
    case PAIRING_STATUS.INTERVIEWING:
      return ['done', 'running', 'todo'];
    case PAIRING_STATUS.READY:
      return ['done', 'done', 'done'];
    case PAIRING_STATUS.UNSUPPORTED:
      return ['done', 'done', 'warning'];
    default:
      return ['done', 'failed', 'todo'];
  }
};

// `inline` on a phone: in the row, a button or a link, which holds no list
const Timeline = ({ status, inline }) => {
  const List = inline ? 'span' : 'ol';
  const Step = inline ? 'span' : 'li';
  return (
    <List class={style.timeline} data-cy="z2m-pairing-timeline">
      {getSteps(status).map((step, index) => (
        <Step key={index} class={cx(style.timelineStep, style[`timeline-${step}`])}>
          <span class={style.timelineDot} aria-hidden="true" />
          <Text id={`${T}.steps.${['joined', 'interview', 'ready'][index]}`} />
          {/* What the dot and the colours tell, for a screen reader */}
          <span class="sr-only">
            {' '}
            <Text id={`${T}.stepStates.${step}`} />
          </span>
        </Step>
      ))}
    </List>
  );
};

/**
 * @description The pairing window (docs/specs/zigbee2mqtt-pairing.md, D): joining and its countdown, and each device
 * seen joining with where it stands, a ready one as a card to add to Gladys. Shown by step ④ of the wizard and by
 * "Pair" on the dashboard; it asks Zigbee2mqtt to permit joining when it opens.
 */
class PairingWindow extends Component {
  // Joining as Zigbee2mqtt tells it, its end computed with the clock of the browser (B.2)
  applyPermitJoin = permitJoin => {
    const allowed = Boolean(permitJoin && permitJoin.allowed);
    const remainingSeconds = allowed ? get(permitJoin, 'remainingSeconds') : null;
    const endsAt = typeof remainingSeconds === 'number' ? Date.now() + remainingSeconds * 1000 : null;
    this.setState({ allowed, endsAt, now: Date.now() });
  };

  // A message is more recent than a request still running: it is applied, the answer of the request is not. What was
  // asked happening ends the request, and clears its failure told before (a confirmation later than the 10 s). A close
  // while asked to open is not a refusal (the end of the previous window): still waited for.
  handlePermitJoin = permitJoin => {
    this.permitJoinRequests += 1;
    this.applyPermitJoin(permitJoin);
    const allowed = Boolean(permitJoin && permitJoin.allowed);
    const done = allowed ? REQUEST.ALLOW : REQUEST.STOP;
    const { request, requestError } = this.state;
    const changes = {};
    if (request === done) {
      this.stopWaiting();
      changes.request = null;
    }
    if (requestError === done) {
      changes.requestError = null;
    }
    this.setState(changes);
  };

  // Newer than the list read when the window opened, which could not be read perhaps
  handlePairing = entries => {
    this.pairingRequests += 1;
    this.setState({ loadError: false });
    this.setEntries(entries || []);
  };

  loadPermitJoin = async () => {
    this.permitJoinRequests += 1;
    const request = this.permitJoinRequests;
    try {
      const permitJoin = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/permit_join');
      if (!this.unmounted && request === this.permitJoinRequests) {
        this.applyPermitJoin(permitJoin);
      }
    } catch (e) {
      console.error('Failed to read whether joining is permitted', e);
    }
  };

  loadPairing = async () => {
    this.pairingRequests += 1;
    const request = this.pairingRequests;
    try {
      const entries = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/pairing');
      if (!this.unmounted && request === this.pairingRequests) {
        this.setState({ loadError: false });
        this.setEntries(entries);
      }
    } catch (e) {
      console.error('Failed to read the devices being paired', e);
      if (!this.unmounted && request === this.pairingRequests) {
        this.setState({ loadError: true });
      }
    }
  };

  loadHouses = async () => {
    try {
      const houses = await this.props.httpClient.get('/api/v1/house', { expand: 'rooms' });
      if (!this.unmounted) {
        this.setState({ houses });
      }
    } catch (e) {
      // The devices are then added without a room, as they can be in the Discover tab
      console.error('Failed to load the houses', e);
    }
  };

  // The names of the Zigbee2mqtt devices of Gladys: a suggested name takes none of them (D.4)
  loadTakenNames = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/device');
      if (!this.unmounted) {
        this.takenNames = devices.map(device => device.name).filter(Boolean);
        this.setState(state => this.withCards(state.entries, state.cards));
      }
    } catch (e) {
      console.error('Failed to load the Zigbee2mqtt devices', e);
    }
  };

  // A card for each ready device not in Gladys: its suggested name, kept once the user typed one or added it.
  // Added, it is told in Gladys only while the registry says so: told deleted from Gladys since (a registry received,
  // `observed`), it is to add again, under its name. Not on names rebuilt from the entries kept, which an Add does not
  // update.
  withCards = (entries, previousCards, observed = false) => {
    const dictionary = get(this.props, 'intl.dictionary');
    const cards = {};
    const names = [...this.takenNames];
    entries.forEach(entry => {
      const previous = previousCards[entry.ieee_address];
      const toAdd = entry.status === PAIRING_STATUS.READY && entry.device && entry.device.id === undefined;
      if (observed && previous && previous.added && toAdd) {
        cards[entry.ieee_address] = { ...previous, added: false, existing: false, selector: null, edited: true };
        names.push(previous.name);
      } else if (previous && (previous.added || previous.edited)) {
        cards[entry.ieee_address] = previous;
        names.push(previous.name);
      } else if (toAdd) {
        const name = suggestName(entry.device, entry, dictionary, names);
        names.push(name);
        cards[entry.ieee_address] = { roomId: '', ...previous, name };
      } else if (previous) {
        cards[entry.ieee_address] = previous;
      }
    });
    return { entries, cards };
  };

  setEntries = entries => this.setState(state => this.withCards(entries, state.cards, true));

  updateCard = (ieeeAddress, changes) =>
    this.setState(state => ({
      cards: { ...state.cards, [ieeeAddress]: { ...state.cards[ieeeAddress], ...changes } }
    }));

  updateName = ieeeAddress => e => this.updateCard(ieeeAddress, { name: e.target.value, edited: true });

  updateRoom = ieeeAddress => e => this.updateCard(ieeeAddress, { roomId: e.target.value });

  // The device as GET /pairing gives it: attached to the main electric meter, which the message does not carry (C.3).
  // Not the one of the message when it cannot be read: saved without its meter, it would stay out of the energy
  // monitoring.
  readDevice = async ieeeAddress => {
    const entries = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/pairing');
    const read = entries.find(candidate => candidate.ieee_address === ieeeAddress);
    if (!read || !read.device) {
      throw new Error(`Device ${ieeeAddress} is no longer ready to be added`);
    }
    return read.device;
  };

  // The request of the Discover tab (feature names from the dictionary, states stripped). Resolves to false when it
  // failed (the device not read again included): the phone sheet then stays open. Also false, without the toast "added",
  // for a device found already in Gladys: its row then is no longer the sheet.
  add = async entry => {
    const ieeeAddress = entry.ieee_address;
    const card = this.state.cards[ieeeAddress];
    if (!card || card.saving) {
      return false;
    }
    this.updateCard(ieeeAddress, { saving: true, error: false });
    const dictionary = get(this.props, 'intl.dictionary');
    try {
      const read = await this.readDevice(ieeeAddress);
      // Added to Gladys meanwhile (another window, the Discover tab): not saved over, told already in Gladys under the
      // name it has there
      if (read.id !== undefined) {
        if (!this.unmounted) {
          this.takenNames.push(read.name);
          this.updateCard(ieeeAddress, {
            saving: false,
            added: true,
            existing: true,
            name: read.name,
            selector: read.selector
          });
        }
        return false;
      }
      const { cards } = this.state;
      const typed = cards[ieeeAddress] || card;
      const device = {
        ...read,
        name: typed.name.trim() || entry.friendly_name,
        room_id: typed.roomId || null,
        features: (read.features || []).map(feature => {
          const featureName = get(dictionary, `deviceFeatureCategory.${feature.category}.${feature.type}`);
          return featureName ? { ...feature, name: featureName } : feature;
        })
      };
      const saved = await this.props.httpClient.post('/api/v1/device', stripDeviceStatesForSave(device));
      if (!this.unmounted) {
        this.takenNames.push(saved.name);
        this.updateCard(ieeeAddress, { saving: false, added: true, name: saved.name, selector: saved.selector });
      }
      return true;
    } catch (e) {
      console.error('Failed to add the device', e);
      if (!this.unmounted) {
        this.updateCard(ieeeAddress, { saving: false, error: true });
      }
      return false;
    }
  };

  stopWaiting = () => {
    clearTimeout(this.requestTimer);
    this.requestTimer = null;
  };

  // Zigbee2mqtt did not tell the outcome in time. A stop of joining already closed failed in nothing.
  notConfirmed = () => {
    this.requestTimer = null;
    if (this.unmounted || !this.state.request) {
      return;
    }
    const { request, allowed } = this.state;
    this.setState({ request: null, requestError: request === REQUEST.STOP && !allowed ? null : request });
  };

  // Told by Zigbee2mqtt (see handlePermitJoin), waited for from the click: its answer may come before the one of the
  // request. In the demo nothing answers: the request is enough.
  // Each click is an attempt: the answer of an earlier one (still running after its 10 s, then clicked again) touches
  // neither the timer nor the outcome of the last.
  sendPermitJoin = async value => {
    const request = value ? REQUEST.ALLOW : REQUEST.STOP;
    this.permitJoinAttempts += 1;
    const attempt = this.permitJoinAttempts;
    const isCurrent = () => !this.unmounted && attempt === this.permitJoinAttempts && this.state.request === request;
    this.joiningAsked = true;
    this.stopWaiting();
    this.requestTimer = setTimeout(this.notConfirmed, PERMIT_JOIN_CONFIRM_TIMEOUT_IN_MS);
    this.setState({ request, requestError: null });
    try {
      await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/permit_join', { value });
      if (config.demoMode && isCurrent()) {
        this.handlePermitJoin({ allowed: value, remainingSeconds: value ? 254 : null });
      }
    } catch (e) {
      console.error('Failed to change whether joining is permitted', e);
      // Not when Zigbee2mqtt told the outcome meanwhile: the answer only got lost
      if (isCurrent()) {
        this.stopWaiting();
        this.setState({ request: null, requestError: request });
      }
    }
  };

  allow = () => this.sendPermitJoin(true);

  stop = () => this.sendPermitJoin(false);

  tick = () => {
    if (this.state.allowed && this.state.endsAt !== null) {
      this.setState({ now: Date.now() });
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      // Unknown (null) until read
      allowed: null,
      endsAt: null,
      now: Date.now(),
      // The request sent ('allow' | 'stop'), until Zigbee2mqtt tells its outcome
      request: null,
      requestError: null,
      entries: [],
      loadError: false,
      // By IEEE address: { name, edited, roomId, saving, error, added, existing, selector }; existing: found already in
      // Gladys when added (added meanwhile elsewhere), not saved over
      cards: {},
      houses: []
    };
    // Number the requests: only the answer of the last one counts, and a message is more recent than any of them
    this.permitJoinRequests = 0;
    this.pairingRequests = 0;
    this.permitJoinAttempts = 0;
    this.requestTimer = null;
    this.takenNames = [];
  }

  componentDidMount() {
    const { dispatcher } = this.props.session;
    dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN, this.handlePermitJoin);
    dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PAIRING, this.handlePairing);
    this.countdownTimer = setInterval(this.tick, 1000);
    this.loadPermitJoin();
    this.loadPairing();
    this.loadHouses();
    this.loadTakenNames();
    // Opened to pair: joining asked at once
    if (this.props.online) {
      this.allow();
    }
  }

  // Opened while Zigbee2mqtt did not answer: joining asked once it does, unless the user asked something meanwhile
  componentDidUpdate(previousProps) {
    if (this.props.online && !previousProps.online && !this.joiningAsked) {
      this.allow();
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    const { dispatcher } = this.props.session;
    dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN, this.handlePermitJoin);
    dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PAIRING, this.handlePairing);
    clearInterval(this.countdownTimer);
    this.countdownTimer = null;
    this.stopWaiting();
  }

  renderHeader() {
    const { online, isMobile, brokerConnected } = this.props;
    const { allowed, endsAt, now, request, requestError } = this.state;
    const remaining = allowed && endsAt !== null ? formatCountdown((endsAt - now) / 1000) : null;
    // Gladys without its broker hears nothing of Zigbee2mqtt: the broker is said, not Zigbee2mqtt
    const brokerLost = !online && brokerConnected === false;
    let title;
    if (brokerLost) {
      title = <Text id={`${T}.brokerLost`} />;
    } else if (!online) {
      title = <Text id={`${T}.notAnswering`} />;
    } else if (allowed) {
      title = <Text id={`${T}.open`} />;
    } else {
      title = <Text id={`${T}.closed`} />;
    }
    const busy = Boolean(request);
    // On a phone, the buttons of the kit, under the state
    const buttons = isMobile
      ? [
          !allowed && (
            <BigButton
              variant="primary"
              icon="radio"
              loading={request === REQUEST.ALLOW}
              disabled={busy}
              onClick={this.allow}
              data-cy="z2m-pairing-allow"
            >
              <Text id={`${T}.allow`} />
            </BigButton>
          ),
          allowed && (
            <BigButton
              loading={request === REQUEST.ALLOW}
              disabled={busy}
              onClick={this.allow}
              data-cy="z2m-pairing-extend"
            >
              <Text id={`${T}.extend`} />
            </BigButton>
          ),
          allowed && (
            <BigButton
              variant="ghost"
              loading={request === REQUEST.STOP}
              disabled={busy}
              onClick={this.stop}
              data-cy="z2m-pairing-stop"
            >
              <Text id={`${T}.stop`} />
            </BigButton>
          )
        ]
      : [
          !allowed && (
            <button
              type="button"
              class={cx('btn btn-primary', { 'btn-loading': request === REQUEST.ALLOW })}
              onClick={this.allow}
              disabled={busy}
              data-cy="z2m-pairing-allow"
            >
              <i class="fe fe-radio mr-2" aria-hidden="true" />
              <Text id={`${T}.allow`} />
            </button>
          ),
          allowed && (
            <button
              type="button"
              class={cx('btn btn-secondary', { 'btn-loading': request === REQUEST.ALLOW })}
              onClick={this.allow}
              disabled={busy}
              data-cy="z2m-pairing-extend"
            >
              <Text id={`${T}.extend`} />
            </button>
          ),
          allowed && (
            <button
              type="button"
              class={cx('btn btn-link', { 'btn-loading': request === REQUEST.STOP })}
              onClick={this.stop}
              disabled={busy}
              data-cy="z2m-pairing-stop"
            >
              <Text id={`${T}.stop`} />
            </button>
          )
        ];
    const error = online && requestError && <Text id={`${T}.${requestError}Error`} />;
    let headerState = 'closed';
    if (brokerLost) {
      headerState = 'broker-lost';
    } else if (!online) {
      headerState = 'not-answering';
    } else if (allowed) {
      headerState = 'open';
    }
    return (
      <div>
        <div
          class={cx(style.header, { [style.headerOpen]: headerState === 'open', [style.headerMobile]: isMobile })}
          role="status"
          data-cy="z2m-pairing-header"
          data-state={headerState}
        >
          <span class={style.headerIcon} aria-hidden="true">
            <i class={`fe fe-${online ? 'radio' : 'alert-triangle'}`} />
          </span>
          <div class={style.headerText}>
            <strong>{title}</strong>
            {online && remaining && (
              <span class={style.countdown} data-cy="z2m-pairing-countdown">
                {remaining}
              </span>
            )}
          </div>
          {online && <div class={style.headerButtons}>{buttons}</div>}
        </div>
        {error &&
          (isMobile ? (
            <MobileNotice tone="danger" icon="alert-circle" role="alert" data-cy="z2m-pairing-request-error">
              {error}
            </MobileNotice>
          ) : (
            <div class="alert alert-danger mt-3" role="alert" data-cy="z2m-pairing-request-error">
              {error}
            </div>
          ))}
      </div>
    );
  }

  renderTips() {
    return (
      <ol class={style.tips} data-cy="z2m-pairing-tips">
        {TIPS.map((tip, index) => (
          <li key={tip} class={style.tip}>
            <span class={style.tipNumber}>{index + 1}</span>
            <span>
              <strong class="d-block">
                <Text id={`${T}.tips.${tip}.title`} />
              </strong>
              <span class="text-muted">
                <Text id={`${T}.tips.${tip}.text`} />
              </span>
            </span>
          </li>
        ))}
      </ol>
    );
  }

  // What stands under the timeline of a device: its card, or what happened to it
  renderOutcome(entry, card) {
    const { device, status } = entry;
    if (status === PAIRING_STATUS.FAILED) {
      return (
        <p class={style.advice} data-cy="z2m-pairing-failed">
          <Text id={`${T}.failedText`} />
        </p>
      );
    }
    if (status === PAIRING_STATUS.UNSUPPORTED) {
      return (
        <p class={style.advice} data-cy="z2m-pairing-unsupported">
          <Text id={`${T}.unsupportedText`} />
        </p>
      );
    }
    if (status !== PAIRING_STATUS.READY) {
      return null;
    }
    if (!device) {
      return (
        <p class="text-muted mb-0" data-cy="z2m-pairing-preparing">
          <Text id={`${T}.preparing`} />
        </p>
      );
    }
    const selector = card && card.added ? card.selector : device.id !== undefined && device.selector;
    if (selector || (card && card.added) || device.id !== undefined) {
      return (
        <div class={style.inGladys} data-cy="z2m-pairing-in-gladys">
          <span class="badge badge-success">
            <Text id={card && card.added && !card.existing ? `${T}.added` : `${T}.alreadyInGladys`} />
          </span>
          {selector && (
            <Link href={`${EDIT_URL}/${selector}`} data-cy="z2m-pairing-open-device">
              <Text id={`${T}.openDevice`} />
            </Link>
          )}
        </div>
      );
    }
    const id = entry.ieee_address;
    return (
      <div class={style.card} data-cy="z2m-pairing-card">
        <div class={style.cardFields}>
          <div class="form-group mb-0">
            <label class="form-label" for={`z2m-pairing-name-${id}`}>
              <Text id="integration.zigbee2mqtt.nameLabel" />
            </label>
            <Localizer>
              <input
                id={`z2m-pairing-name-${id}`}
                type="text"
                class="form-control"
                value={card.name}
                onInput={this.updateName(id)}
                placeholder={<Text id="integration.zigbee2mqtt.namePlaceholder" />}
                disabled={card.saving}
                data-cy="z2m-pairing-name"
              />
            </Localizer>
          </div>
          <div class="form-group mb-0">
            <label class="form-label" for={`z2m-pairing-room-${id}`}>
              <Text id="integration.zigbee2mqtt.roomLabel" />
            </label>
            <select
              id={`z2m-pairing-room-${id}`}
              class="form-control"
              onChange={this.updateRoom(id)}
              disabled={card.saving}
              data-cy="z2m-pairing-room"
            >
              <option value="">
                <Text id="global.emptySelectOption" />
              </option>
              {this.state.houses.map(house => (
                <optgroup label={house.name}>
                  {(house.rooms || []).map(room => (
                    <option selected={room.id === card.roomId} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <button
            type="button"
            class={cx('btn btn-success', { 'btn-loading': card.saving })}
            onClick={() => this.add(entry)}
            disabled={card.saving}
            data-cy="z2m-pairing-add"
          >
            <Text id={`${T}.add`} />
          </button>
        </div>
        {card.error && (
          <div class="alert alert-danger mt-3 mb-0" role="alert" data-cy="z2m-pairing-add-error">
            <Text id={`${T}.addError`} />
          </div>
        )}
      </div>
    );
  }

  // The name of a device in its row: its card name once ready, the name Zigbee2mqtt gave it otherwise
  getTitle = (entry, card) => (card && card.name) || get(entry, 'device.name') || entry.friendly_name;

  // Not supported, its description is the one Zigbee2mqtt generates ("Automatically generated definition"): its model
  // tells more
  getSubtitle = entry => {
    const model = [entry.vendor, entry.model].filter(Boolean).join(' ') || null;
    return entry.status === PAIRING_STATUS.UNSUPPORTED ? model : entry.description || model;
  };

  renderDesktopRow = entry => {
    const card = this.state.cards[entry.ieee_address];
    const subtitle = this.getSubtitle(entry);
    return (
      <li key={entry.ieee_address} class={style.row} data-cy="z2m-pairing-row" data-status={entry.status}>
        <DevicePhoto model={entry.model} device={entry.device} />
        <div class={style.rowMain}>
          <div class={style.rowTitle}>
            <strong>{this.getTitle(entry, card)}</strong>
            {subtitle && <span class="text-muted">{subtitle}</span>}
          </div>
          <Timeline status={entry.status} />
          {this.renderOutcome(entry, card)}
        </div>
      </li>
    );
  };

  // On a phone, a ready device is the row and the sheet of the Discover tab (D.2); the others are plain rows
  renderMobileRow = entry => {
    const card = this.state.cards[entry.ieee_address];
    const { device, status } = entry;
    const timeline = <Timeline status={status} inline />;
    if (status === PAIRING_STATUS.READY && device && device.id === undefined && card && !card.added) {
      return (
        <MobileDeviceItem
          key={entry.ieee_address}
          device={{ ...device, name: card.name, room_id: card.roomId || null }}
          houses={this.state.houses}
          subtitle={this.getSubtitle(entry)}
          pills={timeline}
          notices={
            <div class={style.sheetPhoto}>
              <DevicePhoto model={entry.model} device={device} />
            </div>
          }
          onNameChange={this.updateName(entry.ieee_address)}
          onRoomChange={this.updateRoom(entry.ieee_address)}
          namePlaceholderId="integration.zigbee2mqtt.namePlaceholder"
          guard={false}
          showFeatures
          saveError={card.error && <Text id={`${T}.addError`} />}
          primaryAction={{
            label: <Text id={`${T}.add`} />,
            onClick: () => this.add(entry),
            toast: <Text id="mobileDeviceList.added" />,
            dataCy: 'z2m-pairing-add'
          }}
          dataCy="z2m-pairing-row"
        />
      );
    }
    const selector = card && card.added ? card.selector : device && device.id !== undefined && device.selector;
    return (
      <MobileRow
        key={entry.ieee_address}
        icon={getDeviceIcon(device)}
        title={this.getTitle(entry, card)}
        subtitle={this.renderMobileOutcome(entry, card)}
        meta={timeline}
        href={selector ? `${EDIT_URL}/${selector}` : undefined}
        dataCy="z2m-pairing-row"
        data-status={status}
      />
    );
  };

  renderMobileOutcome(entry, card) {
    const { status, device } = entry;
    if (status === PAIRING_STATUS.FAILED) {
      return <Text id={`${T}.failedText`} />;
    }
    if (status === PAIRING_STATUS.UNSUPPORTED) {
      return <Text id={`${T}.unsupportedText`} />;
    }
    if (status !== PAIRING_STATUS.READY) {
      return this.getSubtitle(entry);
    }
    if (!device) {
      return <Text id={`${T}.preparing`} />;
    }
    return (
      <MobilePill tone="success" data-cy="z2m-pairing-in-gladys">
        <Text id={card && card.added && !card.existing ? `${T}.added` : `${T}.alreadyInGladys`} />
      </MobilePill>
    );
  }

  render({ isMobile, online }, { entries, loadError }) {
    const empty = entries.length === 0;
    return (
      <div class={style.pairing} data-cy="z2m-pairing">
        {this.renderHeader()}
        {loadError && (
          <div class="alert alert-warning mt-3" role="alert" data-cy="z2m-pairing-load-error">
            <Text id={`${T}.loadError`} />
          </div>
        )}
        {empty && online && this.renderTips()}
        {!empty &&
          (isMobile ? (
            <MobileGroup class={style.mobileList}>{entries.map(this.renderMobileRow)}</MobileGroup>
          ) : (
            <ul class={style.rows}>{entries.map(this.renderDesktopRow)}</ul>
          ))}
      </div>
    );
  }
}

export default withIntlAsProp(PairingWindow);
