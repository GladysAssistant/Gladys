import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';

import { ConfigField } from '../../../integration/all/external-integration/config-page/ConfigSchemaForm';
import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';
import ExternalIntegrationDeclarationState from '../ExternalIntegrationDeclarationState';
import { getLocalizedText } from '../../../../utils/getLocalizedText';
import {
  SCENE_DECLARATION_KINDS,
  resolveSceneDeclaration,
  normalizeDeclaredFieldValue,
  buildDeclaredVariables
} from '../sceneIntegrations';

// A scene action declared by an external integration (scene_actions of its
// manifest): the declared fields are its parameters, rendered by the
// config_schema form engine — the string ones by the variables-aware input,
// so the user inserts {{…}} from the picker — and the declared outputs are
// exposed to the following actions as variables of this step.
class ExternalIntegrationAction extends Component {
  getLanguage = () => get(this.props, 'user.language') || 'en';

  resolve = (props = this.props) =>
    resolveSceneDeclaration(props.sceneIntegrations, SCENE_DECLARATION_KINDS.action, props.action);

  loadDynamicOptions = async declaration => {
    if (!declaration || !(declaration.fields || []).some(field => field.source === 'devices')) {
      return;
    }
    try {
      const devices = await this.props.httpClient.get(`/api/v1/service/${this.props.action.integration}/device`);
      this.setState({
        dynamicOptions: { devices: devices.map(device => ({ value: device.external_id, label: device.name })) }
      });
    } catch (e) {
      console.error(e);
    }
  };

  declareOutputs = declaration => {
    this.props.setVariables(
      this.props.path,
      buildDeclaredVariables(declaration ? declaration.outputs : [], this.getLanguage())
    );
  };

  refresh = () => {
    const { declaration } = this.resolve();
    this.loadDynamicOptions(declaration);
    this.declareOutputs(declaration);
  };

  updateFieldValue = (field, value) => {
    const fields = Object.assign({}, this.props.action.fields || {}, {
      [field.key]: normalizeDeclaredFieldValue(field, value)
    });
    this.props.updateActionProperty(this.props.path, 'fields', fields);
  };

  updateTextField = field => text => {
    this.updateFieldValue(field, text && text.length > 0 ? text : null);
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
      prevProps.action.integration !== this.props.action.integration ||
      prevProps.action.action_key !== this.props.action.action_key ||
      prevProps.sceneIntegrations !== this.props.sceneIntegrations;
    if (declarationChanged) {
      this.refresh();
    }
  }

  renderField = (field, language, dynamicOptions) => {
    const values = this.props.action.fields || {};
    if (field.type !== 'string') {
      return (
        <ConfigField
          key={field.key}
          field={field}
          language={language}
          values={values}
          configuredSecrets={[]}
          touchedSecrets={{}}
          updateConfigValue={this.updateFieldValue}
          dynamicOptions={dynamicOptions}
          placeholderPorts={{}}
        />
      );
    }
    // a string parameter accepts the scene variables: the variables-aware
    // input of message.send and mqtt.send
    const description = getLocalizedText(field.description, language);
    return (
      <div class="form-group" key={field.key}>
        <label class="form-label">
          {getLocalizedText(field.label, language) || field.key}
          {field.required && <span class="form-required">*</span>}
        </label>
        <Localizer>
          <TextWithVariablesInjected
            text={values[field.key] === null || values[field.key] === undefined ? '' : String(values[field.key])}
            path={this.props.path}
            updateText={this.updateTextField(field)}
            triggersVariables={this.props.triggersVariables}
            actionsGroupsBefore={this.props.actionsGroupsBefore}
            variables={this.props.variables}
            placeholder={getLocalizedText(field.placeholder, language) || ''}
          />
        </Localizer>
        {description && <small class="form-text text-muted">{description}</small>}
      </div>
    );
  };

  render(props, { dynamicOptions }) {
    const language = this.getLanguage();
    const { integration, declaration, inactive } = this.resolve(props);
    if (!integration || !declaration) {
      return (
        <ExternalIntegrationDeclarationState integration={integration} fields={props.action.fields} kind="action" />
      );
    }
    const description = getLocalizedText(declaration.description, language);
    const fields = declaration.fields || [];
    const outputs = declaration.outputs || [];
    return (
      <div>
        {inactive && (
          <div class="alert alert-warning">
            <i class="fe fe-pause-circle mr-1" />
            <Text id="editScene.externalIntegration.actionInactive" />
          </div>
        )}
        {description && <p>{description}</p>}
        {fields.length > 0 && (
          <p class="text-muted small">
            <Text id="editScene.externalIntegration.variablesExplanation" />
          </p>
        )}
        {fields.map(field => this.renderField(field, language, dynamicOptions))}
        {outputs.length > 0 && (
          <div class="mt-3">
            <div class="form-label">
              <Text id="editScene.externalIntegration.outputsTitle" />
            </div>
            <ul class="mb-0 small">
              {outputs.map(output => (
                <li key={output.key}>
                  {getLocalizedText(output.label, language) || output.key}{' '}
                  <code>{`{{${props.path}.${output.key}}}`}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
}

export default connect('httpClient,user', {})(ExternalIntegrationAction);
