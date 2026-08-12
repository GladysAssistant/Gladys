import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import MqttPage from '../MqttPage';
import update from 'immutability-helper';
import dayjs from 'dayjs';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class MqttNodePage extends Component {
  state = {
    messages: []
  };
  setDebugMode = async () => {
    try {
      await this.props.httpClient.post('/api/v1/service/mqtt/debug_mode', {
        debug_mode: true
      });
      this.setState({
        debugModeActivated: true
      });
      clearTimeout(this.disableDebugModeTimeout);
      this.disableDebugModeTimeout = setTimeout(() => {
        this.setState({
          debugModeActivated: false
        });
      }, 120 * 1000);
    } catch (e) {
      console.error(e);
    }
  };

  displayNewMqttMessage = payload => {
    const now = dayjs()
      .locale(this.props.user.language)
      .format('HH:mm:ss');
    const message = { ...payload, date: now };
    const newMessages = update(this.state.messages, {
      $unshift: [message]
    });
    this.setState({ messages: newMessages });
  };

  componentWillMount() {
    this.setDebugMode();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.MQTT.DEBUG_NEW_MQTT_MESSAGE,
      this.displayNewMqttMessage
    );
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.MQTT.DEBUG_NEW_MQTT_MESSAGE,
      this.displayNewMqttMessage
    );
  }

  render(props, { messages, debugModeActivated }) {
    return (
      <MqttPage user={props.user}>
        <div class="card">
          <div class="card-header">
            <h1 class="card-title">
              <Text id="integration.mqtt.debug.title" />
            </h1>
            <div class="page-options d-flex">
              <button class="btn btn-outline-secondary" onClick={this.setDebugMode}>
                <span class="mr-2">
                  <Text id="integration.mqtt.debug.activateDebugMode" />
                </span>
                <i class="fe fe-refresh-cw" />
              </button>
            </div>
          </div>
          <div class="card-body">
            {debugModeActivated && (
              <div class="alert alert-success">
                <Text id="integration.mqtt.debug.debugModeActivated" />
              </div>
            )}
            <p>
              <Text id="integration.mqtt.debug.description" />
            </p>
          </div>
          <div class="table-responsive">
            <table class="table table-hover table-outline table-vcenter card-table">
              <thead>
                <tr>
                  <th>
                    <Text id="integration.mqtt.debug.date" />
                  </th>
                  <th>
                    <Text id="integration.mqtt.debug.topic" />
                  </th>
                  <th>
                    <Text id="integration.mqtt.debug.message" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {messages.map(message => (
                  <tr>
                    <td>{message.date}</td>
                    <td>{message.topic}</td>
                    <td>
                      <pre>{message.message}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </MqttPage>
    );
  }
}

export default connect('user,session,httpClient', {})(MqttNodePage);
