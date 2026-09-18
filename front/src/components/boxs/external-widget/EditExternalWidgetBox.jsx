import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';

import BaseEditBox from '../baseEditBox';
import { ConfigField } from '../../integration/ConfigSchemaForm';
import StatusBadge from '../../../routes/integration/all/external-integration/components/StatusBadge';
import { getLocalizedText } from '../../../routes/integration/all/external-integration/utils';
import { loadWidgetList, findWidgetDeclaration } from './widgetList';

// The edit form of an integration widget: the card title, then the
// per-instance `settings` declared by the widget, rendered by the shared
// config_schema engine (one engine, one look). `source: "devices"` options
// are the integration's own devices, loaded from the standard device route
// every user can read.
class EditExternalWidgetBox extends Component {
  state = { declaration: undefined, dynamicOptions: {} };

  loadDeclaration = async () => {
    const { box, httpClient } = this.props;
    try {
      const widgets = await loadWidgetList(httpClient);
      const declaration = findWidgetDeclaration(widgets, box.integration, box.widget);
      this.setState({ declaration });
      if (declaration && (declaration.settings || []).some(field => field.source === 'devices')) {
        const devices = await httpClient.get(`/api/v1/service/${encodeURIComponent(box.integration)}/device`);
        this.setState({
          dynamicOptions: { devices: devices.map(device => ({ value: device.external_id, label: device.name })) }
        });
      }
    } catch (e) {
      console.error(e);
      this.setState({ declaration: null });
    }
  };

  updateName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { name: e.target.value });
  };

  updateSettingValue = (field, value) => {
    const settings = { ...(this.props.box.settings || {}) };
    // the number input hands back a string; an emptied field is an absent
    // setting (the declared default applies), never an empty string
    let newValue = value;
    if (field.type === 'number') {
      newValue = value === '' || value === null ? undefined : Number(value);
    } else if (value === '') {
      newValue = undefined;
    }
    if (newValue === undefined) {
      delete settings[field.key];
    } else {
      settings[field.key] = newValue;
    }
    this.props.updateBoxConfig(this.props.x, this.props.y, { settings });
  };

  componentDidMount() {
    this.loadDeclaration();
  }

  componentDidUpdate(previousProps) {
    if (
      previousProps.box.integration !== this.props.box.integration ||
      previousProps.box.widget !== this.props.box.widget
    ) {
      this.loadDeclaration();
    }
  }

  render(props, { declaration, dynamicOptions }) {
    const language = get(props, 'user.language') || 'en';
    const settings = declaration ? declaration.settings || [] : [];
    // an absent setting takes its declared default on the server: the form
    // shows that default, so the preview and the form never disagree
    const displayedValues = { ...(props.box.settings || {}) };
    settings.forEach(field => {
      if (displayedValues[field.key] === undefined && field.default !== undefined) {
        displayedValues[field.key] = field.default;
      }
    });
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.external-widget">
        {declaration && (
          <div class="mb-3">
            <div class="font-weight-bold">
              <i class={`fe fe-${declaration.icon || 'grid'} mr-1`} />
              {getLocalizedText(declaration.label, language)}
            </div>
            <div class="text-muted small">
              {declaration.integration_name}{' '}
              {declaration.integration_status !== 'RUNNING' && <StatusBadge status={declaration.integration_status} />}
            </div>
            {declaration.description && (
              <div class="text-muted small">{getLocalizedText(declaration.description, language)}</div>
            )}
          </div>
        )}
        {declaration === null && (
          <div class="alert alert-warning">
            <Text id="dashboard.boxes.external-widget.editIntegrationNotInstalled" />
          </div>
        )}
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.external-widget.editNameLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="dashboard.boxes.external-widget.editNamePlaceholder" />}
              value={props.box.name || ''}
              onInput={this.updateName}
              data-cy="external-widget-name"
            />
          </Localizer>
        </div>
        {settings.length > 0 && (
          <div data-cy="external-widget-settings">
            <label>
              <Text id="dashboard.boxes.external-widget.editSettingsLabel" />
            </label>
            {settings.map(field => (
              <ConfigField
                key={field.key}
                field={field}
                language={language}
                values={displayedValues}
                configuredSecrets={[]}
                touchedSecrets={{}}
                updateConfigValue={this.updateSettingValue}
                dynamicOptions={dynamicOptions}
                placeholderPorts={{}}
              />
            ))}
          </div>
        )}
      </BaseEditBox>
    );
  }
}

export default connect('httpClient,user', {})(EditExternalWidgetBox);
