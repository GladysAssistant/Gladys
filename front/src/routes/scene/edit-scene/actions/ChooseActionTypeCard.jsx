import { Component } from 'preact';
import { Text } from 'preact-i18n';

import TypePicker from '../TypePicker';
import { ACTION_CATEGORIES, ACTION_ICON, DEPRECATED_ACTIONS } from '../typesCatalog';

class ChooseActionType extends Component {
  selectActionType = actionType => {
    this.props.updateActionProperty(this.props.path, 'type', actionType);
    this.props.updateActionProperty(this.props.path, 'filter', undefined);
  };

  render(props) {
    return (
      <div>
        <div class="form-group mb-0">
          <label class="form-label">
            {props.path.includes('if') && <Text id="editScene.selectConditionType" />}
            {!props.path.includes('if') && <Text id="editScene.selectActionType" />}
          </label>
          <TypePicker
            categories={ACTION_CATEGORIES}
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

export default ChooseActionType;
