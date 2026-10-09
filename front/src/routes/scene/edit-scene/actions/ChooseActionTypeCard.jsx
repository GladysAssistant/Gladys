import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import TypePicker from '../TypePicker';
import { ACTION_CATEGORIES, ACTION_ICON, DEPRECATED_ACTIONS } from '../typesCatalog';
import {
  SCENE_DECLARATION_KINDS,
  buildIntegrationsCategory,
  parsePickerValue,
  resolveSceneDeclaration,
  getDeclarationDefaults
} from '../sceneIntegrations';

class ChooseActionType extends Component {
  selectActionType = value => {
    const declared = parsePickerValue(value);
    if (declared) {
      // an action declared by an external integration: the generic type, the
      // integration selector and the declared key are set at once, the
      // parameters initialized from the declared defaults
      const { declaration } = resolveSceneDeclaration(this.props.sceneIntegrations, SCENE_DECLARATION_KINDS.action, {
        integration: declared.selector,
        action_key: declared.key
      });
      this.props.updateActionProperty(this.props.path, 'integration', declared.selector);
      this.props.updateActionProperty(this.props.path, 'action_key', declared.key);
      this.props.updateActionProperty(this.props.path, 'fields', getDeclarationDefaults(declaration));
      this.props.updateActionProperty(this.props.path, 'type', declared.type);
    } else {
      this.props.updateActionProperty(this.props.path, 'type', value);
    }
    this.props.updateActionProperty(this.props.path, 'filter', undefined);
  };

  render(props) {
    const language = get(props, 'user.language') || 'en';
    // the conditions of an if/while block are filtered core types: no
    // integration action there
    const isCondition = props.path.includes('if');
    const integrationsCategory = isCondition
      ? null
      : buildIntegrationsCategory(props.sceneIntegrations, SCENE_DECLARATION_KINDS.action, language);
    const categories = integrationsCategory ? [...ACTION_CATEGORIES, integrationsCategory] : ACTION_CATEGORIES;
    return (
      <div>
        <div class="form-group mb-0">
          <label class="form-label">
            {isCondition && <Text id="editScene.selectConditionType" />}
            {!isCondition && <Text id="editScene.selectActionType" />}
          </label>
          <TypePicker
            categories={categories}
            icons={ACTION_ICON}
            deprecated={DEPRECATED_ACTIONS}
            filter={props.action && props.action.filter}
            labelPrefix="editScene.actions"
            descriptionPrefix="editScene.actionsDescriptions"
            categoryPrefix="editScene.actionCategories"
            searchPlaceholderId="editScene.searchActionsPlaceholder"
            onSelect={this.selectActionType}
          />
        </div>
      </div>
    );
  }
}

export default connect('user', {})(ChooseActionType);
