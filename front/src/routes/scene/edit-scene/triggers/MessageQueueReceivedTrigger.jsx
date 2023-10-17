import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';

class MessageQueueReceived extends Component {
  updateTopicName = e => {
    this.props.updateTriggerProperty(this.props.index, 'topic', e.target.value);
  };

  render({}, {}) {
    return (
      <div>
        <div class="form-group">
          <label className="form-label">
            <Text id="editScene.triggersCard.messageQueueReceived.topicLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              value={this.props.trigger.topic}
              onInput={this.updateTopicName}
              className="form-control"
              placeholder={<Text id="editScene.triggersCard.messageQueueReceived.topicPlaceholder" />}
            />
          </Localizer>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(MessageQueueReceived);
