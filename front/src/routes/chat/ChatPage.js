import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { connect } from 'unistore/preact';
import actions from '../../actions/message';
import { RequestStatus } from '../../utils/consts';
import ChatItems from './ChatItems';
import EmptyChat from './EmptyChat';

const IntegrationPage = connect(
  'user,messages,currentMessageTextInput,gladysIsTyping,MessageGetStatus',
  actions
)(
  ({
    user,
    messages,
    MessageGetStatus,
    currentMessageTextInput,
    updateMessageTextInput,
    onKeyPress,
    sendMessage,
    gladysIsTyping
  }) => (
    <div class="page">
      <div class="page-main">
        <div class="my-3 my-md-5">
          <div class="container">
            <div class="page-header" />
            <div class="row">
              <div class="col-lg-8">
                <div class="card">
                  <div
                    class={cx('dimmer', {
                      active: MessageGetStatus === RequestStatus.Getting
                    })}
                  >
                    <div class="loader" />
                    <div class="dimmer-content">
                      {messages && messages.length ? (
                        <ChatItems user={user} messages={messages} gladysIsTyping={gladysIsTyping} />
                      ) : (
                        <EmptyChat />
                      )}
                      <div class="card-footer">
                        <div class="input-group">
                          <Localizer>
                            <input
                              type="text"
                              class="form-control"
                              placeholder={<Text id="chat.messagePlaceholder" />}
                              value={currentMessageTextInput}
                              onInput={updateMessageTextInput}
                              onKeyPress={onKeyPress}
                            />
                          </Localizer>
                          <div class="input-group-append">
                            <button
                              type="button"
                              class="btn btn-secondary"
                              onClick={sendMessage}
                              disabled={!currentMessageTextInput || currentMessageTextInput.length === 0}
                            >
                              <i class="fe fe-send" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-lg-4">
                <div class="card">
                  <div class="card-header">
                    <h3 class="card-title">
                      <Text id="chat.whatCanYouAsk" />
                    </h3>
                  </div>
                  <div class="card-body">
                    <ul>
                      <li>
                        <Text id="chat.examples.whatsTheWeatherLike" />
                      </li>
                      <li>
                        <Text id="chat.examples.showCameraImage" />
                      </li>
                      <li>
                        <Text id="chat.examples.whatsTheTemperatureKitchen" />
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="card">
                  <div class="card-header">
                    <h3 class="card-title">
                      <Text id="chat.gpt3Integration" />
                    </h3>
                  </div>
                  <div class="card-body">
                    <Text id="chat.gpt3IntegrationExplanation" />{' '}
                    <a href="/dashboard/integration/communication/openai">
                      <Text id="chat.gpt3ClickHere" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
);

export default IntegrationPage;
