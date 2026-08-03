import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { getLocalizedText, getUrlDomain } from '../utils';
import { RequestStatus } from '../../../../../utils/consts';
import { OAUTH_REDIRECT_URI, getOAuthCallbackPath } from '../../../../../utils/oauth';

// the redirect URI is meant to be copied into the developer application of the
// provider: a click should select all of it
const selectOnFocus = e => e.target.select();

class ConfigField extends Component {
  onInput = e => {
    this.props.updateConfigValue(this.props.field, e.target.value);
  };

  onCheck = e => {
    this.props.updateConfigValue(this.props.field, e.target.checked);
  };

  onMultiSelectToggle = e => {
    const { field, values } = this.props;
    const currentValues = Array.isArray(values[field.key]) ? values[field.key] : [];
    const newValues = e.target.checked
      ? [...currentValues, e.target.value]
      : currentValues.filter(value => value !== e.target.value);
    this.props.updateConfigValue(field, newValues);
  };

  onOAuthConnect = e => {
    e.preventDefault();
    this.props.connectOAuth(this.props.field);
  };

  onCopyRedirectUri = async e => {
    const input = e.target.closest('.input-group').querySelector('input');
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(input.value);
      this.setState({ redirectUriCopied: true });
      if (this.copyTimer) {
        clearTimeout(this.copyTimer);
      }
      this.copyTimer = setTimeout(() => this.setState({ redirectUriCopied: false }), 2000);
    }
  };

  componentWillUnmount() {
    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
      this.copyTimer = null;
    }
  }

  render({
    field,
    language,
    values,
    configuredSecrets,
    touchedSecrets,
    connectionStatus,
    oauthStatus,
    selector,
    dynamicOptions
  }) {
    const label = getLocalizedText(field.label, language) || field.key;
    const description = getLocalizedText(field.description, language);
    const placeholder = getLocalizedText(field.placeholder, language) || '';
    const value = values[field.key];
    const fieldId = `config_${field.key}`;
    // a select/multi_select can replace its static options with a
    // core-defined source ("devices": the already-created devices of the
    // integration, label = device name, value = external_id)
    const options = field.source ? (dynamicOptions && dynamicOptions[field.source]) || [] : field.options || [];

    if (field.type === 'section') {
      // purely presentational intro block splitting the form: title,
      // plain text and typed links opened in a new tab with the target
      // domain displayed (no value, no input)
      return (
        <div class="form-group mt-4">
          <h4 class="mb-1">{label}</h4>
          {description && <p class="text-muted small mb-2">{description}</p>}
          {(field.links || []).map(link => (
            <div>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <i class="fe fe-external-link mr-1" />
                {getLocalizedText(link.label, language) || link.url}
              </a>{' '}
              <span class="text-muted small">({getUrlDomain(link.url)})</span>
            </div>
          ))}
        </div>
      );
    }

    if (field.type === 'oauth2') {
      // the whole OAuth2 flow is relayed: the integration builds the
      // authorize URL, the tokens never transit through the frontend
      const canUseInstanceRedirect = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const useInstanceRedirect = canUseInstanceRedirect && this.props.oauthUseInstanceRedirect;
      const redirectUri =
        useInstanceRedirect && selector
          ? `${window.location.origin}${getOAuthCallbackPath(selector)}`
          : OAUTH_REDIRECT_URI;
      const canCopy = typeof window !== 'undefined' && window.isSecureContext;
      return (
        <div class="form-group">
          <label class="form-label">{label}</label>
          {oauthStatus === RequestStatus.Error && (
            <div class="alert alert-danger">
              {this.props.oauthMissingState ? (
                <Text id="integration.externalIntegration.config.oauthMissingStateError" />
              ) : (
                <Text id="integration.externalIntegration.config.oauthConnectError" />
              )}
            </div>
          )}
          <div class="mb-3">
            <small class="form-text text-muted mb-1">
              <Text id="integration.externalIntegration.config.oauthRedirectUriLabel" />
            </small>
            <div class="input-group">
              <input type="text" class="form-control" value={redirectUri} readOnly onFocus={selectOnFocus} />
              {canCopy && (
                <span class="input-group-append">
                  <button type="button" class="btn btn-outline-secondary" onClick={this.onCopyRedirectUri}>
                    <i class="fe fe-copy" />
                  </button>
                </span>
              )}
            </div>
            {this.state.redirectUriCopied && (
              <small class="text-success d-block mt-1">
                <Text id="integration.externalIntegration.config.oauthRedirectUriCopied" />
              </small>
            )}
            <small class="form-text text-muted">
              <Text id="integration.externalIntegration.config.oauthRedirectUriDescription" />
            </small>
          </div>
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
          {canUseInstanceRedirect && (
            <label class="custom-control custom-checkbox mt-3">
              <input
                type="checkbox"
                class="custom-control-input"
                checked={useInstanceRedirect}
                onClick={this.props.toggleOAuthUseInstanceRedirect}
              />
              <span class="custom-control-label">
                <Text id="integration.externalIntegration.config.oauthUseInstanceRedirectLabel" />
              </span>
            </label>
          )}
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
        {field.type === 'select' && field.display !== 'radio' && (
          <select id={fieldId} class="form-control" onChange={this.onInput}>
            <option value="" selected={value === undefined || value === null || value === ''}>
              <Text id="global.emptySelectOption" />
            </option>
            {options.map(option => (
              <option key={option.value} value={option.value} selected={`${value}` === `${option.value}`}>
                {getLocalizedText(option.label, language) || option.value}
              </option>
            ))}
          </select>
        )}
        {field.type === 'select' && field.display === 'radio' && (
          <div>
            {options.map(option => (
              <label key={option.value} class="custom-control custom-radio">
                <input
                  type="radio"
                  class="custom-control-input"
                  name={fieldId}
                  value={option.value}
                  checked={value === option.value}
                  onChange={this.onInput}
                />
                <span class="custom-control-label">{getLocalizedText(option.label, language) || option.value}</span>
              </label>
            ))}
          </div>
        )}
        {field.type === 'multi_select' && (
          <div>
            {options.map(option => (
              <label key={option.value} class="custom-control custom-checkbox">
                <input
                  type="checkbox"
                  class="custom-control-input"
                  value={option.value}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={this.onMultiSelectToggle}
                />
                <span class="custom-control-label">{getLocalizedText(option.label, language) || option.value}</span>
              </label>
            ))}
          </div>
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
        {(field.type === 'string' ||
          !['boolean', 'select', 'multi_select', 'number', 'secret', 'oauth2'].includes(field.type)) && (
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

export { ConfigField };

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
  oauthMissingState,
  oauthUseInstanceRedirect,
  toggleOAuthUseInstanceRedirect,
  connectOAuth,
  selector,
  dynamicOptions
}) => {
  // sections are presentational and oauth2 has its own Connect button: a
  // schema made only of those has nothing to save, hide the save button
  const hasSavableField = schema.some(field => field.type !== 'section' && field.type !== 'oauth2');
  return (
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
          oauthMissingState={oauthMissingState}
          oauthUseInstanceRedirect={oauthUseInstanceRedirect}
          toggleOAuthUseInstanceRedirect={toggleOAuthUseInstanceRedirect}
          connectOAuth={connectOAuth}
          selector={selector}
          dynamicOptions={dynamicOptions}
        />
      ))}
      {hasSavableField && (
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
      )}
    </form>
  );
};

export default ConfigSchemaForm;
