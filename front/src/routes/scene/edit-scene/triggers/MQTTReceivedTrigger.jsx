import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import { Text, Localizer } from 'preact-i18n';

import withIntlAsProp from '../../../../utils/withIntlAsProp';

class MQTTReceived extends Component {
  updateTopicName = e => {
    this.props.updateTriggerProperty(this.props.index, 'topic', e.target.value);
  };

  updateMessage = e => {
    this.props.updateTriggerProperty(this.props.index, 'message', e.target.value);
  };

  setVariables = () => {
    const TOPIC_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.mqtt.topic');
    const MESSAGE_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.mqtt.message');
    this.props.setVariablesTrigger(this.props.index, [
      {
        name: 'topic',
        type: 'mqtt',
        ready: true,
        label: TOPIC_VARIABLE,
        data: {}
      },
      {
        name: 'message',
        type: 'mqtt',
        ready: true,
        label: MESSAGE_VARIABLE,
        data: {}
      }
    ]);
  };

  componentDidMount() {
    this.setVariables();
  }

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
        <div class="alert alert-secondary">
          <Text id="editScene.triggersCard.mqttReceived.variablesDescription" />
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(withIntlAsProp(MQTTReceived));
