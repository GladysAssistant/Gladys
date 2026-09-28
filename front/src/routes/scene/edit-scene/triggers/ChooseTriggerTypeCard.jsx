import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import TypePicker from '../TypePicker';
import { TRIGGER_CATEGORIES, TRIGGER_ICON } from '../typesCatalog';
import {
  SCENE_DECLARATION_KINDS,
  buildIntegrationsCategory,
  parsePickerValue,
  resolveSceneDeclaration,
  getDeclarationDefaults
} from '../sceneIntegrations';

class ChooseTriggerType extends Component {
  selectTriggerType = value => {
    const declared = parsePickerValue(value);
    if (!declared) {
      this.props.updateTriggerProperty(this.props.index, 'type', value);
      return;
    }
    // a trigger declared by an external integration: the generic type, the
    // integration selector and the declared key are set at once, the filters
    // initialized from the declared defaults
    const { declaration } = resolveSceneDeclaration(this.props.sceneIntegrations, SCENE_DECLARATION_KINDS.trigger, {
      integration: declared.selector,
      trigger_key: declared.key
    });
    this.props.updateTriggerProperty(this.props.index, 'integration', declared.selector);
    this.props.updateTriggerProperty(this.props.index, 'trigger_key', declared.key);
    this.props.updateTriggerProperty(this.props.index, 'fields', getDeclarationDefaults(declaration));
    this.props.updateTriggerProperty(this.props.index, 'type', declared.type);
  };

  render(props) {
    const language = get(props, 'user.language') || 'en';
    const integrationsCategory = buildIntegrationsCategory(
      props.sceneIntegrations,
      SCENE_DECLARATION_KINDS.trigger,
      language
    );
    const categories = integrationsCategory ? [...TRIGGER_CATEGORIES, integrationsCategory] : TRIGGER_CATEGORIES;
    return (
      <div>
        <div class="form-group mb-0">
          <label class="form-label">
            <Text id="editScene.selectTriggerLabel" />
          </label>
          <TypePicker
            categories={categories}
            icons={TRIGGER_ICON}
            labelPrefix="editScene.triggers"
            descriptionPrefix="editScene.triggersDescriptions"
            categoryPrefix="editScene.triggerCategories"
            searchPlaceholderId="editScene.searchTriggersPlaceholder"
            onSelect={this.selectTriggerType}
          />
        </div>
      </div>
    );
  }
}

export default connect('user', {})(ChooseTriggerType);
