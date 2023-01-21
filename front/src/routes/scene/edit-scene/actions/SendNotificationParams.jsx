import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';

const helpTextStyle = {
  fontSize: 12,
  marginBottom: '.375rem'
};

class SendNotificationParams extends Component {
  updateTopic = text => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'topic', text);
  };
  updateText = text => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'text', text);
  };
  handleChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', null);
    }
  };

  constructor(props) {
    super(props);
    this.props = props;
  }

  render(props) {
    return (
      <div>
        <div class="form-group">
          <label className="form-label">
            <Text id="editScene.actionsCard.notificationSend.topicLabel" />{' '}
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <div className="tags-input">
            <TextWithVariablesInjected
              text={props.action.topic}
              triggersVariables={props.triggersVariables}
              actionsGroupsBefore={props.actionsGroupsBefore}
              variables={props.variables}
              updateText={this.updateTopic}
            />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.notificationSend.textLabel" />{' '}
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <div style={helpTextStyle}>
            <Text id="editScene.actionsCard.notificationSend.explanationText" />
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

export default connect('httpClient', {})(SendNotificationParams);
