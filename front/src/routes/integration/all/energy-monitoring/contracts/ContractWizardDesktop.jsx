import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import HourSlotGrid from './HourSlotGrid';
import {
  localize,
  formatMoney,
  getMeterDevices,
  PROVIDER_BADGE,
  WIZARD_STEPS as STEPS,
  CREATE_NEW_METER as CREATE_NEW,
  MANUAL_TEMPLATE
} from './contractUtils';

// The contract wizard from 768px (docs/specs/energy-contracts.md 8.2): the four steps in one card.
// A presentation only: the state, the requests and the payload live in ContractWizard.jsx, which
// hands them over as props (the phone presentation, MobileContractWizard.jsx, gets the same).
class ContractWizardDesktop extends Component {
  renderSteps() {
    const { step } = this.props;
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
            disabled={index > step && !(index === 2 && this.props.template) && index !== step}
            onClick={() => this.props.setStep(index)}
          >
            {index + 1}. <Text id={`integration.energyMonitoring.contracts.wizard.${key}`} />
          </button>
        ))}
      </div>
    );
  }

  renderMeterStep() {
    const { form } = this.props;
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
            onChange={this.props.selectMeter}
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
          onClick={() => this.props.setStep(1)}
        >
          <Text id="global.next" defaultMessage="Next" /> <i class="fe fe-arrow-right" />
        </button>
      </div>
    );
  }

  renderTemplateStep() {
    const { templates, loadingTemplates, loadingTemplate, templatesError, countryFilter, search } = this.props;
    const language = this.props.language;
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
                onChange={e => this.props.setCountryFilter(e.target.value)}
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
                onInput={e => this.props.setSearch(e.target.value)}
              />
            </div>
          </div>
          <div class="list-group mb-3" data-cy="energy-contract-templates">
            {visible.map(template => (
              <button
                type="button"
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                key={`${template.provider.kind}-${template.key}-${template.variant || ''}`}
                onClick={() => this.props.selectTemplate(template)}
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
                    onClick={this.props.selectManual}
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
    const { form } = this.props;
    const language = this.props.language;
    const value = form.inputs[input.key];
    const label = localize(input.label, language) || input.key;
    let control;
    if (input.type === 'time_intervals') {
      control = <HourSlotGrid value={value} onChange={intervals => this.props.updateInput(input.key, intervals)} />;
    } else if (input.type === 'select') {
      control = (
        <select
          class="form-control"
          value={value === undefined ? '' : String(value)}
          onChange={e => {
            const option = (input.options || []).find(o => String(o) === e.target.value);
            this.props.updateInput(input.key, option === undefined ? e.target.value : option);
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
          onInput={e => this.props.updateInput(input.key, e.target.value === '' ? undefined : Number(e.target.value))}
        />
      );
    } else {
      control = (
        <input
          type="text"
          class="form-control"
          value={value === undefined ? '' : value}
          onInput={e => this.props.updateInput(input.key, e.target.value)}
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
    const { form, template, jsonMode, tariffJson, jsonError } = this.props;
    const dictionary = this.props.intl.dictionary.integration.energyMonitoring;
    const inputs = (template && template.inputs) || [];
    return (
      <div>
        {template && template.key !== MANUAL_TEMPLATE.key && (
          <p class="text-muted">
            <Text id="integration.energyMonitoring.contracts.selectedTemplate" />{' '}
            <strong>{localize(template.name, this.props.language)}</strong>
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
                onInput={e => this.props.updateForm('name', e.target.value)}
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
                onInput={e => this.props.updateForm('valid_from', e.target.value)}
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
                onInput={e => this.props.updateForm('valid_to', e.target.value)}
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
                onInput={e => this.props.updateForm('currency', e.target.value.toUpperCase())}
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
                onInput={e => this.props.updateForm('timezone', e.target.value)}
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
                onInput={e => this.props.updateForm('billing_period_start_day', e.target.value)}
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
                  onInput={e => this.props.updateForm('subscribed_power', e.target.value)}
                />
                <select
                  class="form-control"
                  style={{ maxWidth: '6rem' }}
                  value={form.power_unit}
                  onChange={e => this.props.updateForm('power_unit', e.target.value)}
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
              onChange={this.props.toggleJsonMode}
              disabled={!template}
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
              onInput={this.props.onTariffJsonChange}
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
            <button class="btn btn-outline-secondary mr-2 mb-2" onClick={() => this.props.setStep(1)}>
              <i class="fe fe-arrow-left" /> <Text id="global.back" defaultMessage="Back" />
            </button>
          )}
          <button
            class="btn btn-outline-secondary mr-2 mb-2"
            onClick={this.props.exportTemplate}
            disabled={!!jsonError}
          >
            <i class="fe fe-download" /> <Text id="integration.energyMonitoring.contracts.exportTemplate" />
          </button>
          <button
            class="btn btn-primary mb-2"
            data-cy="energy-contract-preview"
            disabled={!this.props.canGoToPreview() || form.pricing_mode === 'delegated'}
            onClick={this.props.runPreview}
          >
            <Text id="integration.energyMonitoring.contracts.wizard.preview" /> <i class="fe fe-arrow-right" />
          </button>
          {form.pricing_mode === 'delegated' && (
            <button class="btn btn-success mb-2 ml-2" disabled={!this.props.canGoToPreview()} onClick={this.props.save}>
              <i class="fe fe-save" /> <Text id="global.save" />
            </button>
          )}
        </div>
      </div>
    );
  }

  renderPreviewStep() {
    const { preview, loadingPreview, previewError, saving, saveError, form } = this.props;
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
            <button class="btn btn-outline-secondary mr-2" onClick={() => this.props.setStep(2)}>
              <i class="fe fe-arrow-left" /> <Text id="global.back" defaultMessage="Back" />
            </button>
            <button
              class="btn btn-success"
              data-cy="energy-contract-save"
              disabled={saving || !preview}
              onClick={this.props.save}
            >
              <i class="fe fe-save" /> <Text id="global.save" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  render(props) {
    const { step, loadingContract, saveError } = props;
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
            <button class="btn btn-outline-secondary ml-2" onClick={this.props.cancel}>
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

export default ContractWizardDesktop;
