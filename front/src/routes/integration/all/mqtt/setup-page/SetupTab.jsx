import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.mqtt.setup.title" />
        </h3>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.connectMqttStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            {props.connectMqttStatus === RequestStatus.Error && (
              <p class="alert alert-danger">
                <Text id="integration.mqtt.setup.error" />
              </p>
            )}

            <form>
              <div class="form-group">
                <label for="mqttURL" class="form-label">
                  <Text id={`integration.mqtt.setup.urlLabel`} />
                </label>
                <Localizer>
                  <input
                    name="mqttURL"
                    placeholder={<Text id="integration.mqtt.setup.urlPlaceholder" />}
                    value={props.mqttURL}
                    class="form-control"
                    onChange={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="mqttUsername" class="form-label">
                  <Text id={`integration.mqtt.setup.userLabel`} />
                </label>
                <Localizer>
                  <input
                    name="mqttUsername"
                    placeholder={<Text id="integration.mqtt.setup.userPlaceholder" />}
                    value={props.mqttUsername}
                    class="form-control"
                    onChange={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="mqttPassword" class="form-label">
                  <Text id={`integration.mqtt.setup.passwordLabel`} />
                </label>
                <Localizer>
                  <input
                    name="mqttPassword"
                    type="password"
                    placeholder={<Text id="integration.mqtt.setup.passwordPlaceholder" />}
                    value="FAKE_PASSWORD"
                    class="form-control"
                    onChange={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div>
                <label for="mqttTopics" class="form-label">
                  <Text id={`integration.mqtt.setup.topicLabel`} />
                </label>
                <div class="form-inline col-12 pl-0">
                  <Localizer>
                    <input
                      placeholder={<Text id="integration.mqtt.setup.topicPlaceholder" />}
                      value={props.currentTopic}
                      onChange={props.prepareTopic}
                      class={cx('form-control col-9', {
                        'is-invalid': props.currentTopicStatus && props.currentTopicStatus !== 'success'
                      })}
                    />
                  </Localizer>
                  <button class="btn btn-outline-primary col-2 offset-1" onClick={props.addTopic}>
                    <Text id="integration.mqtt.setup.topicAddLabel" />
                  </button>
                </div>
              </div>
              <div class="mt-3">
                <div>
                  <div class="tags">
                    {props.mqttTopics &&
                      props.mqttTopics.map((topic, index) => (
                        <span class="tag">
                          {topic}
                          <a class="tag-addon" onClick={() => props.removeTopic(index)}>
                            <i class="fe fe-trash-2" />
                          </a>
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              <div class="row mt-5">
                <div class="col">
                  <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
                    <Text id="integration.mqtt.setup.saveLabel" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupTab;
