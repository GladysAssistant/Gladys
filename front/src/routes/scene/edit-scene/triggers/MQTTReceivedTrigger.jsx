import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

class MQTTReceived extends Component {
  setVariables = () => {
    const TOPIC_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.trigger.mqtt.topic');
    const MESSAGE_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.trigger.mqtt.message');

    this.props.setVariablesTrigger(this.props.index, [
      {
        name: 'topic',
        type: 'trigger',
        ready: true,
        label: TOPIC_VARIABLE,
        data: {}
      },
      {
        name: 'message',
        type: 'trigger',
        ready: true,
        label: MESSAGE_VARIABLE,
        data: {}
      }
    ]);
  };

  componentDidMount() {
    this.setVariables();
  }

  updateTopicName = e => {
    this.props.updateTriggerProperty(this.props.index, 'topic', e.target.value);
  };

  updateMessage = e => {
    this.props.updateTriggerProperty(this.props.index, 'message', e.target.value);
  };

  render({}, {}) {
    return (
      <div>
        <p>
          <Text id="editScene.triggersCard.mqttReceived.description" />
        </p>
        <div class="form-group">
          <label className="form-label">
            <Text id="editScene.triggersCard.mqttReceived.topicLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              value={this.props.trigger.topic}
              onInput={this.updateTopicName}
              className="form-control"
              placeholder={<Text id="editScene.triggersCard.mqttReceived.topicPlaceholder" />}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <label className="form-label">
            <Text id="editScene.triggersCard.mqttReceived.messageLabel" />
          </label>
          <div class="mb-1 small">
            <Text id="editScene.triggersCard.mqttReceived.messageDescription" />
          </div>
          <Localizer>
            <input
              type="text"
              value={this.props.trigger.message}
              onInput={this.updateMessage}
              className="form-control"
              placeholder={<Text id="editScene.triggersCard.mqttReceived.messagePlaceholder" />}
            />
          </Localizer>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(withIntlAsProp(MQTTReceived));
