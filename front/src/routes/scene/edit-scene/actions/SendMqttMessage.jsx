import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';

import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';

const helpTextStyle = {
  fontSize: 12,
  marginBottom: '.375rem'
};

class SendMqttMessage extends Component {
  handleChangeTopic = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'topic', e.target.value);
  };
  handleChangeMessage = text => {
    const newMessage = text && text.length > 0 ? text : undefined;
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'message', newMessage);
  };

  render(props) {
    return (
      <div>
        <form>
          <div class="form-group">
            <label class="form-label">
              <Text id="editScene.actionsCard.mqttMessage.topic" />
              <span class="form-required">
                <Text id="global.requiredField" />
              </span>
            </label>
            <Localizer>
              <input
                type="text"
                class="form-control"
                value={props.action.topic}
                onChange={this.handleChangeTopic}
                placeholder={<Text id="editScene.actionsCard.mqttMessage.topicPlaceholder" />}
              />
            </Localizer>
          </div>
          <div class="form-group">
            <label class="form-label">
              <Text id="editScene.actionsCard.mqttMessage.messageLabel" />
            </label>
            <div style={helpTextStyle}>
              <Text id="editScene.actionsCard.mqttMessage.variablesExplanation" />
            </div>
            <Localizer>
              <TextWithVariablesInjected
                text={props.action.message}
                updateText={this.handleChangeMessage}
                triggersVariables={props.triggersVariables}
                actionsGroupsBefore={props.actionsGroupsBefore}
                variables={props.variables}
                placeholder={<Text id="editScene.actionsCard.mqttMessage.messagePlaceholder" />}
              />
            </Localizer>
          </div>
        </form>
      </div>
    );
  }
}

export default connect('httpClient', {})(SendMqttMessage);
