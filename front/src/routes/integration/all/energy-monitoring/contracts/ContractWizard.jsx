import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { route } from 'preact-router';
import cx from 'classnames';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import HourSlotGrid from './HourSlotGrid';
import {
  localize,
  formatMoney,
  getMeterDevices,
  defaultInputValues,
  errorMessage,
  PROVIDER_BADGE
} from './contractUtils';

const STEPS = ['meter', 'template', 'parameters', 'preview'];
const CREATE_NEW = 'CREATE_NEW';
const MANUAL_TEMPLATE = { key: '__manual__' };
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

// The 4-step contract wizard (docs/specs/energy-contracts.md 8.2): meter, template,
// parameters (or the JSON editor), preview over the last 7 days, then save.
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

  selectMeter = async e => {
    const { value } = e.target;
    if (value === CREATE_NEW) {
      const created = await this.props.createElectricMeter();
      if (created) {
        this.updateForm('electric_meter_device_id', created.id);
      }
      return;
    }
    this.updateForm('electric_meter_device_id', value);
  };

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
      route('/dashboard/integration/device/energy-monitoring/contracts');
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
      country: 'FR',
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

  renderSteps() {
    const { step } = this.state;
    return (
      <div class="d-flex flex-wrap mb-3">
        {STEPS.map((key, index) => (
          <button
            type="button"
            key={key}
            class={cx('btn btn-sm mr-2 mb-2', {
              'btn-primary': index === step,
              'btn-outline-secondary': index !== step
            })}
            disabled={index > step && !(index === 2 && this.state.template) && index !== step}
            onClick={() => this.setState({ step: index })}
          >
            {index + 1}. <Text id={`integration.energyMonitoring.contracts.wizard.${key}`} />
          </button>
        ))}
      </div>
    );
  }

  renderMeterStep() {
    const { form } = this.state;
    const meters = getMeterDevices(this.props.devices);
    return (
      <div>
        <p class="text-muted">
          <Text id="integration.energyMonitoring.selectElectricMeterDescription" />
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.energyMonitoring.selectElectricMeter" />
          </label>
          <select
            class="form-control"
            data-cy="energy-contract-meter"
            value={form.electric_meter_device_id}
            onChange={this.selectMeter}
          >
            <option value="">-</option>
            {meters.map(device => (
              <option value={device.id} key={device.id}>
                {device.name}
              </option>
            ))}
            <option value={CREATE_NEW}>
              {this.props.intl.dictionary.integration.energyMonitoring.createElectricMeter}
            </option>
          </select>
        </div>
        <button
          class="btn btn-primary"
          data-cy="energy-contract-next"
          disabled={!form.electric_meter_device_id}
          onClick={() => this.setState({ step: 1 })}
        >
          <Text id="global.next" defaultMessage="Next" /> <i class="fe fe-arrow-right" />
        </button>
      </div>
    );
  }

  renderTemplateStep() {
    const { templates, loadingTemplates, loadingTemplate, templatesError, countryFilter, search } = this.state;
    const language = this.language();
    const countries = Array.from(new Set(templates.map(t => t.country).filter(Boolean))).sort();
    const visible = templates.filter(template => {
      if (countryFilter && template.country !== countryFilter) {
        return false;
      }
      if (search) {
        const haystack = `${localize(template.name, language)} ${template.key} ${template.provider.name}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }
      return true;
    });
    return (
      <div class={cx('dimmer', { active: loadingTemplates || loadingTemplate })}>
        <div class="loader" />
        <div class="dimmer-content">
          {templatesError && (
            <div class="alert alert-danger" role="alert">
              <Text id="integration.energyMonitoring.errorLoadingContracts" /> {templatesError}
            </div>
          )}
          <div class="row mb-3">
            <div class="col-md-4">
              <select
                class="form-control"
                value={countryFilter}
                onChange={e => this.setState({ countryFilter: e.target.value })}
              >
                <option value="">
                  {this.props.intl.dictionary.integration.energyMonitoring.contracts.allCountries}
                </option>
                {countries.map(country => (
                  <option value={country} key={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            <div class="col-md-8">
              <input
                type="text"
                class="form-control"
                placeholder={this.props.intl.dictionary.integration.energyMonitoring.contracts.searchTemplate}
                value={search}
                onInput={e => this.setState({ search: e.target.value })}
              />
            </div>
          </div>
          <div class="list-group mb-3" data-cy="energy-contract-templates">
            {visible.map(template => (
              <button
                type="button"
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                key={`${template.provider.kind}-${template.key}-${template.variant || ''}`}
                onClick={() => this.selectTemplate(template)}
              >
                <span>
                  <span class="font-weight-bold">{localize(template.name, language)}</span>
                  <span class="text-muted small ml-2">
                    {template.country} · {template.currency} ·{' '}
                    <Text id={`integration.energyMonitoring.contracts.mode.${template.pricing_mode}`} />
                  </span>
                </span>
                <span>
                  <span class={cx('badge', PROVIDER_BADGE[template.provider.kind])}>
                    <Text id={`integration.energyMonitoring.contracts.provider.${template.provider.kind}`} />
                    {template.provider.kind !== 'community' ? ` · ${template.provider.name}` : ''}
                  </span>
                  {template.provider.running === false && (
                    <span class="badge badge-warning ml-1">
                      <Text id="integration.energyMonitoring.contracts.providerStopped" />
                    </span>
                  )}
                </span>
              </button>
            ))}
            {visible.length === 0 && !loadingTemplates && (
              <div class="list-group-item text-muted">
                <Text id="integration.energyMonitoring.contracts.noTemplate" />
              </div>
            )}
          </div>
          <div class="alert alert-info">
            <h4 class="alert-heading">
              <Text id="integration.energyMonitoring.contractNotListedTitle" />
            </h4>
            <p>
              <Text id="integration.energyMonitoring.contractNotListedDescription" />
            </p>
            <ol class="pl-4 mb-0">
              <li class="mb-3">
                <Text id="integration.energyMonitoring.contractNotListedShare" />
                <div class="mt-2">
                  <a
                    href="https://github.com/GladysAssistant/energy-contracts"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-sm btn-outline-primary"
                  >
                    <Text id="integration.energyMonitoring.contractNotListedShareButton" />{' '}
                    <i class="fe fe-external-link" />
                  </a>
                </div>
              </li>
              <li class="mb-3">
                <Text id="integration.energyMonitoring.contracts.publishAsIntegration" />
              </li>
              <li>
                <Text id="integration.energyMonitoring.contractNotListedCreate" />
                <div class="mt-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    data-cy="energy-contract-manual"
                    onClick={this.selectManual}
                  >
                    <Text id="integration.energyMonitoring.contractNotListedCreateButton" /> <i class="fe fe-plus" />
                  </button>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  renderInput(input) {
    const { form } = this.state;
    const language = this.language();
    const value = form.inputs[input.key];
    const label = localize(input.label, language) || input.key;
    let control;
    if (input.type === 'time_intervals') {
      control = <HourSlotGrid value={value} onChange={intervals => this.updateInput(input.key, intervals)} />;
    } else if (input.type === 'select') {
      control = (
        <select
          class="form-control"
          value={value === undefined ? '' : String(value)}
          onChange={e => {
            const option = (input.options || []).find(o => String(o) === e.target.value);
            this.updateInput(input.key, option === undefined ? e.target.value : option);
          }}
        >
          {(input.options || []).map(option => (
            <option value={String(option)} key={String(option)}>
              {option}
            </option>
          ))}
        </select>
      );
    } else if (input.type === 'number') {
      control = (
        <input
          type="number"
          step="any"
          class="form-control"
          value={value === undefined ? '' : value}
          onInput={e => this.updateInput(input.key, e.target.value === '' ? undefined : Number(e.target.value))}
        />
      );
    } else {
      control = (
        <input
          type="text"
          class="form-control"
          value={value === undefined ? '' : value}
          onInput={e => this.updateInput(input.key, e.target.value)}
        />
      );
    }
    return (
      <div class="form-group" key={input.key}>
        <label class="form-label">
          {label}
          {input.unit ? <span class="text-muted"> ({input.unit})</span> : null}
          {input.required ? ' *' : ''}
        </label>
        {input.description && <small class="form-text text-muted mb-1">{localize(input.description, language)}</small>}
        {control}
      </div>
    );
  }

  renderParametersStep() {
    const { form, template, jsonMode, tariffJson, jsonError } = this.state;
    const dictionary = this.props.intl.dictionary.integration.energyMonitoring;
    const inputs = (template && template.inputs) || [];
    return (
      <div>
        {template && template.key !== MANUAL_TEMPLATE.key && (
          <p class="text-muted">
            <Text id="integration.energyMonitoring.contracts.selectedTemplate" />{' '}
            <strong>{localize(template.name, this.language())}</strong>
            {template.version ? ` (${template.version})` : ''}
          </p>
        )}
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.energyMonitoring.contractName" />
              </label>
              <input
                type="text"
                class="form-control"
                data-cy="energy-contract-name"
                placeholder={dictionary.contractNamePlaceholder}
                value={form.name}
                onInput={e => this.updateForm('name', e.target.value)}
              />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.energyMonitoring.startDate" />
              </label>
              <input
                type="date"
                class="form-control"
                data-cy="energy-contract-valid-from"
                value={form.valid_from}
                onInput={e => this.updateForm('valid_from', e.target.value)}
              />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.energyMonitoring.endDate" />
              </label>
              <input
                type="date"
                class="form-control"
                value={form.valid_to}
                onInput={e => this.updateForm('valid_to', e.target.value)}
              />
              <small class="form-text text-muted">
                <Text id="integration.energyMonitoring.leaveEndDateEmpty" />
              </small>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.energyMonitoring.currency" />
              </label>
              <input
                type="text"
                class="form-control"
                maxLength={3}
                value={form.currency}
                onInput={e => this.updateForm('currency', e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.energyMonitoring.contracts.timezone" />
              </label>
              <input
                type="text"
                class="form-control"
                placeholder={dictionary.contracts.timezonePlaceholder}
                value={form.timezone}
                onInput={e => this.updateForm('timezone', e.target.value)}
              />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.energyMonitoring.contracts.billingPeriodStartDay" />
              </label>
              <input
                type="number"
                min={1}
                max={31}
                class="form-control"
                value={form.billing_period_start_day}
                onInput={e => this.updateForm('billing_period_start_day', e.target.value)}
              />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.energyMonitoring.subscribedPower" />
              </label>
              <div class="input-group">
                <input
                  type="number"
                  step="any"
                  class="form-control"
                  value={form.subscribed_power}
                  onInput={e => this.updateForm('subscribed_power', e.target.value)}
                />
                <select
                  class="form-control"
                  style={{ maxWidth: '6rem' }}
                  value={form.power_unit}
                  onChange={e => this.updateForm('power_unit', e.target.value)}
                >
                  <option value="kVA">kVA</option>
                  <option value="kW">kW</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {!jsonMode && inputs.length > 0 && (
          <div class="mb-3">
            <h4>
              <Text id="integration.energyMonitoring.contracts.parameters" />
            </h4>
            {inputs.map(input => this.renderInput(input))}
          </div>
        )}
        {form.pricing_mode === 'delegated' && (
          <div class="alert alert-info">
            <Text id="integration.energyMonitoring.contracts.delegatedHelp" />
          </div>
        )}
        <div class="form-group">
          <label class="custom-switch">
            <input
              type="checkbox"
              class="custom-switch-input"
              checked={jsonMode}
              onChange={this.toggleJsonMode}
              disabled={!template || !template.tariff}
            />
            <span class="custom-switch-indicator" />
            <span class="custom-switch-description">
              <Text id="integration.energyMonitoring.contracts.jsonMode" />
            </span>
          </label>
        </div>
        {jsonMode && (
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.energyMonitoring.contracts.tariffJson" />
            </label>
            <textarea
              class={cx('form-control', { 'is-invalid': jsonError })}
              data-cy="energy-contract-tariff-json"
              rows={16}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              value={tariffJson}
              onInput={this.onTariffJsonChange}
            />
            {jsonError && <div class="invalid-feedback d-block">{jsonError}</div>}
            <small class="form-text text-muted">
              <Text id="integration.energyMonitoring.contracts.tariffJsonHelp" />{' '}
              <a href="https://github.com/GladysAssistant/energy-contracts" target="_blank" rel="noopener noreferrer">
                energy-contracts
              </a>
            </small>
          </div>
        )}
        <div class="d-flex flex-wrap">
          {!this.props.selector && (
            <button class="btn btn-outline-secondary mr-2 mb-2" onClick={() => this.setState({ step: 1 })}>
              <i class="fe fe-arrow-left" /> <Text id="global.back" defaultMessage="Back" />
            </button>
          )}
          <button class="btn btn-outline-secondary mr-2 mb-2" onClick={this.exportTemplate} disabled={!!jsonError}>
            <i class="fe fe-download" /> <Text id="integration.energyMonitoring.contracts.exportTemplate" />
          </button>
          <button
            class="btn btn-primary mb-2"
            data-cy="energy-contract-preview"
            disabled={!this.canGoToPreview() || form.pricing_mode === 'delegated'}
            onClick={this.runPreview}
          >
            <Text id="integration.energyMonitoring.contracts.wizard.preview" /> <i class="fe fe-arrow-right" />
          </button>
          {form.pricing_mode === 'delegated' && (
            <button class="btn btn-success mb-2 ml-2" disabled={!this.canGoToPreview()} onClick={this.save}>
              <i class="fe fe-save" /> <Text id="global.save" />
            </button>
          )}
        </div>
      </div>
    );
  }

  renderPreviewStep() {
    const { preview, loadingPreview, previewError, saving, saveError, form } = this.state;
    return (
      <div class={cx('dimmer', { active: loadingPreview })}>
        <div class="loader" />
        <div class="dimmer-content">
          {previewError && (
            <div class="alert alert-danger" role="alert" data-cy="energy-contract-preview-error">
              {previewError}
            </div>
          )}
          {preview && (
            <div data-cy="energy-contract-preview-result">
              {preview.synthetic && (
                <div class="alert alert-info">
                  <Text id="integration.energyMonitoring.contracts.previewSynthetic" />
                </div>
              )}
              <p class="text-muted">
                <Text id="integration.energyMonitoring.contracts.previewDescription" />
              </p>
              <div class="row mb-3">
                <div class="col-md-4">
                  <div class="card card-sm">
                    <div class="card-body">
                      <div class="text-muted small">
                        <Text id="integration.energyMonitoring.contracts.previewTotal" />
                      </div>
                      <div class="h3 mb-0">{formatMoney(preview.total, form.currency, 2)}</div>
                      <div class="text-muted small">
                        {Math.round(preview.kwh * 100) / 100} kWh · {preview.intervals}{' '}
                        <Text id="integration.energyMonitoring.contracts.intervals" />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-8">
                  <table class="table table-sm mb-0">
                    <tbody>
                      {Object.keys(preview.components).map(key => (
                        <tr key={key}>
                          <td>{key}</td>
                          <td class="text-right">{formatMoney(preview.components[key], form.currency, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {Object.keys(preview.warnings || {}).length > 0 && (
                <div class="alert alert-warning">
                  <Text id="integration.energyMonitoring.contracts.previewWarnings" />{' '}
                  {Object.keys(preview.warnings)
                    .map(reason => `${reason}: ${preview.warnings[reason]}`)
                    .join(', ')}
                </div>
              )}
              <div style={{ maxHeight: '18rem', overflowY: 'auto' }} class="mb-3">
                <table class="table table-sm table-striped mb-0">
                  <thead>
                    <tr>
                      <th>
                        <Text id="integration.energyMonitoring.contracts.sampleTime" />
                      </th>
                      <th class="text-right">kWh</th>
                      <th class="text-right">
                        <Text id="integration.energyMonitoring.contracts.samplePrice" />
                      </th>
                      <th class="text-right">
                        <Text id="integration.energyMonitoring.contracts.sampleCost" />
                      </th>
                      <th>
                        <Text id="integration.energyMonitoring.contracts.sampleLabel" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.samples.map(sample => (
                      <tr key={sample.starts_at}>
                        <td>{new Date(sample.starts_at).toLocaleString()}</td>
                        <td class="text-right">{Math.round(sample.kwh * 1000) / 1000}</td>
                        <td class="text-right">{formatMoney(sample.unit_price, form.currency)}</td>
                        <td class="text-right">{formatMoney(sample.cost, form.currency)}</td>
                        <td>{sample.label || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {saveError && (
            <div class="alert alert-danger" role="alert" data-cy="energy-contract-save-error">
              {saveError}
            </div>
          )}
          <div class="d-flex">
            <button class="btn btn-outline-secondary mr-2" onClick={() => this.setState({ step: 2 })}>
              <i class="fe fe-arrow-left" /> <Text id="global.back" defaultMessage="Back" />
            </button>
            <button
              class="btn btn-success"
              data-cy="energy-contract-save"
              disabled={saving || !preview}
              onClick={this.save}
            >
              <i class="fe fe-save" /> <Text id="global.save" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  render(props, { step, loadingContract, saveError }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text
              id={
                props.selector
                  ? 'integration.energyMonitoring.contracts.editTitle'
                  : 'integration.energyMonitoring.contracts.createTitle'
              }
            />
          </h1>
          <div class="page-options d-flex">
            <button
              class="btn btn-outline-secondary ml-2"
              onClick={() => route('/dashboard/integration/device/energy-monitoring/contracts')}
            >
              <Text id="global.cancel" />
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class={cx('dimmer', { active: loadingContract })}>
            <div class="loader" />
            <div class="dimmer-content">
              {this.renderSteps()}
              {step !== 3 && saveError && (
                <div class="alert alert-danger" role="alert">
                  {saveError}
                </div>
              )}
              {step === 0 && this.renderMeterStep()}
              {step === 1 && this.renderTemplateStep()}
              {step === 2 && this.renderParametersStep()}
              {step === 3 && this.renderPreviewStep()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(ContractWizard);
