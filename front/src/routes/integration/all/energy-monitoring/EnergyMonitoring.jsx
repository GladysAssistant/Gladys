import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { route } from 'preact-router';
import cx from 'classnames';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import ImportPricesPage from './ImportPrices';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

const DEVICE_FEATURE_CATEGORIES_TO_DISPLAY = [
  DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  DEVICE_FEATURE_CATEGORIES.SWITCH
];

const DEVICE_FEATURE_TYPES_TO_DISPLAY = [
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
  DEVICE_FEATURE_TYPES.SWITCH.ENERGY
];

class EnergyMonitoringPage extends Component {
  state = {
    devices: [],
    loadingDevices: false,
    error: null,
    // Prices state
    prices: [],
    loadingPrices: false,
    priceError: null,
    // Settings state
    calculatingFromBeginning: false,
    calculatingConsumptionFromBeginning: false,
    settingsSuccess: null,
    settingsError: null,
    consumptionSettingsSuccess: null,
    consumptionSettingsError: null,
    // UI state for collapsible price items
    expandedPriceIds: new Set(),
    // Wizard state
    wizardEditingId: null,
    wizardStep: 0,
    wizardHourSlots: new Set(),
    newPrice: {
      contract: 'base',
      price_type: 'consumption',
      currency: 'euro',
      start_date: '',
      end_date: '',
      electric_meter_device_id: '',
      day_type: 'any',
      price: '',
      hour_slots: '',
      subscribed_power: ''
    }
  };

  // ----- TIME SLOT HELPERS -----
  slotIndexToLabel = slot => {
    if (!Number.isInteger(slot) || slot < 0 || slot > 47) return '';
    const hour = Math.floor(slot / 2);
    const minutes = slot % 2 === 1 ? '30' : '00';
    const hh = hour < 10 ? `0${hour}` : `${hour}`;
    return `${hh}:${minutes}`;
  };

  labelToSlotIndex = label => {
    if (!label) return null;
    const s = String(label).trim();
    // Legacy numeric formats
    if (/^\d{1,2}$/.test(s)) {
      const n = parseInt(s, 10);
      if (Number.isInteger(n)) {
        if (n >= 0 && n <= 23) return n * 2; // map legacy hour to HH:00 slot
        if (n >= 0 && n <= 47) return n; // if someone already stored half-hour index
      }
      return null;
    }
    // HH:MM format
    const m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const hour = parseInt(m[1], 10);
    const minutes = parseInt(m[2], 10);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
    if (minutes !== 0 && minutes !== 30) return null;
    return hour * 2 + (minutes === 30 ? 1 : 0);
  };

  parseHourSlotsToSet = raw => {
    const set = new Set();
    if (!raw) return set;
    const parts = String(raw)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    parts.forEach(p => {
      const idx = this.labelToSlotIndex(p);
      if (idx !== null) set.add(idx);
    });
    return set;
  };

  formatSetToHourSlots = set => {
    const arr = Array.from(set || []).filter(n => Number.isInteger(n));
    arr.sort((a, b) => a - b);
    return arr.map(this.slotIndexToLabel).join(',');
  };

  calculateFromBeginning = async () => {
    try {
      this.setState({ calculatingFromBeginning: true, settingsError: null, settingsSuccess: null });
      await this.props.httpClient.post('/api/v1/service/energy-monitoring/calculate-cost-from-beginning', {});
      this.setState({ settingsSuccess: 'ok' });
      // Redirect to jobs page
      route('/dashboard/settings/jobs');
    } catch (e) {
      this.setState({ settingsError: e });
    } finally {
      this.setState({ calculatingFromBeginning: false });
    }
  };

  calculateConsumptionFromIndexFromBeginning = async () => {
    try {
      this.setState({
        calculatingConsumptionFromBeginning: true,
        consumptionSettingsError: null,
        consumptionSettingsSuccess: null
      });
      await this.props.httpClient.post(
        '/api/v1/service/energy-monitoring/calculate-consumption-from-index-from-beginning',
        {}
      );
      this.setState({ consumptionSettingsSuccess: 'ok' });
      // Redirect to jobs page
      route('/dashboard/settings/jobs');
    } catch (e) {
      this.setState({ consumptionSettingsError: e });
    } finally {
      this.setState({ calculatingConsumptionFromBeginning: false });
    }
  };

  componentDidMount() {
    this.loadDevices();
    // Preload prices if in prices tab
    if (this.isPricesRoute()) {
      this.loadPrices();
    }
  }

  componentDidUpdate() {
    // Load prices when navigating to the prices tab
    const wasPricesRoute = this.isPricesRoute();
    if (wasPricesRoute && !this.wasPricesRouteLastUpdate) {
      this.loadPrices();
    }
    this.wasPricesRouteLastUpdate = wasPricesRoute;
  }

  // ----- ROUTE HELPERS -----
  isPricesRoute() {
    const path = (typeof window !== 'undefined' && window.location && window.location.pathname) || '';
    return path.startsWith('/dashboard/integration/device/energy-monitoring') && path.includes('/prices');
  }

  isCreatePriceRoute() {
    const path = (typeof window !== 'undefined' && window.location && window.location.pathname) || '';
    return path.includes('/prices/create');
  }

  isEditPriceRoute() {
    const path = (typeof window !== 'undefined' && window.location && window.location.pathname) || '';
    return path.includes('/prices/edit');
  }

  isSettingsRoute() {
    const path = (typeof window !== 'undefined' && window.location && window.location.pathname) || '';
    return path.startsWith('/dashboard/integration/device/energy-monitoring') && path.includes('/settings');
  }

  isImportPricesRoute() {
    const path = (typeof window !== 'undefined' && window.location && window.location.pathname) || '';
    return path.includes('/prices/import');
  }

  // ----- PRICES DATA -----
  async loadPrices() {
    try {
      this.setState({ loadingPrices: true });
      const result = await this.props.httpClient.get('/api/v1/energy_price', {});
      const prices = Array.isArray(result) ? result : [];
      this.setState({ prices, priceError: null });
    } catch (e) {
      this.setState({ priceError: e, prices: [] });
    } finally {
      this.setState({ loadingPrices: false });
    }
  }

  // ----- UI ACTIONS -----
  startCreatePrice = () => {
    this.setState({
      wizardEditingId: null,
      wizardStep: 0,
      wizardHourSlots: new Set(),
      newPrice: { ...this.state.newPrice, hour_slots: '' }
    });
    route('/dashboard/integration/device/energy-monitoring/prices/create');
  };

  startImportPrices = () => {
    route('/dashboard/integration/device/energy-monitoring/prices/import');
  };

  startEditPrice = price => {
    const p = price && price.id ? price : (this.state.prices || []).find(x => x.id === price);
    if (p) {
      // Parse hour slots (supports legacy numeric formats and HH:MM)
      const slots = this.parseHourSlotsToSet(p.hour_slots || '');
      this.setState({
        wizardEditingId: p.id,
        wizardStep: 0,
        wizardHourSlots: slots,
        newPrice: {
          contract: p.contract || 'base',
          price_type: p.price_type || 'consumption',
          currency: p.currency || 'euro',
          start_date: p.start_date || '',
          end_date: p.end_date || '',
          electric_meter_device_id: p.electric_meter_device_id || '',
          day_type: p.day_type || 'any',
          price: p.price != null && p.price !== '' ? p.price / 10000 : '',
          hour_slots: p.hour_slots || '',
          subscribed_power: p.subscribed_power || ''
        }
      });
    }
    route(`/dashboard/integration/device/energy-monitoring/prices/edit/${p ? p.id : ''}`);
  };

  togglePriceExpanded = id => {
    this.setState(({ expandedPriceIds }) => {
      const next = new Set(expandedPriceIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedPriceIds: next };
    });
  };

  deletePrice = async id => {
    try {
      const item = (this.state.prices || []).find(p => p.id === id);
      const selector = item && item.selector;
      if (!selector) throw new Error('Missing selector for price.');
      await this.props.httpClient.delete(`/api/v1/energy_price/${selector}`);
      await this.loadPrices();
    } catch (e) {
      this.setState({ priceError: e });
    }
  };

  savePrice = async () => {
    try {
      const payload = { ...this.state.newPrice };
      // Save hour slots from wizardHourSlots as comma-separated HH:MM string
      if (this.state.wizardHourSlots && this.state.wizardHourSlots.size > 0) {
        payload.hour_slots = this.formatSetToHourSlots(this.state.wizardHourSlots);
      }
      // Convert empty end_date to null
      if (payload.end_date === '' || payload.end_date === 'Invalid date') {
        payload.end_date = null;
      }
      // Scale price to integer with 4 decimals (x10000) before saving
      if (payload.price !== undefined && payload.price !== null && payload.price !== '') {
        const n = Number(payload.price);
        if (Number.isFinite(n)) {
          payload.price = Math.round(n * 10000);
        } else {
          delete payload.price;
        }
      } else {
        delete payload.price;
      }
      if (this.state.wizardEditingId) {
        const existing = (this.state.prices || []).find(p => p.id === this.state.wizardEditingId);
        if (!existing || !existing.selector) throw new Error('Missing selector for update.');
        await this.props.httpClient.patch(`/api/v1/energy_price/${existing.selector}`, payload);
      } else {
        await this.props.httpClient.post('/api/v1/energy_price', payload);
      }
      route('/dashboard/integration/device/energy-monitoring/prices');
      await this.loadPrices();
    } catch (e) {
      this.setState({ priceError: e });
    }
  };

  async loadDevices() {
    try {
      this.setState({ loadingDevices: true });
      const result = await this.props.httpClient.get('/api/v1/device', {});
      this.setState({ devices: Array.isArray(result) ? result : [], error: null });
    } catch (e) {
      this.setState({ error: e });
    } finally {
      this.setState({ loadingDevices: false });
    }
  }

  getAllFeatures() {
    const flat = [];
    const { devices } = this.state;
    devices.forEach(device => {
      (device.features || [])
        .filter(
          feature =>
            feature &&
            DEVICE_FEATURE_CATEGORIES_TO_DISPLAY.includes(feature.category) &&
            DEVICE_FEATURE_TYPES_TO_DISPLAY.includes(feature.type)
        )
        .forEach(feature => {
          flat.push({ ...feature, __device: device });
        });
    });
    return flat;
  }

  getTree() {
    const allFeatures = this.getAllFeatures();
    const children = new Map();
    allFeatures.forEach(f => {
      children.set(f.id, []);
    });
    const rootFeatures = [];
    allFeatures.forEach(f => {
      const parentId = f.energy_parent_id || null;
      if (parentId && children.has(parentId)) {
        children.get(parentId).push(f);
      } else {
        rootFeatures.push(f);
      }
    });
    return { rootFeatures, childrenById: children, allFeatures };
  }

  async setParentLocal(featureId, newParentId) {
    const { allFeatures } = this.getTree();
    const feature = allFeatures.find(f => f.id === featureId);
    const selector = feature && feature.selector;
    const previousParentId = feature ? feature.energy_parent_id || null : null;

    // optimistic update
    this.setState(({ devices }) => ({
      devices: devices.map(d => ({
        ...d,
        features: (d.features || []).map(f =>
          f.id === featureId ? { ...f, energy_parent_id: newParentId || null } : f
        )
      }))
    }));

    if (selector) {
      try {
        await this.props.httpClient.patch(`/api/v1/device_feature/${selector}`, {
          energy_parent_id: newParentId || null
        });
      } catch (e) {
        // rollback on error
        this.setState(({ devices }) => ({
          devices: devices.map(d => ({
            ...d,
            features: (d.features || []).map(f =>
              f.id === featureId ? { ...f, energy_parent_id: previousParentId } : f
            )
          })),
          error: e
        }));
      }
    }
  }

  render(props, state) {
    const { rootFeatures, childrenById, allFeatures } = this.getTree();
    const { loadingDevices, error } = state;

    const getDescendantIds = id => {
      const stack = [id];
      const visited = new Set();
      visited.add(id);
      const result = new Set();
      while (stack.length) {
        const current = stack.pop();
        const children = childrenById.get(current) || [];
        children.forEach(c => {
          if (!visited.has(c.id)) {
            visited.add(c.id);
            result.add(c.id);
            stack.push(c.id);
          }
        });
      }
      return result;
    };

    const renderFeature = (feature, depth = 0) => {
      const paddingLeft = depth > 0 ? 8 + Math.min(depth, 2) * 12 : 0;
      const label = `${feature.__device ? feature.__device.name : ''} - ${feature.name ||
        feature.selector ||
        feature.id}`;
      const levelColors = ['#5c7cfa', '#40c057', '#fab005', '#fa5252', '#12b886', '#7950f2'];
      const color = levelColors[depth % levelColors.length];
      const descendantIds = getDescendantIds(feature.id);
      return (
        <div class="mb-2" style={{ paddingLeft: `${paddingLeft}px` }}>
          <div class="card shadow-sm" style={{ borderLeft: `4px solid ${color}`, borderRadius: '6px' }}>
            <div class="card-body py-2 px-2 px-md-3">
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center">
                <div class="flex-grow-1 w-100 w-md-auto mb-2 mb-md-0">
                  <div class="d-flex align-items-center flex-wrap">
                    <span class="badge mr-2 mb-1" style={{ background: color, color: '#fff' }}>
                      <Text id="integration.energyMonitoring.level" fields={{ depth }} />
                    </span>
                    <strong class="mb-1">{label}</strong>
                  </div>
                  <div class="small text-muted mt-1" style={{ wordBreak: 'break-all' }}>
                    {feature.selector}
                  </div>
                </div>
                <div class="w-100 w-md-auto mt-2 mt-md-0 ml-md-3" style={{ minWidth: '0', maxWidth: '100%' }}>
                  <select
                    class="form-control form-control-sm w-100"
                    style={{ minWidth: '200px' }}
                    value={feature.energy_parent_id || ''}
                    onChange={e => this.setParentLocal(feature.id, e.target.value || null)}
                  >
                    <option value="">
                      <Text id="integration.energyMonitoring.rootNotParent" />
                    </option>
                    {allFeatures
                      .filter(f => f.id !== feature.id && !descendantIds.has(f.id))
                      .map(f => (
                        <option key={f.id} value={f.id}>
                          {(f.__device ? `${f.__device.name} - ` : '') + (f.name || f.selector || f.id)}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          {(childrenById.get(feature.id) || []).map(child => (
            <div key={`${feature.id}-${child.id}`}>{renderFeature(child, depth + 1)}</div>
          ))}
        </div>
      );
    };

    const renderPricesHeader = (withButton = true) => (
      <>
        <h1 class="card-title">
          <Text id="integration.energyMonitoring.energyPriceTab" />
        </h1>
        {withButton && (
          <div class="page-options d-flex">
            <button class="btn btn-outline-secondary ml-2" onClick={this.startImportPrices}>
              <Text id="integration.energyMonitoring.importPrices" defaultMessage="Import" />{' '}
              <i class="fe fe-download" />
            </button>
            <button class="btn btn-outline-primary ml-2" onClick={this.startCreatePrice}>
              <Text id="global.create" defaultMessage="Create" /> <i class="fe fe-plus" />
            </button>
          </div>
        )}
      </>
    );

    const renderPriceRow = p => {
      const expanded = state.expandedPriceIds.has(p.id);
      const fmt = d => (d && d !== 'Invalid date' ? d : '');
      const dates = [fmt(p.start_date), fmt(p.end_date)].filter(Boolean);
      const period = dates.join(' → ');
      const formatStoredSlots = value => {
        if (!value) return '';
        const s = String(value);
        if (s.includes(':')) return s; // already HH:MM list
        // Legacy numeric list
        const set = this.parseHourSlotsToSet(s);
        return this.formatSetToHourSlots(set);
      };
      return (
        <div class="card mb-2" key={p.id}>
          <div class="card-body py-2 px-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <strong>
                  <Text id={`integration.energyMonitoring.contractTypes.${p.contract}`} defaultMessage={p.contract} />
                </strong>
                {' · '}
                <Text id={`integration.energyMonitoring.priceTypes.${p.price_type}`} defaultMessage={p.price_type} />
                {' · '}
                <Text id={`integration.energyMonitoring.currencies.${p.currency}`} defaultMessage={p.currency} />
                {p.day_type && p.day_type !== 'any' && (
                  <>
                    {' · '}
                    <Text
                      id={`integration.energyMonitoring.dayTypeOptions.${p.day_type}`}
                      defaultMessage={p.day_type}
                    />
                  </>
                )}
                <div class="small text-muted">{period}</div>
              </div>
              <div>
                <button class="btn btn-sm btn-link" onClick={() => this.togglePriceExpanded(p.id)}>
                  {expanded ? (
                    <Text id="global.collapse" defaultMessage="Collapse" />
                  ) : (
                    <Text id="global.expand" defaultMessage="Expand" />
                  )}
                </button>
                <button class="btn btn-sm btn-secondary ml-2" onClick={() => this.startEditPrice(p)}>
                  <Text id="global.edit" defaultMessage="Edit" />
                </button>
                <button class="btn btn-sm btn-danger ml-2" onClick={() => this.deletePrice(p.id)}>
                  <Text id="global.delete" defaultMessage="Delete" />
                </button>
              </div>
            </div>
            {expanded && (
              <div class="mt-3">
                <div class="mb-2">
                  <strong>
                    <Text id="global.price" defaultMessage="Price" />:
                  </strong>{' '}
                  {p.price != null && p.price !== '' ? (p.price / 10000).toFixed(4) : '-'}
                </div>
                <div class="mb-2">
                  <strong>
                    <Text id="integration.energyMonitoring.dayType" />:
                  </strong>{' '}
                  {p.day_type ? (
                    <Text
                      id={`integration.energyMonitoring.dayTypeOptions.${p.day_type}`}
                      defaultMessage={p.day_type}
                    />
                  ) : (
                    '-'
                  )}
                </div>
                <div class="mb-2">
                  <strong>
                    <Text id="integration.energyMonitoring.subscribedPower" />:
                  </strong>{' '}
                  {p.subscribed_power || '-'}
                </div>
                <div class="mb-2">
                  <strong>
                    <Text id="integration.energyMonitoring.hourSlots" />:
                  </strong>{' '}
                  {formatStoredSlots(p.hour_slots) || '-'}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    const updateNewPrice = patch => this.setState(({ newPrice }) => ({ newPrice: { ...newPrice, ...patch } }));

    const renderWizard = () => (
      <div>
        <div class="mb-4 d-flex align-items-center justify-content-between">
          <div>{renderPricesHeader(false)}</div>
          <div class="text-muted small">
            {state.wizardEditingId ? (
              <span>
                <i class="fe fe-edit mr-1" /> <Text id="global.edit" defaultMessage="Edit" />
              </span>
            ) : (
              <span>
                <i class="fe fe-plus mr-1" /> <Text id="global.create" defaultMessage="Create" />
              </span>
            )}
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="mb-4">
              <div class="d-flex align-items-center">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    class={cx('mr-3 d-flex align-items-center', i === state.wizardStep ? 'text-primary' : 'text-muted')}
                    style={{ cursor: 'pointer' }}
                    onClick={() => this.setState({ wizardStep: i })}
                  >
                    <span class={cx('badge mr-2', i === state.wizardStep ? 'badge-primary' : 'badge-secondary')}>
                      {i + 1}
                    </span>
                    <span>
                      {i === 0 ? (
                        <Text id="integration.energyMonitoring.wizard.basics" />
                      ) : i === 1 ? (
                        <Text id="integration.energyMonitoring.wizard.periodScope" />
                      ) : (
                        <Text id="integration.energyMonitoring.wizard.priceAndSlots" />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {state.wizardStep === 0 && (
              <div>
                <h5 class="mb-3">
                  <Text id="integration.energyMonitoring.wizard.basics" />
                </h5>
                <div class="row">
                  <div class="col-md-4">
                    <div class="form-group">
                      <label>
                        <Text id="integration.energyMonitoring.contract" />
                      </label>
                      <select
                        class="form-control"
                        value={state.newPrice.contract}
                        onChange={e => updateNewPrice({ contract: e.target.value })}
                      >
                        <option value="base">
                          <Text id="integration.energyMonitoring.contractTypes.base" />
                        </option>
                        <option value="peak-off-peak">
                          <Text id="integration.energyMonitoring.contractTypes.peak-off-peak" />
                        </option>
                        <option value="edf-tempo">
                          <Text id="integration.energyMonitoring.contractTypes.edf-tempo" />
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="form-group">
                      <label>
                        <Text id="integration.energyMonitoring.priceType" />
                      </label>
                      <select
                        class="form-control"
                        value={state.newPrice.price_type}
                        onChange={e => updateNewPrice({ price_type: e.target.value })}
                      >
                        <option value="consumption">
                          <Text id="integration.energyMonitoring.priceTypes.consumption" />
                        </option>
                        <option value="subscription">
                          <Text id="integration.energyMonitoring.priceTypes.subscription" />
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="form-group">
                      <label>
                        <Text id="integration.energyMonitoring.currency" />
                      </label>
                      <select
                        class="form-control"
                        value={state.newPrice.currency}
                        onChange={e => updateNewPrice({ currency: e.target.value })}
                      >
                        <option value="euro">
                          <Text id="integration.energyMonitoring.currencies.euro" />
                        </option>
                        <option value="dollar">
                          <Text id="integration.energyMonitoring.currencies.dollar" />
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {state.wizardStep === 1 && (
              <div>
                <h5 class="mb-3">
                  <Text id="integration.energyMonitoring.wizard.periodScope" />
                </h5>
                <p class="text-muted mb-3">
                  <Text
                    id="integration.energyMonitoring.selectElectricMeterDescription"
                    defaultMessage="You can either use an existing electric meter from another integration (e.g., Enedis), or automatically create a new electric meter here."
                  />
                </p>
                <div class="row">
                  <div class="col-md-3">
                    <div class="form-group">
                      <label>
                        <Text id="integration.energyMonitoring.startDate" />
                      </label>
                      <input
                        type="date"
                        class="form-control"
                        value={state.newPrice.start_date}
                        onChange={e => updateNewPrice({ start_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="form-group">
                      <label>
                        <Text id="integration.energyMonitoring.endDate" />
                      </label>
                      <input
                        type="date"
                        class="form-control"
                        value={state.newPrice.end_date || ''}
                        onChange={e => updateNewPrice({ end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="form-group">
                      <label>
                        <Text id="integration.energyMonitoring.dayType" />
                      </label>
                      <select
                        class="form-control"
                        value={state.newPrice.day_type}
                        onChange={e => updateNewPrice({ day_type: e.target.value })}
                      >
                        <option value="any">
                          <Text id="integration.energyMonitoring.dayTypeOptions.any" />
                        </option>
                        <option value="red">
                          <Text id="integration.energyMonitoring.dayTypeOptions.red" />
                        </option>
                        <option value="white">
                          <Text id="integration.energyMonitoring.dayTypeOptions.white" />
                        </option>
                        <option value="blue">
                          <Text id="integration.energyMonitoring.dayTypeOptions.blue" />
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="form-group">
                      <label>
                        <Text id="integration.energyMonitoring.electricMeter" />
                      </label>
                      <select
                        class="form-control"
                        value={state.newPrice.electric_meter_device_id || ''}
                        onChange={e => updateNewPrice({ electric_meter_device_id: e.target.value })}
                      >
                        <option value="">—</option>
                        {state.devices
                          .filter(
                            d => Array.isArray(d.features) && d.features.some(f => f && f.category === 'energy-sensor')
                          )
                          .map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name || d.selector || d.id}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div class="text-muted small">
                  <Text id="integration.energyMonitoring.leaveEndDateEmpty" />
                </div>
              </div>
            )}
            {state.wizardStep === 2 && (
              <div>
                <h5 class="mb-3">
                  <Text id="integration.energyMonitoring.priceAndTimeSlots" />
                </h5>
                <div class="row">
                  <div class="col-12 col-md-6">
                    <div class="form-group">
                      <label>
                        <Text id="integration.energyMonitoring.price" />
                      </label>
                      <input
                        type="number"
                        class="form-control"
                        value={state.newPrice.price}
                        onChange={e => updateNewPrice({ price: e.target.valueAsNumber || e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-12">
                    <div class="form-group">
                      <label>
                        <Text id="integration.energyMonitoring.hourSlots" />
                      </label>
                      <div class="mb-2 d-flex justify-content-between align-items-center">
                        <div class="small text-muted">
                          <Text id="integration.energyMonitoring.selectHoursHelp" />
                        </div>
                        <div>
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary mr-2"
                            onClick={() =>
                              this.setState({ wizardHourSlots: new Set(Array.from({ length: 24 }, (_, i) => i + 16)) })
                            }
                          >
                            <Text id="integration.energyMonitoring.daytime820" />
                          </button>
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            onClick={() => this.setState({ wizardHourSlots: new Set() })}
                          >
                            <Text id="integration.energyMonitoring.clear" />
                          </button>
                        </div>
                      </div>
                      <div class="row">
                        {Array.from({ length: 48 }, (_, slot) => (
                          <div class="col-3 col-sm-2 mb-2" key={slot}>
                            <button
                              type="button"
                              class={cx(
                                'btn btn-sm btn-block text-center py-2 text-nowrap',
                                state.wizardHourSlots.has(slot) ? 'btn-primary' : 'btn-outline-secondary'
                              )}
                              onClick={() =>
                                this.setState(({ wizardHourSlots }) => {
                                  const next = new Set(wizardHourSlots);
                                  if (next.has(slot)) next.delete(slot);
                                  else next.add(slot);
                                  return { wizardHourSlots: next };
                                })
                              }
                            >
                              {(() => {
                                const hour = Math.floor(slot / 2);
                                const m = slot % 2 === 1 ? '30' : '00';
                                const hh = hour < 10 ? `0${hour}` : `${hour}`;
                                return <span class="text-monospace font-weight-bold">{`${hh}:${m}`}</span>;
                              })()}
                            </button>
                          </div>
                        ))}
                      </div>
                      <div class="small text-muted mt-2">
                        <Text id="integration.energyMonitoring.selected" />{' '}
                        {(() => {
                          const arr = Array.from(state.wizardHourSlots).sort((a, b) => a - b);
                          if (!arr.length) return <Text id="integration.energyMonitoring.none" />;
                          const toLabel = slot => {
                            const hour = Math.floor(slot / 2);
                            const m = slot % 2 === 1 ? '30' : '00';
                            const hh = hour < 10 ? `0${hour}` : `${hour}`;
                            return `${hh}:${m}`;
                          };
                          return arr.map(toLabel).join(', ');
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-12 col-md-6">
                    <div class="form-group">
                      <label>
                        <Text id="integration.energyMonitoring.subscribedPower" />
                      </label>
                      <input
                        type="text"
                        class="form-control"
                        value={state.newPrice.subscribed_power || ''}
                        onChange={e => updateNewPrice({ subscribed_power: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div class="border-top pt-3 mt-3 mb-4">
                  <div class="small text-muted mb-2">
                    <Text id="integration.energyMonitoring.summary" />
                  </div>
                  <div class="row">
                    <div class="col-md-6">
                      <div>
                        <strong>
                          <Text id="integration.energyMonitoring.contract" />:
                        </strong>{' '}
                        <Text
                          id={`integration.energyMonitoring.contractTypes.${state.newPrice.contract}`}
                          defaultMessage={state.newPrice.contract}
                        />
                      </div>
                      <div>
                        <strong>
                          <Text id="integration.energyMonitoring.type" />:
                        </strong>{' '}
                        <Text
                          id={`integration.energyMonitoring.priceTypes.${state.newPrice.price_type}`}
                          defaultMessage={state.newPrice.price_type}
                        />
                      </div>
                      <div>
                        <strong>
                          <Text id="integration.energyMonitoring.currency" />:
                        </strong>{' '}
                        <Text
                          id={`integration.energyMonitoring.currencies.${state.newPrice.currency}`}
                          defaultMessage={state.newPrice.currency}
                        />
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div>
                        <strong>
                          <Text id="integration.energyMonitoring.period" />:
                        </strong>{' '}
                        {(state.newPrice.start_date || '') +
                          (state.newPrice.end_date ? ` → ${state.newPrice.end_date}` : '')}
                      </div>
                      <div>
                        <strong>
                          <Text id="integration.energyMonitoring.dayType" />:
                        </strong>{' '}
                        {state.newPrice.day_type ? (
                          <Text
                            id={`integration.energyMonitoring.dayTypeOptions.${state.newPrice.day_type}`}
                            defaultMessage={state.newPrice.day_type}
                          />
                        ) : (
                          '-'
                        )}
                      </div>
                      <div>
                        <strong>
                          <Text id="integration.energyMonitoring.slots" />:
                        </strong>{' '}
                        {(() => {
                          const arr = Array.from(state.wizardHourSlots).sort((a, b) => a - b);
                          const toLabel = slot => {
                            const hour = Math.floor(slot / 2);
                            const m = slot % 2 === 1 ? '30' : '00';
                            const hh = hour < 10 ? `0${hour}` : `${hour}`;
                            return `${hh}:${m}`;
                          };
                          return arr.length ? arr.map(toLabel).join(', ') : state.newPrice.hour_slots || '-';
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div class="d-flex justify-content-between">
              <div>
                <button
                  class="btn btn-link"
                  onClick={() => route('/dashboard/integration/device/energy-monitoring/prices')}
                >
                  <Text id="global.cancel" defaultMessage="Cancel" />
                </button>
              </div>
              <div>
                {state.wizardStep > 0 && (
                  <button
                    class="btn btn-secondary mr-2"
                    onClick={() => this.setState({ wizardStep: state.wizardStep - 1 })}
                  >
                    <Text id="global.back" defaultMessage="Back" />
                  </button>
                )}
                {state.wizardStep < 2 && (
                  <button class="btn btn-primary" onClick={() => this.setState({ wizardStep: state.wizardStep + 1 })}>
                    <Text id="global.next" defaultMessage="Next" />
                  </button>
                )}
                {state.wizardStep === 2 && (
                  <button class="btn btn-success" onClick={this.savePrice}>
                    <Text id="global.save" defaultMessage="Save" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    const renderSettings = () => (
      <div>
        <div class="card">
          <div class="card-header">
            <h1 class="card-title">
              <Text id="integration.energyMonitoring.settings" defaultMessage="Settings" />
            </h1>
          </div>
          <div class="card-body">
            {state.settingsError && (
              <div class="alert alert-danger" role="alert">
                <Text
                  id="integration.energyMonitoring.calculateFromBeginningError"
                  defaultMessage="An error occurred while starting the calculation."
                />
              </div>
            )}
            {state.settingsSuccess && (
              <div class="alert alert-success" role="alert">
                <Text
                  id="integration.energyMonitoring.calculateFromBeginningStarted"
                  defaultMessage="Calculation started. You can follow progress in Jobs."
                />
              </div>
            )}
            {state.consumptionSettingsError && (
              <div class="alert alert-danger" role="alert">
                <Text
                  id="integration.energyMonitoring.calculateConsumptionFromBeginningError"
                  defaultMessage="An error occurred while starting the consumption calculation."
                />
              </div>
            )}
            {state.consumptionSettingsSuccess && (
              <div class="alert alert-success" role="alert">
                <Text
                  id="integration.energyMonitoring.calculateConsumptionFromBeginningStarted"
                  defaultMessage="Consumption calculation started. You can follow progress in Jobs."
                />
              </div>
            )}
            <div class="mb-4">
              <p class="text-muted">
                <Text
                  id="integration.energyMonitoring.calculateConsumptionFromIndexDescription"
                  defaultMessage="This will calculate the energy consumption (in kWh) from your energy meter index readings. Use this if you have index data and want to compute the actual consumption between readings."
                />
              </p>
              <p>
                <button
                  class="btn btn-primary"
                  disabled={state.calculatingConsumptionFromBeginning}
                  onClick={this.calculateConsumptionFromIndexFromBeginning}
                >
                  {state.calculatingConsumptionFromBeginning ? (
                    <span>
                      <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
                      <Text
                        id="integration.energyMonitoring.calculatingConsumptionFromBeginning"
                        defaultMessage="Starting consumption calculation..."
                      />
                    </span>
                  ) : (
                    <span>
                      <i class="fe fe-play mr-2" />
                      <Text
                        id="integration.energyMonitoring.calculateConsumptionFromIndexFromBeginning"
                        defaultMessage="Calculate consumption from index from beginning"
                      />
                    </span>
                  )}
                </button>
              </p>
            </div>
            <div class="mb-4">
              <p class="text-muted">
                <Text
                  id="integration.energyMonitoring.calculateCostFromBeginningDescription"
                  defaultMessage="This will calculate the cost of your energy consumption based on your consumption data and electricity prices. Use this after you have consumption data and configured your electricity prices."
                />
              </p>
              <p>
                <button
                  class="btn btn-primary"
                  disabled={state.calculatingFromBeginning}
                  onClick={this.calculateFromBeginning}
                >
                  {state.calculatingFromBeginning ? (
                    <span>
                      <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
                      <Text
                        id="integration.energyMonitoring.calculatingFromBeginning"
                        defaultMessage="Starting calculation..."
                      />
                    </span>
                  ) : (
                    <span>
                      <i class="fe fe-play mr-2" />
                      <Text
                        id="integration.energyMonitoring.calculateCostFromBeginning"
                        defaultMessage="Calculate cost from beginning"
                      />
                    </span>
                  )}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );

    const renderPrices = () => (
      <div>
        <div class="card">
          <div class="card-header">{renderPricesHeader()}</div>
          <div class="card-body">
            <div class={cx('dimmer', { active: state.loadingPrices })}>
              <div class="loader" />
              <div class="dimmer-content">
                {state.priceError && (
                  <div class="alert alert-danger" role="alert">
                    <Text id="integration.energyMonitoring.errorLoadingPrices" />
                  </div>
                )}
                {state.prices.map(p => renderPriceRow(p))}
                {state.prices.length === 0 && !state.loadingPrices && (
                  <div class="text-muted">
                    <Text id="global.noData" defaultMessage="No data" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    const showingWizard = this.isCreatePriceRoute() || this.isEditPriceRoute();
    const showingImport = this.isImportPricesRoute();
    const showingPrices = this.isPricesRoute() || this.isCreatePriceRoute() || this.isEditPriceRoute() || showingImport;
    const showingSettings = this.isSettingsRoute();

    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="container">
              <div class="row">
                <div class="col-lg-3">
                  <h3 class="page-title mb-5">
                    <Text id="integration.energyMonitoring.title" />
                  </h3>
                  <div>
                    <div class="list-group list-group-transparent mb-0">
                      <Link
                        href="/dashboard/integration/device/energy-monitoring"
                        activeClassName="active"
                        class="list-group-item list-group-item-action d-flex align-items-center"
                      >
                        <span class="icon mr-3">
                          <i class="fe fe-grid" />
                        </span>
                        <Text id="integration.energyMonitoring.myDevicesTab" />
                      </Link>

                      <Link
                        href="/dashboard/integration/device/energy-monitoring/prices"
                        activeClassName="active"
                        class="list-group-item list-group-item-action d-flex align-items-center"
                      >
                        <span class="icon mr-3">
                          <i class="fe fe-dollar-sign" />
                        </span>
                        <Text id="integration.energyMonitoring.energyPriceTab" />
                      </Link>

                      <Link
                        href="/dashboard/integration/device/energy-monitoring/settings"
                        activeClassName="active"
                        class="list-group-item list-group-item-action d-flex align-items-center"
                      >
                        <span class="icon mr-3">
                          <i class="fe fe-settings" />
                        </span>
                        <Text id="integration.energyMonitoring.settings" defaultMessage="Settings" />
                      </Link>

                      <DeviceConfigurationLink
                        user={props.user}
                        configurationKey="integrations"
                        documentKey="energy-monitoring"
                        linkClass="list-group-item list-group-item-action d-flex align-items-center"
                      >
                        <span class="icon mr-3">
                          <i class="fe fe-book-open" />
                        </span>
                        <Text id="integration.energyMonitoring.documentation" />
                      </DeviceConfigurationLink>
                    </div>
                  </div>
                </div>

                <div class="col-lg-9">
                  {!showingPrices && !showingSettings && (
                    <div class="card">
                      <div class="card-header">
                        <h1 class="card-title">
                          <Text id="integration.energyMonitoring.title" />
                        </h1>
                      </div>
                      <div class="card-body">
                        <div class={cx('dimmer', { active: props.loading || loadingDevices })}>
                          <div class="loader" />
                          <div class="dimmer-content">
                            {error && (
                              <div class="alert alert-danger" role="alert">
                                <Text id="integration.energyMonitoring.errorLoadingDevices" />
                              </div>
                            )}
                            <p>
                              <Text id="integration.energyMonitoring.hierarchicalListDescription" />
                            </p>
                            <div>
                              {rootFeatures.map(f => (
                                <div key={f.id}>{renderFeature(f, 0)}</div>
                              ))}
                              {rootFeatures.length === 0 && !loadingDevices && (
                                <div class="text-muted">
                                  <Text id="integration.energyMonitoring.noDeviceFeaturesFound" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {showingPrices && !showingWizard && !showingImport && renderPrices()}
                  {showingWizard && renderWizard()}
                  {showingImport && <ImportPricesPage {...props} />}
                  {showingSettings && renderSettings()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default EnergyMonitoringPage;
