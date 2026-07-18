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

  onOAuthConnect = e => {
    e.preventDefault();
    this.props.connectOAuth(this.props.field);
  };

  render({ field, language, values, configuredSecrets, touchedSecrets, connectionStatus, oauthStatus }) {
    const label = getLocalizedText(field.label, language) || field.key;
    const description = getLocalizedText(field.description, language);
    const placeholder = getLocalizedText(field.placeholder, language) || '';
    const value = values[field.key];
    const fieldId = `config_${field.key}`;

    if (field.type === 'oauth2') {
      // the whole OAuth2 flow is relayed: the integration builds the
      // authorize URL, the tokens never transit through the frontend
      return (
        <div class="form-group">
          <label class="form-label">{label}</label>
          {oauthStatus === RequestStatus.Error && (
            <div class="alert alert-danger">
              <Text id="integration.externalIntegration.config.oauthConnectError" />
            </div>
          )}
          <div>
            <button
              type="button"
              class={cx('btn btn-primary', {
                'btn-loading': oauthStatus === RequestStatus.Getting
              })}
              disabled={oauthStatus === RequestStatus.Getting}
              onClick={this.onOAuthConnect}
            >
              <i class="fe fe-link mr-1" />
              <Text id="integration.externalIntegration.config.oauthConnectButton" />
            </button>
            {connectionStatus && (
              <span class={cx('badge ml-2', connectionStatus.connected ? 'badge-success' : 'badge-danger')}>
                {connectionStatus.connected ? (
                  <Text id="integration.externalIntegration.connection.connectedBadge" />
                ) : (
                  <Text id="integration.externalIntegration.connection.disconnectedBadge" />
                )}
              </span>
            )}
          </div>
          {connectionStatus && connectionStatus.message && (
            <small class="form-text text-muted">{getLocalizedText(connectionStatus.message, language)}</small>
          )}
          {description && <small class="form-text text-muted">{description}</small>}
        </div>
      );
    }

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
              <option key={option.value} value={option.value} selected={`${value}` === `${option.value}`}>
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
            placeholder={placeholder}
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
                  placeholder
                )
              }
              onInput={this.onInput}
            />
          </Localizer>
        )}
        {(field.type === 'string' || !['boolean', 'select', 'number', 'secret', 'oauth2'].includes(field.type)) && (
          <input
            id={fieldId}
            type="text"
            class="form-control"
            value={value === undefined || value === null ? '' : value}
            placeholder={placeholder}
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
  saveConfig,
  connectionStatus,
  oauthStatus,
  connectOAuth
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
        connectionStatus={connectionStatus}
        oauthStatus={oauthStatus}
        connectOAuth={connectOAuth}
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
