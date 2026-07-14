import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { getLocalizedText } from '../utils';
import { RequestStatus } from '../../../../../utils/consts';

class ConfigField extends Component {
  onInput = e => {
    this.props.updateConfigValue(this.props.field, e.target.value);
  };

  onCheck = e => {
    this.props.updateConfigValue(this.props.field, e.target.checked);
  };

  render({ field, language, values, configuredSecrets, touchedSecrets }) {
    const label = getLocalizedText(field.label, language) || field.key;
    const description = getLocalizedText(field.description, language);
    const value = values[field.key];
    const fieldId = `config_${field.key}`;

    if (field.type === 'boolean') {
      return (
        <div class="form-group">
          <label class="custom-switch">
            <input type="checkbox" id={fieldId} class="custom-switch-input" checked={!!value} onClick={this.onCheck} />
            <span class="custom-switch-indicator" />
            <span class="custom-switch-description">{label}</span>
          </label>
          {description && <small class="form-text text-muted">{description}</small>}
        </div>
      );
    }

    return (
      <div class="form-group">
        <label class="form-label" for={fieldId}>
          {label}
          {field.required && <span class="form-required">*</span>}
        </label>
        {field.type === 'select' && (
          <select id={fieldId} class="form-control" onChange={this.onInput}>
            <option value="" selected={value === undefined || value === null || value === ''}>
              <Text id="global.emptySelectOption" />
            </option>
            {(field.options || []).map(option => (
              <option value={option.value} selected={`${value}` === `${option.value}`}>
                {getLocalizedText(option.label, language) || option.value}
              </option>
            ))}
          </select>
        )}
        {field.type === 'number' && (
          <input
            id={fieldId}
            type="number"
            class="form-control"
            value={value === undefined || value === null ? '' : value}
            min={field.min}
            max={field.max}
            onInput={this.onInput}
            required={field.required}
          />
        )}
        {field.type === 'secret' && (
          <Localizer>
            <input
              id={fieldId}
              type="password"
              class="form-control"
              autocomplete="new-password"
              value={touchedSecrets[field.key] ? value : ''}
              placeholder={
                configuredSecrets.includes(field.key) && !touchedSecrets[field.key] ? (
                  <Text id="integration.externalIntegration.config.secretConfiguredPlaceholder" />
                ) : (
                  ''
                )
              }
              onInput={this.onInput}
            />
          </Localizer>
        )}
        {(field.type === 'string' || !['boolean', 'select', 'number', 'secret'].includes(field.type)) && (
          <input
            id={fieldId}
            type="text"
            class="form-control"
            value={value === undefined || value === null ? '' : value}
            onInput={this.onInput}
            required={field.required}
          />
        )}
        {description && <small class="form-text text-muted">{description}</small>}
      </div>
    );
  }
}

const ConfigSchemaForm = ({
  schema,
  language,
  values,
  configuredSecrets,
  touchedSecrets,
  saveConfigStatus,
  updateConfigValue,
  saveConfig
}) => (
  <form onSubmit={saveConfig}>
    {saveConfigStatus === RequestStatus.Success && (
      <div class="alert alert-success">
        <Text id="integration.externalIntegration.config.saveSuccess" />
      </div>
    )}
    {saveConfigStatus === RequestStatus.Error && (
      <div class="alert alert-danger">
        <Text id="integration.externalIntegration.config.saveError" />
      </div>
    )}
    {schema.map(field => (
      <ConfigField
        key={field.key}
        field={field}
        language={language}
        values={values}
        configuredSecrets={configuredSecrets}
        touchedSecrets={touchedSecrets}
        updateConfigValue={updateConfigValue}
      />
    ))}
    <div class="form-footer">
      <button
        type="submit"
        class={cx('btn btn-success', {
          'btn-loading': saveConfigStatus === RequestStatus.Getting
        })}
        disabled={saveConfigStatus === RequestStatus.Getting}
      >
        <Text id="integration.externalIntegration.config.saveButton" />
      </button>
    </div>
  </form>
);

export default ConfigSchemaForm;
