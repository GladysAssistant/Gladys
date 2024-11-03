import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';

class SendSms extends Component {
  updateText = text => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'text', text);
  };

  render(props, {}) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.smsSend.textLabel" />{' '}
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <div class="mb-1 small">
            <Text id="editScene.actionsCard.smsSend.explanationText" />
          </div>
          <div className="tags-input">
            <TextWithVariablesInjected
              text={props.action.text}
              triggersVariables={props.triggersVariables}
              actionsGroupsBefore={props.actionsGroupsBefore}
              variables={props.variables}
              updateText={this.updateText}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(SendSms);
