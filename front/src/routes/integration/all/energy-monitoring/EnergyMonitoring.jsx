import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { route } from 'preact-router';
import cx from 'classnames';
import Select from 'react-select';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import ImportPricesPage from './ImportPrices';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import { DeviceListWithDragAndDrop } from '../../../../components/drag-and-drop/DeviceListWithDragAndDrop';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../../../server/utils/constants';

const DEVICE_FEATURE_CATEGORIES_TO_DISPLAY = [
  DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  DEVICE_FEATURE_CATEGORIES.SWITCH,
  DEVICE_FEATURE_CATEGORIES.TELEINFORMATION
];

const DEVICE_FEATURE_TYPES_TO_DISPLAY = [
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
  DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EAST,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF01,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF02,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF03,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF04,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF05,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF06,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF07,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF08,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF09,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF10
];

const ENERGY_INDEX_FEATURE_TYPES_BY_CATEGORY = {
  [DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR]: [
    DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
    DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX
  ],
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: [DEVICE_FEATURE_TYPES.SWITCH.ENERGY],
  [DEVICE_FEATURE_CATEGORIES.TELEINFORMATION]: [
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EAST,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF01,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF02,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF03,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF04,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF05,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF06,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF07,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF08,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF09,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF10
  ]
};

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
    calculatingCostFromBeginning: false,
    settingsSuccess: null,
    settingsError: null,
    costSettingsSuccess: null,
    costSettingsError: null,
    calculatingSelectedFromBeginning: false,
    calculatingSelectedCostFromBeginning: false,
    selectionSettingsSuccess: null,
    selectionSettingsError: null,
    selectionCostSettingsSuccess: null,
    selectionCostSettingsError: null,
    selectedFeaturesForRecalc: [],
    showConfirmRecalculateAll: false,
    showConfirmCostAll: false,
    recalculateStartDate: '',
    recalculateEndDate: '',
    recalculateDateError: null,
    // UI state for collapsible price items
    expandedPriceIds: new Set(),
    // UI state for collapsible contract groups (collapsed by default)
    expandedContractGroups: new Set(),
    // Circular dependency detection
    circularDependencies: [],
    fixingCircularDependencies: false,
    // Wizard state
    wizardEditingId: null,
    wizardStep: 0,
    wizardHourSlots: new Set(),
    newPrice: {
      contract_name: '',
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

  calculateConsumptionAndCostFromBeginning = async () => {
    await this.runConsumptionAndCostCalculations();
  };

  addSelectedFeature = option => {
    if (!option) return;
    this.setState(prev => {
      const exists = (prev.selectedFeaturesForRecalc || []).some(o => o.value === option.value);

      if (exists) return null;
      return {
        selectedFeaturesForRecalc: [...(prev.selectedFeaturesForRecalc || []), option],
        showConfirmRecalculateAll: false,
        showConfirmCostAll: false
      };
    });
  };

  removeSelectedFeature = index => {
    this.setState(prev => {
      const next = [...(prev.selectedFeaturesForRecalc || [])];
      next.splice(index, 1);
      return {
        selectedFeaturesForRecalc: next,
        showConfirmRecalculateAll: false,
        showConfirmCostAll: false
      };
    });
  };

  moveSelectedFeature = (from, to) => {
    if (from === to) return;
    this.setState(prev => {
      const list = [...(prev.selectedFeaturesForRecalc || [])];
      const item = list.splice(from, 1)[0];
      list.splice(to, 0, item);
      return { selectedFeaturesForRecalc: list };
    });
  };

  getSelectedRecalculationSelectors = () => {
    const consumptionSet = new Set();
    const costSet = new Set();
    (this.state.selectedFeaturesForRecalc || []).forEach(opt => {
      if (opt && opt.consumptionSelector) consumptionSet.add(opt.consumptionSelector);
      if (opt && opt.costSelector) costSet.add(opt.costSelector);
    });
    return { consumptionSelectors: Array.from(consumptionSet), costSelectors: Array.from(costSet) };
  };

  calculateCostFromBeginning = async () => {
    await this.runCostCalculations();
  };

  handleRecalculateStartDateChange = e => {
    const nextStartDate = e.target.value;
    this.setState(prev => {
      const hasInvalidRange = nextStartDate && prev.recalculateEndDate && nextStartDate > prev.recalculateEndDate;
      return {
        recalculateStartDate: nextStartDate,
        showConfirmRecalculateAll: false,
        showConfirmCostAll: false,
        recalculateDateError: hasInvalidRange ? 'invalidStartAfterEnd' : null
      };
    });
  };

  handleRecalculateEndDateChange = e => {
    const nextEndDate = e.target.value;
    this.setState(prev => {
      const hasInvalidRange = nextEndDate && prev.recalculateStartDate && nextEndDate < prev.recalculateStartDate;
      return {
        recalculateEndDate: nextEndDate,
        showConfirmRecalculateAll: false,
        showConfirmCostAll: false,
        recalculateDateError: hasInvalidRange ? 'invalidEndBeforeStart' : null
      };
    });
  };

  clearRecalculateStartDate = () => {
    this.setState({
      recalculateStartDate: '',
      showConfirmRecalculateAll: false,
      showConfirmCostAll: false,
      recalculateDateError: null
    });
  };

  clearRecalculateEndDate = () => {
    this.setState({
      recalculateEndDate: '',
      showConfirmRecalculateAll: false,
      showConfirmCostAll: false,
      recalculateDateError: null
    });
  };

  hasRecalculatePeriod = () => {
    return Boolean(this.state.recalculateStartDate || this.state.recalculateEndDate);
  };

  getRecalculateDatePayload = () => {
    const payload = {};
    if (this.state.recalculateStartDate) payload.start_date = this.state.recalculateStartDate;
    if (this.state.recalculateEndDate) payload.end_date = this.state.recalculateEndDate;
    return payload;
  };

  renderRecalculatePeriod = () => {
    const { recalculateStartDate, recalculateEndDate } = this.state;
    if (recalculateStartDate && recalculateEndDate) {
      return (
        <Text
          id="integration.energyMonitoring.periodFromTo"
          defaultMessage="Period: from {{startDate}} to {{endDate}}."
          fields={{ startDate: recalculateStartDate, endDate: recalculateEndDate }}
        />
      );
    }
    if (recalculateStartDate) {
      return (
        <Text
          id="integration.energyMonitoring.periodFrom"
          defaultMessage="Period: from {{startDate}}."
          fields={{ startDate: recalculateStartDate }}
        />
      );
    }
    if (recalculateEndDate) {
      return (
        <Text
          id="integration.energyMonitoring.periodUntil"
          defaultMessage="Period: until {{endDate}}."
          fields={{ endDate: recalculateEndDate }}
        />
      );
    }
    return <Text id="integration.energyMonitoring.periodAllTime" defaultMessage="Period: full history." />;
  };

  calculateConsumptionAndCostForSelection = async () => {
    const { consumptionSelectors, costSelectors } = this.getSelectedRecalculationSelectors();
    if (consumptionSelectors.length === 0 && costSelectors.length === 0) {
      this.setState({
        showConfirmRecalculateAll: true,
        showConfirmCostAll: false,
        selectionSettingsError: null,
        selectionSettingsSuccess: null,
        selectionCostSettingsError: null,
        selectionCostSettingsSuccess: null
      });
      return;
    }
    await this.runConsumptionAndCostCalculations({
      consumptionSelectors,
      costSelectors,
      fromSelection: true
    });
  };

  confirmConsumptionAndCostForAll = async () => {
    this.setState({ showConfirmRecalculateAll: false });
    await this.runConsumptionAndCostCalculations();
  };

  cancelConfirmConsumptionAndCostForAll = () => {
    this.setState({ showConfirmRecalculateAll: false });
  };

  calculateCostForSelection = async () => {
    const { costSelectors } = this.getSelectedRecalculationSelectors();
    if (costSelectors.length === 0) {
      this.setState({
        showConfirmCostAll: true,
        showConfirmRecalculateAll: false,
        selectionSettingsError: null,
        selectionSettingsSuccess: null,
        selectionCostSettingsError: null,
        selectionCostSettingsSuccess: null
      });
      return;
    }
    await this.runCostCalculations({
      costSelectors,
      fromSelection: true
    });
  };

  confirmCostForAll = async () => {
    this.setState({ showConfirmCostAll: false });
    await this.runCostCalculations();
  };

  cancelConfirmCostForAll = () => {
    this.setState({ showConfirmCostAll: false });
  };

  runCostCalculations = async ({ costSelectors = [], fromSelection = false } = {}) => {
    try {
      const hasPeriod = this.hasRecalculatePeriod();
      const url = hasPeriod
        ? '/api/v1/service/energy-monitoring/calculate-cost-range'
        : '/api/v1/service/energy-monitoring/calculate-cost-from-beginning';
      this.setState({
        calculatingCostFromBeginning: !fromSelection,
        calculatingSelectedCostFromBeginning: fromSelection,
        costSettingsError: null,
        costSettingsSuccess: null,
        settingsError: null,
        settingsSuccess: null,
        selectionSettingsError: null,
        selectionSettingsSuccess: null,
        selectionCostSettingsError: null,
        selectionCostSettingsSuccess: null
      });
      const costResponse = await this.props.httpClient.post(url, {
        feature_selectors: costSelectors,
        ...this.getRecalculateDatePayload()
      });
      if (!costResponse || costResponse.success !== true || !costResponse.job_id) {
        throw new Error('job_not_created');
      }
      if (fromSelection) {
        this.setState({ selectionCostSettingsSuccess: 'ok' });
      } else {
        this.setState({ costSettingsSuccess: 'ok' });
      }
      route('/dashboard/settings/jobs');
    } catch (e) {
      if (fromSelection) {
        this.setState({ selectionCostSettingsError: e });
      } else {
        this.setState({ costSettingsError: e });
      }
    } finally {
      if (fromSelection) {
        this.setState({ calculatingSelectedCostFromBeginning: false });
      } else {
        this.setState({ calculatingCostFromBeginning: false });
      }
    }
  };

  runConsumptionAndCostCalculations = async ({
    consumptionSelectors = [],
    costSelectors = [],
    fromSelection = false
  } = {}) => {
    try {
      const hasPeriod = this.hasRecalculatePeriod();
      const consumptionUrl = hasPeriod
        ? '/api/v1/service/energy-monitoring/calculate-consumption-from-index-range'
        : '/api/v1/service/energy-monitoring/calculate-consumption-from-index-from-beginning';
      const costUrl = hasPeriod
        ? '/api/v1/service/energy-monitoring/calculate-cost-range'
        : '/api/v1/service/energy-monitoring/calculate-cost-from-beginning';
      this.setState({
        calculatingFromBeginning: !fromSelection,
        calculatingSelectedFromBeginning: fromSelection,
        settingsError: null,
        settingsSuccess: null,
        costSettingsError: null,
        costSettingsSuccess: null,
        selectionSettingsError: null,
        selectionSettingsSuccess: null,
        selectionCostSettingsError: null,
        selectionCostSettingsSuccess: null
      });
      const consumptionResponse = await this.props.httpClient.post(consumptionUrl, {
        feature_selectors: consumptionSelectors,
        ...this.getRecalculateDatePayload()
      });
      if (!consumptionResponse || consumptionResponse.success !== true || !consumptionResponse.job_id) {
        throw new Error('job_not_created');
      }
      const costResponse = await this.props.httpClient.post(costUrl, {
        feature_selectors: costSelectors,
        ...this.getRecalculateDatePayload()
      });
      if (!costResponse || costResponse.success !== true || !costResponse.job_id) {
        throw new Error('job_not_created');
      }
      if (fromSelection) {
        this.setState({ selectionSettingsSuccess: 'ok' });
      } else {
        this.setState({ settingsSuccess: 'ok' });
      }
      route('/dashboard/settings/jobs');
    } catch (e) {
      if (fromSelection) {
        this.setState({ selectionSettingsError: e });
      } else {
        this.setState({ settingsError: e });
      }
    } finally {
      if (fromSelection) {
        this.setState({ calculatingSelectedFromBeginning: false });
      } else {
        this.setState({ calculatingFromBeginning: false });
      }
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
          contract_name: p.contract_name || '',
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

  toggleContractGroupExpanded = groupName => {
    this.setState(({ expandedContractGroups }) => {
      const next = new Set(expandedContractGroups);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return { expandedContractGroups: next };
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

  deleteContractGroup = async contractName => {
    try {
      const pricesToDelete = (this.state.prices || []).filter(
        p => (p.contract_name || p.contract || 'base') === contractName
      );
      for (const item of pricesToDelete) {
        if (item.selector) {
          await this.props.httpClient.delete(`/api/v1/energy_price/${item.selector}`);
        }
      }
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

  createElectricMeter = async () => {
    try {
      this.setState({ loadingDevices: true, error: null });

      // Get the MQTT service ID
      const mqttService = await this.props.httpClient.get('/api/v1/service/mqtt');
      const serviceId = mqttService.id;

      // Generate a unique external_id like MQTT does
      const timestamp = Date.now();
      const newDevice = {
        name: this.props.intl.dictionary.integration.energyMonitoring.electricMeterDeviceName || 'Electric Meter',
        external_id: `mqtt:electric-meter-${timestamp}`,
        selector: `mqtt:electric-meter-${timestamp}`,
        service_id: serviceId,
        should_poll: false,
        features: [
          {
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
            name:
              this.props.intl.dictionary.integration.energyMonitoring.electricMeterFeatureName ||
              'Electric Meter Index',
            external_id: `mqtt:electric-meter-${timestamp}-index`,
            selector: `mqtt:electric-meter-${timestamp}-index`,
            unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
            read_only: true,
            has_feedback: false,
            min: 0,
            max: 10000000000
          }
        ],
        params: []
      };

      const createdDevice = await this.props.httpClient.post('/api/v1/device', newDevice);

      // Reload devices to include the new one
      await this.loadDevices();

      // Update the wizard form with the newly created device
      this.setState(({ newPrice }) => ({
        newPrice: { ...newPrice, electric_meter_device_id: createdDevice.id }
      }));
    } catch (error) {
      console.error(error);
      this.setState({ error });
    } finally {
      this.setState({ loadingDevices: false });
    }
  };

  handleElectricMeterChange = async e => {
    const value = e.target.value;

    if (value === 'CREATE_NEW') {
      await this.createElectricMeter();
    } else {
      this.setState(({ newPrice }) => ({
        newPrice: { ...newPrice, electric_meter_device_id: value }
      }));
    }
  };

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

  getRecalculationCandidates() {
    const all = this.getAllFeatures();
    const byId = new Map();
    const childrenByParent = new Map();

    all.forEach(feature => {
      byId.set(feature.id, feature);
      const parentId = feature.energy_parent_id;
      if (parentId) {
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
        childrenByParent.get(parentId).push(feature);
      }
    });

    const consumptionTypes = new Set([
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION
    ]);
    const costTypes = new Set([
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST
    ]);

    const candidates = [];

    all.forEach(feature => {
      if (!feature) return;
      const rootTypes = ENERGY_INDEX_FEATURE_TYPES_BY_CATEGORY[feature.category];
      if (!rootTypes || !rootTypes.includes(feature.type)) {
        return;
      }
      const consumptionChildren = childrenByParent.get(feature.id) || [];
      const consumptionFeature = consumptionChildren.find(child => consumptionTypes.has(child.type));
      if (!consumptionFeature) return;
      const costChildren = childrenByParent.get(consumptionFeature.id) || [];
      const costFeature = costChildren.find(child => costTypes.has(child.type));
      if (!costFeature) return;

      candidates.push({ root: feature, consumption: consumptionFeature, cost: costFeature });
    });

    return candidates.sort((a, b) => {
      const deviceNameA = (a.root.__device && a.root.__device.name) || '';
      const deviceNameB = (b.root.__device && b.root.__device.name) || '';
      const nameA = `${deviceNameA} ${a.root.name || ''}`.trim().toLowerCase();
      const nameB = `${deviceNameB} ${b.root.name || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  getRecalculationOptions(features = this.getRecalculationCandidates()) {
    const selected = new Set((this.state.selectedFeaturesForRecalc || []).map(opt => opt && opt.value).filter(Boolean));
    return features
      .filter(entry => {
        const value = (entry.root && (entry.root.selector || entry.root.external_id || String(entry.root.id))) || '';
        return value && !selected.has(value);
      })
      .map(entry => {
        const root = entry.root;
        const consumption = entry.consumption;
        const cost = entry.cost;
        const value = root.selector || root.external_id || String(root.id);
        const deviceName = (root.__device && root.__device.name) || '';
        const featureName = root.name || root.type || value;
        const label = deviceName ? `${deviceName} - ${featureName}` : featureName;
        return {
          value,
          label,
          rootSelector: root.selector || root.external_id || String(root.id),
          consumptionSelector: consumption.selector || consumption.external_id || String(consumption.id),
          costSelector: cost.selector || cost.external_id || String(cost.id)
        };
      });
  }

  detectCircularDependencies() {
    const allFeatures = this.getAllFeatures();
    const featureMap = new Map();
    allFeatures.forEach(f => featureMap.set(f.id, f));

    const circularDependencies = [];

    allFeatures.forEach(feature => {
      if (!feature.energy_parent_id) return;

      const visited = new Set();
      let current = feature;
      const chain = [feature];

      while (current && current.energy_parent_id) {
        if (visited.has(current.id)) {
          // Found a circular dependency
          circularDependencies.push({
            feature,
            chain: [...chain],
            type: current.id === feature.id ? 'self' : 'cycle'
          });
          break;
        }
        visited.add(current.id);
        const parent = featureMap.get(current.energy_parent_id);
        if (!parent) {
          // Parent doesn't exist - broken reference
          circularDependencies.push({
            feature,
            chain: [...chain],
            type: 'broken',
            missingParentId: current.energy_parent_id
          });
          break;
        }
        current = parent;
        chain.push(current);
      }
    });

    return circularDependencies;
  }

  fixCircularDependencies = async () => {
    const circularDeps = this.detectCircularDependencies();
    if (circularDeps.length === 0) return;

    this.setState({ fixingCircularDependencies: true });

    try {
      // Find the highest point in each broken chain to fix
      // We only want to fix the root cause, not the children (like 30min cost/consumption)
      const featuresToFix = new Set();

      for (const dep of circularDeps) {
        if (dep.type === 'broken') {
          // For broken references, find the feature that points to the missing parent
          // This is the last feature in the chain that has a valid parent reference to a missing ID
          const chainWithBrokenRef = dep.chain;
          for (let i = 0; i < chainWithBrokenRef.length; i += 1) {
            const f = chainWithBrokenRef[i];
            if (f.energy_parent_id === dep.missingParentId) {
              featuresToFix.add(f.id);
              break;
            }
          }
        } else if (dep.type === 'self' || dep.type === 'cycle') {
          // For circular references, fix the first feature in the chain (highest in hierarchy)
          // that is part of the cycle
          featuresToFix.add(dep.feature.id);
        }
      }

      // Get all features to access by ID
      const allFeatures = this.getAllFeatures();
      const featureMap = new Map();
      allFeatures.forEach(f => featureMap.set(f.id, f));

      // Fix only the identified features
      for (const featureId of featuresToFix) {
        const feature = featureMap.get(featureId);
        if (feature && feature.selector) {
          await this.props.httpClient.patch(`/api/v1/device_feature/${feature.selector}`, {
            energy_parent_id: null
          });
        }
      }
      // Reload devices to get updated state
      await this.loadDevices();
    } catch (e) {
      this.setState({ error: e });
    } finally {
      this.setState({ fixingCircularDependencies: false });
    }
  };

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

      const isChildFeature =
        feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION ||
        feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST;
      // const hasParentId = feature.energy_parent_id !== null && feature.energy_parent_id !== undefined;
      const canModifyParent = true; // Temporary fix, should be !isChildFeature || !hasParentId;
      return (
        <div class={isChildFeature ? 'mb-1' : 'mb-2'} style={{ paddingLeft: `${paddingLeft}px` }}>
          <div
            class="card shadow-sm"
            style={{ borderLeft: `${isChildFeature ? '3px' : '4px'} solid ${color}`, borderRadius: '6px' }}
          >
            <div class={isChildFeature ? 'card-body py-1 px-2' : 'card-body py-2 px-2 px-md-3'}>
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center">
                <div class="flex-grow-1 w-100 w-md-auto mb-2 mb-md-0">
                  <div class="d-flex align-items-center flex-wrap">
                    <span
                      class={isChildFeature ? 'badge mr-2' : 'badge mr-2 mb-1'}
                      style={{ background: color, color: '#fff', fontSize: isChildFeature ? '0.7em' : undefined }}
                    >
                      <Text id="integration.energyMonitoring.level" fields={{ depth }} />
                    </span>
                    <span class={isChildFeature ? 'small' : 'mb-1'}>
                      <strong>{label}</strong>
                    </span>
                  </div>
                  {!isChildFeature && (
                    <div class="small text-muted mt-1" style={{ wordBreak: 'break-all' }}>
                      {feature.selector}
                    </div>
                  )}
                </div>
                {canModifyParent && (
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
                )}
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

    // Helper to format stored hour slots
    const formatStoredSlots = value => {
      if (!value) return '';
      const s = String(value);
      if (s.includes(':')) return s; // already HH:MM list
      // Legacy numeric list
      const set = this.parseHourSlotsToSet(s);
      return this.formatSetToHourSlots(set);
    };

    // Determine if price is for peak hours based on hour_slots content
    // Peak hours are typically during the day (e.g., 08:00-12:00, 18:00-22:00)
    // Off-peak hours typically include night hours (00:00-06:00)
    const isPeakPrice = p => {
      if (!p.hour_slots || String(p.hour_slots).trim().length === 0) {
        // No hour slots = base contract, not peak/off-peak
        return null;
      }
      const slots = String(p.hour_slots)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (slots.length === 0) return null;

      // Count how many slots are in typical off-peak night hours (00:00-06:00)
      // These are slots 0-11 (00:00, 00:30, 01:00, ..., 05:30)
      let nightSlotCount = 0;
      slots.forEach(slot => {
        const match = slot.match(/^(\d{1,2}):(\d{2})$/);
        if (match) {
          const hour = parseInt(match[1], 10);
          if (hour >= 0 && hour < 6) {
            nightSlotCount++;
          }
        }
      });

      // If more than half of the 00:00-06:00 slots are included (6 hours = 12 half-hour slots),
      // this is likely an off-peak price
      // Off-peak typically has many night hours, peak typically has few or none
      return nightSlotCount < 6; // If less than 6 night slots, it's peak
    };

    // Get border color based on day_type (for Tempo contracts)
    const getDayTypeBorderColor = dayType => {
      switch (dayType) {
        case 'blue':
          return '#4dabf7'; // blue
        case 'white':
          return '#868e96'; // gray
        case 'red':
          return '#fa5252'; // red
        default:
          return null;
      }
    };

    // Get badge style for peak/off-peak
    const getPeakBadgeStyle = isPeak => {
      if (isPeak === true) {
        return { background: '#fd7e14', color: '#fff' }; // orange for peak
      }
      if (isPeak === false) {
        return { background: '#40c057', color: '#fff' }; // green for off-peak
      }
      return null; // no badge for base contracts
    };

    // Group prices by name
    const groupPricesByName = prices => {
      const groups = {};
      prices.forEach(p => {
        const name = p.contract_name || p.contract || 'base';
        if (!groups[name]) {
          groups[name] = [];
        }
        groups[name].push(p);
      });
      return groups;
    };

    // Sort prices within a group: by day_type, then by peak/off-peak
    const sortPricesInGroup = prices => {
      const dayTypeOrder = { blue: 0, white: 1, red: 2, any: 3 };
      return [...prices].sort((a, b) => {
        // First sort by day_type
        const dayA = dayTypeOrder[a.day_type] !== undefined ? dayTypeOrder[a.day_type] : 99;
        const dayB = dayTypeOrder[b.day_type] !== undefined ? dayTypeOrder[b.day_type] : 99;
        if (dayA !== dayB) return dayA - dayB;
        // Then sort by peak (peak first, then off-peak)
        const peakA = isPeakPrice(a) ? 0 : 1;
        const peakB = isPeakPrice(b) ? 0 : 1;
        return peakA - peakB;
      });
    };

    const renderPriceRow = p => {
      const expanded = state.expandedPriceIds.has(p.id);
      const fmt = d => (d && d !== 'Invalid date' ? d : '');
      const dates = [fmt(p.start_date), fmt(p.end_date)].filter(Boolean);
      const period = dates.join(' → ');
      const dayTypeBorderColor = getDayTypeBorderColor(p.day_type);
      const borderStyle = dayTypeBorderColor ? { borderLeft: `4px solid ${dayTypeBorderColor}` } : {};
      const priceDisplay = p.price != null && p.price !== '' ? (p.price / 10000).toFixed(4) : null;
      const isPeak = isPeakPrice(p);
      const badgeStyle = getPeakBadgeStyle(isPeak);
      return (
        <div class="card mb-2" key={p.id} style={borderStyle}>
          <div class="card-body py-2 px-3">
            <div class="d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center flex-wrap">
                {/* Peak/Off-peak badge for non-base contracts (only show if we can determine peak/off-peak) */}
                {p.contract !== 'base' && isPeak !== null && badgeStyle && (
                  <span class="badge mr-2" style={badgeStyle}>
                    {isPeak ? (
                      <Text id="integration.energyMonitoring.peakHours" defaultMessage="Peak hours" />
                    ) : (
                      <Text id="integration.energyMonitoring.offPeakHours" defaultMessage="Off-peak hours" />
                    )}
                  </span>
                )}
                {/* Day type badge for Tempo */}
                {p.day_type && p.day_type !== 'any' && (
                  <span
                    class="badge mr-2"
                    style={{
                      background: getDayTypeBorderColor(p.day_type) || '#6c757d',
                      color: '#fff'
                    }}
                  >
                    <Text
                      id={`integration.energyMonitoring.dayTypeOptions.${p.day_type}`}
                      defaultMessage={p.day_type}
                    />
                  </span>
                )}
                {/* Price type badge */}
                <span class="badge badge-secondary mr-2">
                  <Text id={`integration.energyMonitoring.priceTypes.${p.price_type}`} defaultMessage={p.price_type} />
                </span>
                {/* Price value - prominent display */}
                {priceDisplay && (
                  <strong class="mr-3" style={{ fontSize: '1.1em' }}>
                    {priceDisplay}{' '}
                    <Text id={`integration.energyMonitoring.currencies.${p.currency}`} defaultMessage={p.currency} />
                    {p.price_type === 'subscription' ? (
                      <Text id="integration.energyMonitoring.perMonth" defaultMessage="/month" />
                    ) : (
                      '/kWh'
                    )}
                  </strong>
                )}
                {/* Period info */}
                {period && <span class="small text-muted">{period}</span>}
              </div>
              <div class="d-flex align-items-center">
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
                  {priceDisplay || '-'}
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

    const renderPriceGroup = (groupName, prices) => {
      const sortedPrices = sortPricesInGroup(prices);
      const isExpanded = state.expandedContractGroups.has(groupName);
      return (
        <div class="mb-3" key={groupName}>
          <div class="card" style={{ cursor: 'pointer' }}>
            <div
              class="card-body py-2 px-3 d-flex align-items-center justify-content-between"
              onClick={() => this.toggleContractGroupExpanded(groupName)}
            >
              <div class="d-flex align-items-center">
                <i class={cx('fe mr-2', isExpanded ? 'fe-chevron-down' : 'fe-chevron-right')} />
                <strong>{groupName}</strong>
                <span class="badge badge-secondary ml-2">{prices.length}</span>
              </div>
              <button
                class="btn btn-sm btn-outline-danger"
                onClick={e => {
                  e.stopPropagation();
                  if (window.confirm(this.props.intl.dictionary.integration.energyMonitoring.confirmDeleteContract)) {
                    this.deleteContractGroup(groupName);
                  }
                }}
              >
                <i class="fe fe-trash-2" />
              </button>
            </div>
          </div>
          {isExpanded && (
            <div class="pl-3 mt-2" style={{ borderLeft: '2px solid #e9ecef' }}>
              {sortedPrices.map(p => renderPriceRow(p))}
            </div>
          )}
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
                  <div class="col-md-6">
                    <div class="form-group">
                      <label>
                        <Text id="integration.energyMonitoring.contractName" />
                      </label>
                      <input
                        type="text"
                        class="form-control"
                        value={state.newPrice.contract_name}
                        onChange={e => updateNewPrice({ contract_name: e.target.value })}
                        placeholder={this.props.intl.dictionary.integration.energyMonitoring.contractNamePlaceholder}
                      />
                    </div>
                  </div>
                  <div class="col-md-6">
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
                </div>
                <div class="row">
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
                        onChange={this.handleElectricMeterChange}
                      >
                        <option value="">—</option>
                        <option value="CREATE_NEW">
                          <Text
                            id="integration.energyMonitoring.createElectricMeter"
                            defaultMessage="+ Create Electric Meter"
                          />
                        </option>
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

    const renderSettings = () => {
      const recalcFeatures = this.getRecalculationCandidates();
      const hasPeriod = this.hasRecalculatePeriod();
      const hasSelection = (state.selectedFeaturesForRecalc || []).length > 0;

      return (
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
              {state.costSettingsError && (
                <div class="alert alert-danger" role="alert">
                  <Text
                    id="integration.energyMonitoring.calculateCostFromBeginningError"
                    defaultMessage="An error occurred while starting the cost calculation."
                  />
                </div>
              )}
              {state.costSettingsSuccess && (
                <div class="alert alert-success" role="alert">
                  <Text
                    id="integration.energyMonitoring.calculateCostFromBeginningStarted"
                    defaultMessage="Cost calculation started. You can follow progress in Jobs."
                  />
                </div>
              )}
              {state.selectionSettingsError && (
                <div class="alert alert-danger" role="alert">
                  <Text
                    id="integration.energyMonitoring.calculateSelectedFeaturesFromBeginningError"
                    defaultMessage="An error occurred while starting the calculation for selected features."
                  />
                </div>
              )}
              {state.selectionSettingsSuccess && (
                <div class="alert alert-success" role="alert">
                  <Text
                    id="integration.energyMonitoring.calculateSelectedFeaturesFromBeginningStarted"
                    defaultMessage="Calculation for selected features started. You can follow progress in Jobs."
                  />
                </div>
              )}
              {state.selectionCostSettingsError && (
                <div class="alert alert-danger" role="alert">
                  <Text
                    id="integration.energyMonitoring.calculateSelectedFeaturesCostFromBeginningError"
                    defaultMessage="An error occurred while starting the cost calculation for selected features."
                  />
                </div>
              )}
              {state.selectionCostSettingsSuccess && (
                <div class="alert alert-success" role="alert">
                  <Text
                    id="integration.energyMonitoring.calculateSelectedFeaturesCostFromBeginningStarted"
                    defaultMessage="Cost calculation for selected features started. You can follow progress in Jobs."
                  />
                </div>
              )}
              <div class="mb-4">
                <p class="text-muted">
                  <Text
                    id="integration.energyMonitoring.recalculateSelectionDescription"
                    defaultMessage="Select one or more energy features to recalculate their consumption and/or cost."
                  />
                </p>
                <p class="text-muted">
                  <Text
                    id="integration.energyMonitoring.recalculateAllFallbackDescription"
                    defaultMessage="If no feature is selected, we will recalculate all energy features after confirmation."
                  />
                </p>
              </div>
              <div class="mb-4">
                <div class="form-group">
                  <label>
                    <Text id="integration.energyMonitoring.selectFeatures" defaultMessage="Select features" />
                  </label>
                  <Select
                    onChange={this.addSelectedFeature}
                    value={null}
                    options={this.getRecalculationOptions(recalcFeatures)}
                    isClearable
                    isDisabled={state.calculatingSelectedFromBeginning || recalcFeatures.length === 0}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder={
                      this.props.intl.dictionary.integration.energyMonitoring.selectFeaturesPlaceholder || 'Select...'
                    }
                    noOptionsMessage={() =>
                      this.props.intl.dictionary.integration.energyMonitoring.noFeaturesAvailable ||
                      'No eligible features found.'
                    }
                  />
                </div>
                <div class="form-group">
                  <DeviceListWithDragAndDrop
                    selectedDeviceFeaturesOptions={state.selectedFeaturesForRecalc}
                    moveDevice={this.moveSelectedFeature}
                    removeDevice={this.removeSelectedFeature}
                    updateDeviceFeatureName={() => {}}
                    isTouchDevice={false}
                    allowRename={false}
                  />
                  <hr class="my-3" />
                  <p class="text-muted">
                    <Text
                      id="integration.energyMonitoring.recalculatePeriodDescription"
                      defaultMessage="Choose a date range to limit the recalculation. Leave empty to use the full history."
                    />
                  </p>
                  <div class="form-row">
                    <div class="form-group col-12 col-md-6">
                      <label>
                        <Text id="integration.energyMonitoring.recalculateStartDateLabel" defaultMessage="From" />
                      </label>
                      <div class="input-group">
                        <input
                          type="date"
                          class="form-control"
                          value={state.recalculateStartDate}
                          onChange={this.handleRecalculateStartDateChange}
                          max={state.recalculateEndDate || undefined}
                        />
                        {state.recalculateStartDate && (
                          <div class="input-group-append">
                            <button
                              type="button"
                              class="btn btn-outline-secondary"
                              onClick={this.clearRecalculateStartDate}
                              aria-label={
                                this.props.intl.dictionary.integration.energyMonitoring.clearDate || 'Clear date'
                              }
                            >
                              <i class="fe fe-x" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div class="form-group col-12 col-md-6">
                      <label>
                        <Text id="integration.energyMonitoring.recalculateEndDateLabel" defaultMessage="To" />
                      </label>
                      <div class="input-group">
                        <input
                          type="date"
                          class="form-control"
                          value={state.recalculateEndDate}
                          onChange={this.handleRecalculateEndDateChange}
                          min={state.recalculateStartDate || undefined}
                        />
                        {state.recalculateEndDate && (
                          <div class="input-group-append">
                            <button
                              type="button"
                              class="btn btn-outline-secondary"
                              onClick={this.clearRecalculateEndDate}
                              aria-label={
                                this.props.intl.dictionary.integration.energyMonitoring.clearDate || 'Clear date'
                              }
                            >
                              <i class="fe fe-x" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {state.recalculateDateError && (
                    <div class="alert alert-warning py-2">
                      <Text
                        id={
                          state.recalculateDateError === 'invalidStartAfterEnd'
                            ? 'integration.energyMonitoring.recalculateDateStartAfterEndError'
                            : 'integration.energyMonitoring.recalculateDateEndBeforeStartError'
                        }
                        defaultMessage="The start date must be before the end date."
                      />
                    </div>
                  )}
                  <p class="text-muted mb-0">{this.renderRecalculatePeriod()}</p>
                </div>
                {state.showConfirmRecalculateAll && (
                  <div class="alert alert-warning d-flex flex-column mb-3">
                    <Text
                      id={
                        hasPeriod
                          ? 'integration.energyMonitoring.recalculateAllConfirmDescriptionPeriod'
                          : 'integration.energyMonitoring.recalculateAllConfirmDescription'
                      }
                      defaultMessage="No feature is selected. This will recalculate all energy features."
                    />
                    <div class="small text-muted mt-1">{this.renderRecalculatePeriod()}</div>
                    <div class="mt-2">
                      <button
                        class="btn btn-danger"
                        onClick={this.confirmConsumptionAndCostForAll}
                        disabled={
                          state.calculatingFromBeginning ||
                          state.calculatingSelectedFromBeginning ||
                          state.calculatingCostFromBeginning ||
                          state.calculatingSelectedCostFromBeginning
                        }
                      >
                        <Text
                          id="integration.energyMonitoring.recalculateAllConfirmButton"
                          defaultMessage="Confirm full recalculation"
                        />
                      </button>
                      <button
                        class="btn ml-2"
                        onClick={this.cancelConfirmConsumptionAndCostForAll}
                        disabled={
                          state.calculatingFromBeginning ||
                          state.calculatingSelectedFromBeginning ||
                          state.calculatingCostFromBeginning ||
                          state.calculatingSelectedCostFromBeginning
                        }
                      >
                        <Text id="integration.energyMonitoring.recalculateAllCancelButton" defaultMessage="Cancel" />
                      </button>
                    </div>
                  </div>
                )}
                {state.showConfirmCostAll && (
                  <div class="alert alert-warning d-flex flex-column mb-3">
                    <Text
                      id={
                        hasPeriod
                          ? 'integration.energyMonitoring.recalculateAllCostConfirmDescriptionPeriod'
                          : 'integration.energyMonitoring.recalculateAllCostConfirmDescription'
                      }
                      defaultMessage="No feature is selected. This will recalculate the cost for all energy features."
                    />
                    <div class="small text-muted mt-1">{this.renderRecalculatePeriod()}</div>
                    <div class="mt-2">
                      <button
                        class="btn btn-danger"
                        onClick={this.confirmCostForAll}
                        disabled={
                          state.calculatingFromBeginning ||
                          state.calculatingSelectedFromBeginning ||
                          state.calculatingCostFromBeginning ||
                          state.calculatingSelectedCostFromBeginning
                        }
                      >
                        <Text
                          id="integration.energyMonitoring.recalculateAllCostConfirmButton"
                          defaultMessage="Confirm full cost recalculation"
                        />
                      </button>
                      <button
                        class="btn ml-2"
                        onClick={this.cancelConfirmCostForAll}
                        disabled={
                          state.calculatingFromBeginning ||
                          state.calculatingSelectedFromBeginning ||
                          state.calculatingCostFromBeginning ||
                          state.calculatingSelectedCostFromBeginning
                        }
                      >
                        <Text id="integration.energyMonitoring.recalculateAllCancelButton" defaultMessage="Cancel" />
                      </button>
                    </div>
                  </div>
                )}
                {!state.showConfirmRecalculateAll && !state.showConfirmCostAll && (
                  <div class="d-flex flex-wrap">
                    <button
                      class="btn btn-primary mr-2 mb-2"
                      disabled={
                        state.calculatingFromBeginning ||
                        state.calculatingSelectedFromBeginning ||
                        state.calculatingCostFromBeginning ||
                        state.calculatingSelectedCostFromBeginning ||
                        state.recalculateDateError ||
                        recalcFeatures.length === 0
                      }
                      onClick={this.calculateConsumptionAndCostForSelection}
                    >
                      {state.calculatingFromBeginning || state.calculatingSelectedFromBeginning ? (
                        <span>
                          <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
                          <Text
                            id={
                              (state.selectedFeaturesForRecalc || []).length > 0
                                ? 'integration.energyMonitoring.calculatingSelectedFeaturesFromBeginning'
                                : 'integration.energyMonitoring.calculatingFromBeginning'
                            }
                            defaultMessage="Starting calculation..."
                          />
                        </span>
                      ) : (
                        <span>
                          <i class="fe fe-play mr-2" />
                          <Text
                            id={
                              hasSelection
                                ? hasPeriod
                                  ? 'integration.energyMonitoring.calculateSelectedFeaturesOnPeriod'
                                  : 'integration.energyMonitoring.calculateSelectedFeaturesFromBeginning'
                                : hasPeriod
                                ? 'integration.energyMonitoring.calculateConsumptionAndCostOnPeriod'
                                : 'integration.energyMonitoring.calculateConsumptionAndCostFromBeginning'
                            }
                            defaultMessage="Calculate consumption and cost from beginning"
                          />
                        </span>
                      )}
                    </button>
                    <button
                      class="btn btn-outline-primary mb-2"
                      disabled={
                        state.calculatingCostFromBeginning ||
                        state.calculatingSelectedCostFromBeginning ||
                        state.calculatingFromBeginning ||
                        state.calculatingSelectedFromBeginning ||
                        state.recalculateDateError ||
                        recalcFeatures.length === 0
                      }
                      onClick={this.calculateCostForSelection}
                    >
                      {state.calculatingCostFromBeginning || state.calculatingSelectedCostFromBeginning ? (
                        <span>
                          <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
                          <Text
                            id={
                              (state.selectedFeaturesForRecalc || []).length > 0
                                ? 'integration.energyMonitoring.calculatingSelectedFeaturesCostFromBeginning'
                                : 'integration.energyMonitoring.calculatingCostFromBeginning'
                            }
                            defaultMessage="Starting cost calculation..."
                          />
                        </span>
                      ) : (
                        <span>
                          <i class="fe fe-play mr-2" />
                          <Text
                            id={
                              hasSelection
                                ? hasPeriod
                                  ? 'integration.energyMonitoring.calculateSelectedFeaturesCostOnPeriod'
                                  : 'integration.energyMonitoring.calculateSelectedFeaturesCostFromBeginning'
                                : hasPeriod
                                ? 'integration.energyMonitoring.calculateCostOnPeriod'
                                : 'integration.energyMonitoring.calculateCostFromBeginning'
                            }
                            defaultMessage="Calculate cost from beginning"
                          />
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };

    const renderPrices = () => {
      const priceGroups = groupPricesByName(state.prices);
      // Sort group names alphabetically
      const sortedGroupNames = Object.keys(priceGroups).sort((a, b) => a.localeCompare(b));

      return (
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
                  {sortedGroupNames.map(groupName => renderPriceGroup(groupName, priceGroups[groupName]))}
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
    };

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
                            {(() => {
                              const circularDeps = this.detectCircularDependencies();
                              if (circularDeps.length > 0) {
                                return (
                                  <div class="alert alert-warning" role="alert">
                                    <div class="d-flex align-items-start justify-content-between">
                                      <div>
                                        <h4 class="alert-heading">
                                          <i class="fe fe-alert-triangle mr-2" />
                                          <Text id="integration.energyMonitoring.circularDependencyDetected" />
                                        </h4>
                                        <p class="mb-2">
                                          <Text id="integration.energyMonitoring.circularDependencyDescription" />
                                        </p>
                                        <ul class="mb-0">
                                          {circularDeps.map((dep, idx) => {
                                            const featureName = dep.feature.__device
                                              ? `${dep.feature.__device.name} - ${dep.feature.name ||
                                                  dep.feature.selector}`
                                              : dep.feature.name || dep.feature.selector;
                                            return (
                                              <li key={idx}>
                                                <strong>{featureName}</strong>
                                                {dep.type === 'broken' && (
                                                  <span class="text-muted ml-1">
                                                    (<Text id="integration.energyMonitoring.brokenReference" />)
                                                  </span>
                                                )}
                                                {dep.type === 'cycle' && (
                                                  <span class="text-muted ml-1">
                                                    (<Text id="integration.energyMonitoring.circularReference" />)
                                                  </span>
                                                )}
                                                {dep.type === 'self' && (
                                                  <span class="text-muted ml-1">
                                                    (<Text id="integration.energyMonitoring.selfReference" />)
                                                  </span>
                                                )}
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      </div>
                                      <button
                                        class="btn btn-warning ml-3 text-nowrap flex-shrink-0"
                                        onClick={this.fixCircularDependencies}
                                        disabled={state.fixingCircularDependencies}
                                      >
                                        {state.fixingCircularDependencies ? (
                                          <span>
                                            <span
                                              class="spinner-border spinner-border-sm mr-2"
                                              role="status"
                                              aria-hidden="true"
                                            />
                                            <Text id="integration.energyMonitoring.fixing" />
                                          </span>
                                        ) : (
                                          <span>
                                            <i class="fe fe-tool mr-2" />
                                            <Text id="integration.energyMonitoring.fixAutomatically" />
                                          </span>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
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

export default withIntlAsProp(EnergyMonitoringPage);
