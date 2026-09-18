import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import { ConfigField } from '../../../integration/all/external-integration/config-page/ConfigSchemaForm';
import ExternalIntegrationDeclarationState from '../ExternalIntegrationDeclarationState';
import { getLocalizedText } from '../../../../utils/getLocalizedText';
import {
  SCENE_DECLARATION_KINDS,
  resolveSceneDeclaration,
  normalizeDeclaredFieldValue,
  buildDeclaredVariables
} from '../sceneIntegrations';

// A scene trigger declared by an external integration (scene_triggers of its
// manifest): the declared fields are the filters the user fills in, rendered
// by the config_schema form engine — a field left empty matches any value —
// and the declared variables are what the actions can read from the event
// ({{triggerEvent.data.<key>}}).
class ExternalIntegrationTrigger extends Component {
  getLanguage = () => get(this.props, 'user.language') || 'en';

  resolve = (props = this.props) =>
    resolveSceneDeclaration(props.sceneIntegrations, SCENE_DECLARATION_KINDS.trigger, props.trigger);

  loadDynamicOptions = async declaration => {
    // a select/multi_select filter can take its options from the devices of
    // the integration (source: "devices", value = external_id)
    if (!declaration || !(declaration.fields || []).some(field => field.source === 'devices')) {
      return;
    }
    try {
      const devices = await this.props.httpClient.get(`/api/v1/service/${this.props.trigger.integration}/device`);
      this.setState({
        dynamicOptions: { devices: devices.map(device => ({ value: device.external_id, label: device.name })) }
      });
    } catch (e) {
      console.error(e);
    }
  };

  declareVariables = declaration => {
    // the picker inserts {{triggerEvent.data.<key>}}: the name is prefixed
    // with `data.`, the editor adds `triggerEvent.`
    this.props.setVariablesTrigger(
      this.props.index,
      buildDeclaredVariables(declaration ? declaration.variables : [], this.getLanguage(), 'data.')
    );
  };

  refresh = () => {
    const { declaration } = this.resolve();
    this.loadDynamicOptions(declaration);
    this.declareVariables(declaration);
  };

  updateFieldValue = (field, value) => {
    const fields = Object.assign({}, this.props.trigger.fields || {}, {
      [field.key]: normalizeDeclaredFieldValue(field, value)
    });
    this.props.updateTriggerProperty(this.props.index, 'fields', fields);
  };

  constructor(props) {
    super(props);
    this.state = { dynamicOptions: {} };
  }

  componentDidMount() {
    this.refresh();
  }

  componentDidUpdate(prevProps) {
    const declarationChanged =
      prevProps.trigger.integration !== this.props.trigger.integration ||
      prevProps.trigger.trigger_key !== this.props.trigger.trigger_key ||
      prevProps.sceneIntegrations !== this.props.sceneIntegrations;
    if (declarationChanged) {
      this.refresh();
    }
  }

  render(props, { dynamicOptions }) {
    const language = this.getLanguage();
    const { integration, declaration, inactive } = this.resolve(props);
    if (!integration || !declaration) {
      return (
        <ExternalIntegrationDeclarationState integration={integration} fields={props.trigger.fields} kind="trigger" />
      );
    }
    const description = getLocalizedText(declaration.description, language);
    const fields = declaration.fields || [];
    const variables = declaration.variables || [];
    return (
      <div>
        {inactive && (
          <div class="alert alert-warning">
            <i class="fe fe-pause-circle mr-1" />
            <Text id="editScene.externalIntegration.triggerInactive" />
          </div>
        )}
        {description && <p>{description}</p>}
        {fields.length > 0 && (
          <div>
            <p class="text-muted small">
              <Text id="editScene.externalIntegration.wildcardHint" />
            </p>
            {fields.map(field => (
              <ConfigField
                key={field.key}
                field={field}
                language={language}
                values={props.trigger.fields || {}}
                configuredSecrets={[]}
                touchedSecrets={{}}
                updateConfigValue={this.updateFieldValue}
                dynamicOptions={dynamicOptions}
                placeholderPorts={{}}
              />
            ))}
          </div>
        )}
        {variables.length > 0 && (
          <div class="mt-3">
            <div class="form-label">
              <Text id="editScene.externalIntegration.variablesTitle" />
            </div>
            <ul class="mb-0 small">
              {variables.map(variable => (
                <li key={variable.key}>
                  {getLocalizedText(variable.label, language) || variable.key}{' '}
                  <code>{`{{triggerEvent.data.${variable.key}}}`}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
}

export default connect('httpClient,user', {})(ExternalIntegrationTrigger);
