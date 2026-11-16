import { Component } from 'preact';
import { route } from 'preact-router';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import { withMobileViewport } from '../../../../../components/mobile';
import { isSheetEntryOnTop } from '../../../../../components/sheet/sheetHistory';
import ContractWizardDesktop from './ContractWizardDesktop';
import MobileContractWizard from './MobileContractWizard';
import {
  localize,
  defaultInputValues,
  errorMessage,
  CREATE_NEW_METER as CREATE_NEW,
  MANUAL_TEMPLATE
} from './contractUtils';

const CONTRACTS_PATH = '/dashboard/integration/device/energy-monitoring/contracts';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MANUAL_TARIFF = {
  tariff_version: 1,
  components: [
    { key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.25 } },
    { key: 'subscription', kind: 'fixed', amount: 15, per: 'month' }
  ]
};

// the tariff of a delegated contract whose integration computes every cost (no fixed fee)
const EMPTY_DELEGATED_TARIFF = { tariff_version: 1, components: [] };

// what the user typed, serialized: the comparison that tells whether leaving would lose work
const snapshotOf = ({ form, tariffJson, jsonMode }) => JSON.stringify({ form, tariffJson, jsonMode });

// The 4-step contract wizard (docs/specs/energy-contracts.md 8.2): meter, template,
// parameters (or the JSON editor), preview over the last 7 days, then save.
//
// This component is the container: the state, the requests and the payload. It renders one of two
// presentations fed with the same view (getView): the card from 768px (ContractWizardDesktop.jsx)
// and the flow in steps of a phone (MobileContractWizard.jsx, docs/specs/mobile-pages/energy.md).
// Crossing the breakpoint (a phone turned, a window resized) swaps the presentation and keeps
// what was typed.
class ContractWizard extends Component {
  state = {
    step: 0,
    templates: [],
    loadingTemplates: false,
    templatesError: null,
    countryFilter: '',
    search: '',
    template: null,
    loadingTemplate: false,
    jsonMode: false,
    tariffJson: '',
    jsonError: null,
    preview: null,
    loadingPreview: false,
    previewError: null,
    saving: false,
    saveError: null,
    loadingContract: false,
    contractId: null,
    // edit mode: the contract as loaded, serialized (null while it loads, and when creating)
    savedSnapshot: null,
    form: {
      name: '',
      electric_meter_device_id: '',
      valid_from: new Date().toISOString().slice(0, 10),
      valid_to: '',
      currency: 'EUR',
      timezone: '',
      billing_period_start_day: 1,
      subscribed_power: '',
      power_unit: 'kVA',
      pricing_mode: 'rules',
      provider_kind: 'user',
      provider_service_id: null,
      template_key: null,
      template_version: null,
      inputs: {}
    }
  };

  componentDidMount() {
    this.loadTemplates();
    if (this.props.selector) {
      this.loadContract(this.props.selector);
    }
  }

  language() {
    return (this.props.user && this.props.user.language) || 'en';
  }

  loadTemplates = async () => {
    try {
      this.setState({ loadingTemplates: true, templatesError: null });
      const templates = await this.props.httpClient.get('/api/v1/energy_contract/template');
      this.setState({ templates: Array.isArray(templates) ? templates : [] });
    } catch (e) {
      this.setState({ templatesError: errorMessage(e) });
    } finally {
      this.setState({ loadingTemplates: false });
    }
  };

  // edit mode: the stored contract opens on the parameters step, in JSON mode
  loadContract = async selector => {
    try {
      this.setState({ loadingContract: true });
      const contract = await this.props.httpClient.get(`/api/v1/energy_contract/${selector}`);
      this.setState({
        step: 2,
        jsonMode: true,
        contractId: contract.id,
        tariffJson: JSON.stringify(contract.tariff, null, 2),
        template: { ...MANUAL_TEMPLATE, inputs: [] },
        form: {
          name: contract.name,
          electric_meter_device_id: contract.electric_meter_device_id,
          valid_from: contract.valid_from,
          valid_to: contract.valid_to || '',
          currency: contract.currency,
          timezone: contract.timezone,
          billing_period_start_day: contract.billing_period_start_day,
          subscribed_power: contract.subscribed_power === null ? '' : contract.subscribed_power,
          power_unit: contract.power_unit || 'kVA',
          pricing_mode: contract.pricing_mode,
          provider_kind: contract.provider_kind,
          provider_service_id: contract.provider_service_id,
          template_key: contract.template_key,
          template_version: contract.template_version,
          inputs: contract.inputs || {}
        }
      });
      this.setState(state => ({ savedSnapshot: snapshotOf(state) }));
    } catch (e) {
      this.setState({ saveError: errorMessage(e) });
    } finally {
      this.setState({ loadingContract: false });
    }
  };

  updateForm = (key, value) => {
    this.setState(({ form }) => ({ form: { ...form, [key]: value } }));
  };

  updateInput = (key, value) => {
    this.setState(({ form }) => ({ form: { ...form, inputs: { ...form.inputs, [key]: value } } }));
  };

  // the meter of the contract, or CREATE_NEW to create an MQTT meter and select it
  chooseMeter = async value => {
    if (value === CREATE_NEW) {
      const created = await this.props.createElectricMeter();
      if (created) {
        this.updateForm('electric_meter_device_id', created.id);
      }
      return;
    }
    this.updateForm('electric_meter_device_id', value);
  };

  selectMeter = e => this.chooseMeter(e.target.value);

  setStep = step => this.setState({ step });
  setCountryFilter = countryFilter => this.setState({ countryFilter });
  setSearch = search => this.setState({ search });

  // a navigation started while the entry of a sheet is on top of the history replaces it
  // (components/sheet/sheetHistory.js): "back" from the list then leaves the wizard once
  cancel = () => route(CONTRACTS_PATH, isSheetEntryOnTop());

  selectTemplate = async summary => {
    try {
      this.setState({ loadingTemplate: true, templatesError: null });
      const query = {};
      if (summary.variant !== undefined) {
        query.variant = summary.variant;
      }
      if (summary.provider && summary.provider.service_id) {
        query.service_id = summary.provider.service_id;
      }
      const template = await this.props.httpClient.get(
        `/api/v1/energy_contract/template/${summary.provider.kind}/${summary.key}`,
        query
      );
      this.setState(({ form }) => ({
        template,
        jsonMode: false,
        // a delegated template may carry no tariff at all: the integration prices everything
        tariffJson: JSON.stringify(
          template.tariff || (template.pricing_mode === 'delegated' ? EMPTY_DELEGATED_TARIFF : DEFAULT_MANUAL_TARIFF),
          null,
          2
        ),
        step: 2,
        form: {
          ...form,
          name: form.name || localize(template.name, this.language()),
          currency: template.currency || form.currency,
          timezone: template.timezone || form.timezone,
          subscribed_power:
            template.subscribed_power !== undefined && template.subscribed_power !== null
              ? template.subscribed_power
              : form.subscribed_power,
          power_unit: template.power_unit || form.power_unit,
          pricing_mode: template.pricing_mode || 'rules',
          provider_kind: template.provider.kind,
          provider_service_id: template.provider.service_id || null,
          template_key: template.key,
          template_version: template.version || null,
          inputs: defaultInputValues(template.inputs)
        }
      }));
    } catch (e) {
      this.setState({ templatesError: errorMessage(e) });
    } finally {
      this.setState({ loadingTemplate: false });
    }
  };

  selectManual = () => {
    this.setState(({ form }) => ({
      template: { ...MANUAL_TEMPLATE, inputs: [] },
      jsonMode: true,
      tariffJson: JSON.stringify(DEFAULT_MANUAL_TARIFF, null, 2),
      step: 2,
      form: {
        ...form,
        pricing_mode: 'rules',
        provider_kind: 'user',
        provider_service_id: null,
        template_key: null,
        inputs: {}
      }
    }));
  };

  // the tariff sent to the server: the template one (placeholders substituted server-side
  // with the inputs) or the JSON typed by the user
  getTariff = () => {
    const { jsonMode, tariffJson, template } = this.state;
    if (jsonMode || !template || !template.tariff) {
      return JSON.parse(tariffJson);
    }
    return template.tariff;
  };

  onTariffJsonChange = e => {
    const tariffJson = e.target.value;
    let jsonError = null;
    try {
      JSON.parse(tariffJson);
    } catch (err) {
      jsonError = err.message;
    }
    this.setState({ tariffJson, jsonError });
  };

  toggleJsonMode = () => {
    this.setState(({ jsonMode, template, tariffJson }) => ({
      jsonMode: !jsonMode,
      tariffJson: !jsonMode && template && template.tariff ? JSON.stringify(template.tariff, null, 2) : tariffJson
    }));
  };

  buildPayload = () => {
    const { form } = this.state;
    const payload = {
      name: form.name,
      electric_meter_device_id: form.electric_meter_device_id,
      valid_from: form.valid_from,
      valid_to: form.valid_to || null,
      currency: form.currency,
      billing_period_start_day: Number(form.billing_period_start_day) || 1,
      subscribed_power: form.subscribed_power === '' ? null : Number(form.subscribed_power),
      power_unit: form.subscribed_power === '' ? null : form.power_unit,
      pricing_mode: form.pricing_mode,
      provider_kind: form.provider_kind,
      provider_service_id: form.provider_service_id,
      template_key: form.template_key,
      template_version: form.template_version,
      tariff: this.getTariff(),
      inputs: Object.keys(form.inputs).length > 0 ? form.inputs : null
    };
    if (form.timezone) {
      payload.timezone = form.timezone;
    }
    return payload;
  };

  runPreview = async () => {
    try {
      this.setState({ loadingPreview: true, previewError: null, preview: null, step: 3 });
      const { form } = this.state;
      const to = new Date();
      const from = new Date(to.getTime() - 7 * ONE_DAY_MS);
      const preview = await this.props.httpClient.post('/api/v1/energy_contract/preview', {
        tariff: this.getTariff(),
        inputs: form.inputs,
        timezone: form.timezone || undefined,
        currency: form.currency,
        billing_period_start_day: Number(form.billing_period_start_day) || 1,
        // the validity bounds the per-day tiers and the accumulations like the saved contract will
        valid_from: form.valid_from || undefined,
        valid_to: form.valid_to || undefined,
        from: from.toISOString(),
        to: to.toISOString(),
        electric_meter_device_id: form.electric_meter_device_id || undefined
      });
      this.setState({ preview });
    } catch (e) {
      this.setState({ previewError: errorMessage(e) });
    } finally {
      this.setState({ loadingPreview: false });
    }
  };

  save = async () => {
    try {
      this.setState({ saving: true, saveError: null });
      const payload = this.buildPayload();
      if (this.props.selector) {
        await this.props.httpClient.patch(`/api/v1/energy_contract/${this.props.selector}`, payload);
      } else {
        await this.props.httpClient.post('/api/v1/energy_contract', payload);
      }
      this.saved = true;
      route(CONTRACTS_PATH, isSheetEntryOnTop());
    } catch (e) {
      this.setState({ saveError: errorMessage(e) });
    } finally {
      this.setState({ saving: false });
    }
  };

  // "export as template": the templates[] entry of a manifest or of a catalogue PR
  exportTemplate = () => {
    const { form, template } = this.state;
    let tariff;
    try {
      tariff = this.getTariff();
    } catch (e) {
      return;
    }
    const exported = {
      key: (form.template_key || form.name || 'my-contract')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64),
      name: { en: form.name },
      country: (template && template.country) || 'FR',
      currency: form.currency,
      timezone: form.timezone || undefined,
      pricing_mode: form.pricing_mode,
      version: new Date().toISOString().slice(0, 10),
      calendars: tariff.calendars || [],
      inputs: (template && template.inputs) || [],
      tariff
    };
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exported.key}.template.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  canGoToPreview = () => {
    const { form, jsonError } = this.state;
    return form.name && form.electric_meter_device_id && form.valid_from && form.currency && !jsonError;
  };

  dismissSaveError = () => this.setState({ saveError: null });
  dismissPreviewError = () => this.setState({ previewError: null });
  dismissTemplatesError = () => this.setState({ templatesError: null });

  // Would leaving lose work? A new contract holds something once a template (or the manual
  // entry) was chosen: before that there is a meter at most. An edited contract, once it differs
  // from what was loaded.
  isDirty = () => {
    if (this.saved) {
      return false;
    }
    if (this.props.selector) {
      return this.state.savedSnapshot !== null && snapshotOf(this.state) !== this.state.savedSnapshot;
    }
    return this.state.template !== null;
  };

  // What both presentations render from: the state, what is derived from it, and the actions
  getView() {
    return {
      ...this.state,
      selector: this.props.selector,
      devices: this.props.devices,
      intl: this.props.intl,
      language: this.language(),
      setStep: this.setStep,
      setCountryFilter: this.setCountryFilter,
      setSearch: this.setSearch,
      updateForm: this.updateForm,
      updateInput: this.updateInput,
      chooseMeter: this.chooseMeter,
      selectMeter: this.selectMeter,
      selectTemplate: this.selectTemplate,
      selectManual: this.selectManual,
      onTariffJsonChange: this.onTariffJsonChange,
      toggleJsonMode: this.toggleJsonMode,
      runPreview: this.runPreview,
      save: this.save,
      exportTemplate: this.exportTemplate,
      canGoToPreview: this.canGoToPreview,
      cancel: this.cancel,
      isDirty: this.isDirty,
      dismissSaveError: this.dismissSaveError,
      dismissPreviewError: this.dismissPreviewError,
      dismissTemplatesError: this.dismissTemplatesError
    };
  }

  render({ isMobile }) {
    const view = this.getView();
    return isMobile ? <MobileContractWizard {...view} /> : <ContractWizardDesktop {...view} />;
  }
}

export default withIntlAsProp(withMobileViewport(ContractWizard));
