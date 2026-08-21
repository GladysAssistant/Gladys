import { Component } from 'preact';
import { Text } from 'preact-i18n';

import TypePicker from '../TypePicker';
import { TRIGGER_CATEGORIES, TRIGGER_ICON } from '../typesCatalog';

class ChooseTriggerType extends Component {
  selectTriggerType = triggerType => {
    this.props.updateTriggerProperty(this.props.index, 'type', triggerType);
  };

  render() {
    return (
      <div>
        <div class="form-group mb-0">
          <label class="form-label">
            <Text id="editScene.selectTriggerLabel" />
          </label>
          <TypePicker
            categories={TRIGGER_CATEGORIES}
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

export default ChooseTriggerType;
