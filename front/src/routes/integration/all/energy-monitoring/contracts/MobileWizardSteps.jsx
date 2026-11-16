import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import BottomSheet from '../../../../../components/sheet/BottomSheet';
import {
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobilePill,
  MobileNotice,
  MobileField,
  MobileSwitch,
  fieldClass,
  BigButton,
  kitStyle
} from '../../../../../components/mobile';
import MobileHourRanges from './MobileHourRanges';
import { localize, formatMoney, getMeterDevices, MANUAL_TEMPLATE } from './contractUtils';
import style from '../mobile.css';

const PROVIDER_PILL_TONE = {
  community: 'accent',
  integration: undefined,
  internal: 'success',
  user: undefined
};
// the preview returns up to 48 sample intervals: a day of them is enough to check a tariff
const SAMPLES_SHOWN = 8;

const text = (intl, key) => get(intl.dictionary, `integration.energyMonitoring.${key}`);

const SelectedCheck = ({ selected }) => (
  <span class={style.check} aria-hidden="true">
    {selected && <i class="fe fe-check" />}
  </span>
);

/**
 * @description Step 1 of the contract wizard on a phone: the meter the contract prices. One row
 * per meter (a radio), and a row creating an MQTT meter.
 */
export const MeterStep = ({ devices, form, chooseMeter, creatingMeter, createMeter }) => {
  const meters = getMeterDevices(devices);
  return (
    <div data-cy="energy-contract-step-meter">
      <h2 class={style.stepTitle}>
        <Text id="integration.energyMonitoring.mobile.meterTitle" />
      </h2>
      <p class={style.stepLead}>
        <Text id="integration.energyMonitoring.selectElectricMeterDescription" />
      </p>
      <MobileGroup role="radiogroup">
        {meters.map(device => {
          const selected = form.electric_meter_device_id === device.id;
          return (
            <MobileRow
              key={device.id}
              icon="zap"
              iconTone={selected ? undefined : 'neutral'}
              title={device.name}
              onClick={() => chooseMeter(device.id)}
              chevron={false}
              trailing={<SelectedCheck selected={selected} />}
              role="radio"
              aria-checked={selected ? 'true' : 'false'}
              dataCy="energy-contract-meter-row"
            />
          );
        })}
        <MobileRow
          icon="plus"
          tone="accent"
          title={<Text id="integration.energyMonitoring.mobile.createMeter" />}
          subtitle={<Text id="integration.energyMonitoring.mobile.createMeterHelp" />}
          onClick={createMeter}
          disabled={creatingMeter}
          chevron={false}
          dataCy="energy-contract-meter-create"
        />
      </MobileGroup>
    </div>
  );
};

/**
 * @description Step 2: the template of the contract — a search, the countries as chips, one row
 * per template, and what to do when the contract is not listed.
 */
export class TemplateStep extends Component {
  state = {
    notListedOpen: false
  };

  openNotListed = () => this.setState({ notListedOpen: true });
  closeNotListed = () => this.setState({ notListedOpen: false });

  selectManual = () => {
    this.setState({ notListedOpen: false });
    this.props.selectManual();
  };

  render(props, { notListedOpen }) {
    const { templates, loadingTemplates, loadingTemplate, countryFilter, search, language, intl } = props;
    const countries = Array.from(new Set(templates.map(template => template.country).filter(Boolean))).sort();
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
      <div data-cy="energy-contract-step-template">
        <h2 class={style.stepTitle}>
          <Text id="integration.energyMonitoring.mobile.templateTitle" />
        </h2>
        <label class={kitStyle.search}>
          <i class="fe fe-search" aria-hidden="true" />
          <input
            type="search"
            class={kitStyle.searchInput}
            value={search}
            onInput={e => props.setSearch(e.target.value)}
            placeholder={text(intl, 'contracts.searchTemplate')}
            aria-label={text(intl, 'contracts.searchTemplate')}
            enterkeyhint="search"
            data-cy="energy-contract-template-search"
          />
        </label>
        {countries.length > 1 && (
          <div class={kitStyle.chips} data-cy="energy-contract-countries">
            <button
              type="button"
              class={cx(kitStyle.chip, style.filterChip, { [kitStyle.chipSelected]: !countryFilter })}
              aria-pressed={!countryFilter ? 'true' : 'false'}
              onClick={() => props.setCountryFilter('')}
            >
              <Text id="integration.energyMonitoring.contracts.allCountries" />
            </button>
            {countries.map(country => (
              <button
                key={country}
                type="button"
                class={cx(kitStyle.chip, style.filterChip, { [kitStyle.chipSelected]: countryFilter === country })}
                aria-pressed={countryFilter === country ? 'true' : 'false'}
                onClick={() => props.setCountryFilter(country)}
              >
                {country}
              </button>
            ))}
          </div>
        )}
        <div class={cx('dimmer', { active: loadingTemplates || loadingTemplate })}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class={style.templateList} data-cy="energy-contract-templates">
              {visible.map(template => (
                <MobileRow
                  card
                  key={`${template.provider.kind}-${template.key}-${template.variant || ''}`}
                  icon="file-text"
                  title={localize(template.name, language)}
                  subtitle={
                    <span>
                      {[template.country, template.currency].filter(Boolean).join(' · ')}
                      {' · '}
                      <Text id={`integration.energyMonitoring.contracts.mode.${template.pricing_mode}`} />
                    </span>
                  }
                  onClick={() => props.selectTemplate(template)}
                  disabled={loadingTemplate}
                  dataCy="energy-contract-template-row"
                >
                  <span class={style.pillLine}>
                    <MobilePill tone={PROVIDER_PILL_TONE[template.provider.kind]}>
                      <Text id={`integration.energyMonitoring.contracts.provider.${template.provider.kind}`} />
                      {template.provider.kind !== 'community' ? ` · ${template.provider.name}` : ''}
                    </MobilePill>
                    {template.provider.running === false && (
                      <MobilePill tone="warning">
                        <Text id="integration.energyMonitoring.contracts.providerStopped" />
                      </MobilePill>
                    )}
                  </span>
                </MobileRow>
              ))}
            </div>
            {visible.length === 0 && !loadingTemplates && (
              <p class={kitStyle.footnote} data-cy="energy-contract-no-template">
                <Text id="integration.energyMonitoring.contracts.noTemplate" />
              </p>
            )}
          </div>
        </div>

        <MobileSectionHeader title={<Text id="integration.energyMonitoring.contractNotListedTitle" />} />
        <MobileGroup>
          <MobileRow
            icon="edit-3"
            title={<Text id="integration.energyMonitoring.contractNotListedCreateButton" />}
            subtitle={<Text id="integration.energyMonitoring.mobile.manualHelp" />}
            onClick={props.selectManual}
            dataCy="energy-contract-manual"
          />
          <MobileRow
            icon="users"
            iconTone="neutral"
            title={<Text id="integration.energyMonitoring.mobile.proposeTitle" />}
            subtitle={<Text id="integration.energyMonitoring.mobile.proposeHelp" />}
            onClick={this.openNotListed}
            dataCy="energy-contract-not-listed"
          />
        </MobileGroup>

        <BottomSheet
          open={notListedOpen}
          title={text(intl, 'contractNotListedTitle')}
          onClose={this.closeNotListed}
          dataCy="energy-contract-not-listed-sheet"
        >
          <p class={kitStyle.sheetText}>
            <Text id="integration.energyMonitoring.contractNotListedDescription" />
          </p>
          <p class={kitStyle.sheetText}>
            <Text id="integration.energyMonitoring.contractNotListedShare" />
          </p>
          <p class={kitStyle.sheetText}>
            <Text id="integration.energyMonitoring.contracts.publishAsIntegration" />
          </p>
          <p class={kitStyle.sheetText}>
            <Text id="integration.energyMonitoring.contractNotListedCreate" />
          </p>
          <div class={kitStyle.buttons}>
            <BigButton
              variant="primary"
              icon="external-link"
              href="https://github.com/GladysAssistant/energy-contracts"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Text id="integration.energyMonitoring.contractNotListedShareButton" />
            </BigButton>
            <BigButton onClick={this.selectManual} icon="edit-3">
              <Text id="integration.energyMonitoring.contractNotListedCreateButton" />
            </BigButton>
          </div>
        </BottomSheet>
      </div>
    );
  }
}

// "EUR · Europe/Paris · billed from day 1 · 6 kVA": what the billing sheet holds, on its row
const BillingSummary = ({ form, intl }) => (
  <span>
    {[
      form.currency,
      form.timezone || text(intl, 'contracts.timezonePlaceholder'),
      (text(intl, 'mobile.billingDay') || '').replace('{{day}}', Number(form.billing_period_start_day) || 1),
      form.subscribed_power !== '' && form.subscribed_power !== null && form.subscribed_power !== undefined
        ? `${form.subscribed_power} ${form.power_unit}`
        : null
    ]
      .filter(Boolean)
      .join(' · ')}
  </span>
);

/**
 * @description Step 3: the parameters of the contract. The name and the dates first, the billing
 * settings behind a row, the inputs of the template, then what is advanced (the JSON definition
 * of the tariff, the export as a template).
 */
export class ParametersStep extends Component {
  state = {
    billingOpen: false
  };

  openBilling = () => this.setState({ billingOpen: true });
  closeBilling = () => this.setState({ billingOpen: false });

  renderInput = input => {
    const { form, language, updateInput, intl } = this.props;
    const value = form.inputs[input.key];
    const label = localize(input.label, language) || input.key;
    const id = `contractInput-${input.key}`;
    let control;
    if (input.type === 'time_intervals') {
      control = (
        <MobileHourRanges value={value} onChange={intervals => updateInput(input.key, intervals)} intl={intl} />
      );
    } else if (input.type === 'select') {
      control = (
        <select
          id={id}
          class={fieldClass.select}
          value={value === undefined ? '' : String(value)}
          onChange={e => {
            const option = (input.options || []).find(o => String(o) === e.target.value);
            updateInput(input.key, option === undefined ? e.target.value : option);
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
      const field = (
        <input
          id={id}
          type="number"
          step="any"
          inputmode="decimal"
          class={fieldClass.input}
          value={value === undefined ? '' : value}
          onInput={e => updateInput(input.key, e.target.value === '' ? undefined : Number(e.target.value))}
          enterkeyhint="done"
        />
      );
      control = input.unit ? (
        <div class={fieldClass.group}>
          {field}
          <span class={cx(fieldClass.addon, style.unitAddon)}>{input.unit}</span>
        </div>
      ) : (
        field
      );
    } else {
      control = (
        <input
          id={id}
          type="text"
          class={fieldClass.input}
          value={value === undefined ? '' : value}
          onInput={e => updateInput(input.key, e.target.value)}
          enterkeyhint="done"
        />
      );
    }
    return (
      <MobileField
        key={input.key}
        htmlFor={input.type === 'time_intervals' ? undefined : id}
        label={
          <span>
            {label}
            {input.unit && input.type !== 'number' ? ` (${input.unit})` : ''}
            {input.required ? ' *' : ''}
          </span>
        }
        help={input.description ? localize(input.description, language) : null}
        data-cy={`energy-contract-input-${input.key}`}
      >
        {control}
      </MobileField>
    );
  };

  render(props, { billingOpen }) {
    const { form, template, jsonMode, tariffJson, jsonError, updateForm, intl, language } = props;
    const inputs = (template && template.inputs) || [];
    const namedTemplate = template && template.key !== MANUAL_TEMPLATE.key;
    return (
      <div data-cy="energy-contract-step-parameters">
        <h2 class={style.stepTitle}>
          <Text id="integration.energyMonitoring.mobile.parametersTitle" />
        </h2>
        {namedTemplate && (
          <p class={style.stepLead} data-cy="energy-contract-selected-template">
            <Text id="integration.energyMonitoring.contracts.selectedTemplate" />{' '}
            <strong>{localize(template.name, language)}</strong>
            {template.version ? ` (${template.version})` : ''}
          </p>
        )}
        <MobileField label={<Text id="integration.energyMonitoring.contractName" />} htmlFor="contractName">
          <input
            id="contractName"
            type="text"
            class={fieldClass.input}
            placeholder={text(intl, 'contractNamePlaceholder')}
            value={form.name}
            onInput={e => updateForm('name', e.target.value)}
            autocomplete="off"
            autocapitalize="sentences"
            enterkeyhint="done"
            data-cy="energy-contract-name"
          />
        </MobileField>
        <MobileField label={<Text id="integration.energyMonitoring.startDate" />} htmlFor="contractValidFrom">
          <input
            id="contractValidFrom"
            type="date"
            class={fieldClass.input}
            value={form.valid_from}
            onInput={e => updateForm('valid_from', e.target.value)}
            data-cy="energy-contract-valid-from"
          />
        </MobileField>
        <MobileField
          label={<Text id="integration.energyMonitoring.endDate" />}
          htmlFor="contractValidTo"
          help={<Text id="integration.energyMonitoring.leaveEndDateEmpty" />}
        >
          <input
            id="contractValidTo"
            type="date"
            class={fieldClass.input}
            value={form.valid_to}
            onInput={e => updateForm('valid_to', e.target.value)}
            data-cy="energy-contract-valid-to"
          />
        </MobileField>

        <MobileGroup>
          <MobileRow
            icon="credit-card"
            title={<Text id="integration.energyMonitoring.mobile.billingRow" />}
            subtitle={<BillingSummary form={form} intl={intl} />}
            onClick={this.openBilling}
            dataCy="energy-contract-billing-row"
          />
        </MobileGroup>

        {!jsonMode && inputs.length > 0 && (
          <div data-cy="energy-contract-inputs">
            <MobileSectionHeader title={<Text id="integration.energyMonitoring.contracts.parameters" />} />
            {inputs.map(this.renderInput)}
          </div>
        )}
        {form.pricing_mode === 'delegated' && (
          <MobileNotice icon="info">
            <Text id="integration.energyMonitoring.contracts.delegatedHelp" />
          </MobileNotice>
        )}

        <MobileSectionHeader title={<Text id="integration.energyMonitoring.mobile.advanced" />} />
        <MobileGroup>
          <MobileRow
            title={<Text id="integration.energyMonitoring.mobile.jsonMode" />}
            subtitle={<Text id="integration.energyMonitoring.mobile.jsonModeHelp" />}
            trailing={
              <MobileSwitch
                checked={jsonMode}
                onChange={props.toggleJsonMode}
                disabled={!template}
                label={text(intl, 'mobile.jsonMode')}
                dataCy="energy-contract-json-mode"
              />
            }
          />
          <MobileRow
            icon="download"
            iconTone="neutral"
            title={<Text id="integration.energyMonitoring.contracts.exportTemplate" />}
            subtitle={<Text id="integration.energyMonitoring.mobile.exportHelp" />}
            onClick={props.exportTemplate}
            disabled={Boolean(jsonError)}
            chevron={false}
            dataCy="energy-contract-export"
          />
        </MobileGroup>
        {jsonMode && (
          <MobileField
            class="mt-3"
            label={<Text id="integration.energyMonitoring.contracts.tariffJson" />}
            htmlFor="contractTariffJson"
            error={jsonError}
            help={
              <span>
                <Text id="integration.energyMonitoring.contracts.tariffJsonHelp" />{' '}
                <a href="https://github.com/GladysAssistant/energy-contracts" target="_blank" rel="noopener noreferrer">
                  energy-contracts
                </a>
              </span>
            }
          >
            <textarea
              id="contractTariffJson"
              class={cx(fieldClass.textarea, style.jsonField, { [fieldClass.invalid]: jsonError })}
              rows={14}
              value={tariffJson}
              onInput={props.onTariffJsonChange}
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck={false}
              data-cy="energy-contract-tariff-json"
            />
          </MobileField>
        )}

        <BottomSheet
          open={billingOpen}
          title={text(intl, 'mobile.billingRow')}
          onClose={this.closeBilling}
          onOk={this.closeBilling}
          dataCy="energy-contract-billing-sheet"
        >
          <MobileField label={<Text id="integration.energyMonitoring.currency" />} htmlFor="contractCurrency">
            <input
              id="contractCurrency"
              type="text"
              class={fieldClass.input}
              maxLength={3}
              value={form.currency}
              onInput={e => updateForm('currency', e.target.value.toUpperCase())}
              autocomplete="off"
              autocapitalize="characters"
              spellcheck={false}
              data-cy="energy-contract-currency"
            />
          </MobileField>
          <MobileField
            label={<Text id="integration.energyMonitoring.contracts.timezone" />}
            htmlFor="contractTimezone"
            help={<Text id="integration.energyMonitoring.mobile.timezoneHelp" />}
          >
            <input
              id="contractTimezone"
              type="text"
              class={fieldClass.input}
              placeholder={text(intl, 'contracts.timezonePlaceholder')}
              value={form.timezone}
              onInput={e => updateForm('timezone', e.target.value)}
              autocomplete="off"
              autocapitalize="off"
              spellcheck={false}
              data-cy="energy-contract-timezone"
            />
          </MobileField>
          <MobileField
            label={<Text id="integration.energyMonitoring.contracts.billingPeriodStartDay" />}
            htmlFor="contractBillingDay"
          >
            <input
              id="contractBillingDay"
              type="number"
              inputmode="numeric"
              min={1}
              max={31}
              class={fieldClass.input}
              value={form.billing_period_start_day}
              onInput={e => updateForm('billing_period_start_day', e.target.value)}
              data-cy="energy-contract-billing-day"
            />
          </MobileField>
          <MobileField label={<Text id="integration.energyMonitoring.subscribedPower" />} htmlFor="contractPower">
            <div class={fieldClass.group}>
              <input
                id="contractPower"
                type="number"
                step="any"
                inputmode="decimal"
                class={fieldClass.input}
                value={form.subscribed_power}
                onInput={e => updateForm('subscribed_power', e.target.value)}
                data-cy="energy-contract-power"
              />
              <Localizer>
                <select
                  class={cx(fieldClass.select, style.powerUnit)}
                  value={form.power_unit}
                  onChange={e => updateForm('power_unit', e.target.value)}
                  aria-label={<Text id="integration.energyMonitoring.mobile.powerUnit" />}
                >
                  <option value="kVA">kVA</option>
                  <option value="kW">kW</option>
                </select>
              </Localizer>
            </div>
          </MobileField>
        </BottomSheet>
      </div>
    );
  }
}

/**
 * @description Step 4: the last 7 days priced with the contract. The total as a headline, the
 * components as rows, then a few of the sample intervals (all of them on demand).
 */
export class PreviewStep extends Component {
  state = {
    showAllSamples: false
  };

  showAllSamples = () => this.setState({ showAllSamples: true });

  render({ preview, loadingPreview, form, language }, { showAllSamples }) {
    if (loadingPreview) {
      return (
        <div data-cy="energy-contract-step-preview">
          <h2 class={style.stepTitle}>
            <Text id="integration.energyMonitoring.contracts.wizard.preview" />
          </h2>
          <div class="dimmer active">
            <div class="loader" />
            <div class={cx('dimmer-content', style.loading)} />
          </div>
        </div>
      );
    }
    const samples = (preview && preview.samples) || [];
    const shownSamples = showAllSamples ? samples : samples.slice(0, SAMPLES_SHOWN);
    return (
      <div data-cy="energy-contract-step-preview">
        <h2 class={style.stepTitle}>
          <Text id="integration.energyMonitoring.contracts.wizard.preview" />
        </h2>
        {preview && (
          <div data-cy="energy-contract-preview-result">
            <p class={style.stepLead}>
              <Text id="integration.energyMonitoring.contracts.previewDescription" />
            </p>
            {preview.synthetic && (
              <MobileNotice icon="info">
                <Text id="integration.energyMonitoring.contracts.previewSynthetic" />
              </MobileNotice>
            )}
            <div class={style.total}>
              <span class={style.totalLabel}>
                <Text id="integration.energyMonitoring.contracts.previewTotal" />
              </span>
              <span class={style.totalValue} data-cy="energy-contract-preview-total">
                {formatMoney(preview.total, form.currency, 2)}
              </span>
              <span class={style.totalSub}>
                {Math.round(preview.kwh * 100) / 100} kWh · {preview.intervals}{' '}
                <Text id="integration.energyMonitoring.contracts.intervals" />
              </span>
            </div>
            {Object.keys(preview.components || {}).length > 0 && (
              <MobileGroup data-cy="energy-contract-preview-components">
                {Object.keys(preview.components).map(key => (
                  <MobileRow
                    key={key}
                    title={<span class={style.code}>{key}</span>}
                    trailing={
                      <span class={style.amount}>{formatMoney(preview.components[key], form.currency, 2)}</span>
                    }
                  />
                ))}
              </MobileGroup>
            )}
            {Object.keys(preview.warnings || {}).length > 0 && (
              <div class="mt-3">
                <MobileNotice tone="warning" icon="alert-triangle">
                  <Text id="integration.energyMonitoring.contracts.previewWarnings" />{' '}
                  {Object.keys(preview.warnings)
                    .map(reason => `${reason}: ${preview.warnings[reason]}`)
                    .join(', ')}
                </MobileNotice>
              </div>
            )}
            {samples.length > 0 && (
              <div>
                <MobileSectionHeader title={<Text id="integration.energyMonitoring.mobile.samplesTitle" />} />
                <MobileGroup data-cy="energy-contract-preview-samples">
                  {shownSamples.map(sample => (
                    <MobileRow
                      key={sample.starts_at}
                      title={new Date(sample.starts_at).toLocaleString(language, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      subtitle={
                        <span>
                          {Math.round(sample.kwh * 1000) / 1000} kWh × {formatMoney(sample.unit_price, form.currency)}
                          {sample.label ? ` · ${sample.label}` : ''}
                        </span>
                      }
                      trailing={<span class={style.amount}>{formatMoney(sample.cost, form.currency)}</span>}
                    />
                  ))}
                </MobileGroup>
                {!showAllSamples && samples.length > SAMPLES_SHOWN && (
                  <button
                    type="button"
                    class={kitStyle.linkButton}
                    onClick={this.showAllSamples}
                    data-cy="energy-contract-preview-show-all"
                  >
                    <Text id="integration.energyMonitoring.mobile.showAllSamples" fields={{ count: samples.length }} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
