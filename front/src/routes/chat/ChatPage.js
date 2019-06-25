import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import actions from '../../actions/message';
import ChatItems from './ChatItems';

const IntegrationPage = connect(
  'user,messages,currentMessageTextInput,gladysIsTyping',
  actions
)(({ user, messages, currentMessageTextInput, updateMessageTextInput, onKeyPress, sendMessage, gladysIsTyping }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="page-header" />
          <div class="row">
            <div class="col-lg-8">
              <div class="card">
                <ChatItems user={user} messages={messages} gladysIsTyping={gladysIsTyping} />
                <div class="card-footer">
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Message"
                      value={currentMessageTextInput}
                      onInput={updateMessageTextInput}
                      onKeyPress={onKeyPress}
                    />
                    <div class="input-group-append">
                      <button type="button" class="btn btn-secondary" onClick={sendMessage}>
                        <i class="fe fe-send" />
                      </button>
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
                      "<Text id="chat.whatsTheWeatherLike" />"
                    </li>
                    <li>
                      "<Text id="chat.showCameraImage" />"
                    </li>
                    <li>
                      "<Text id="chat.whatsTheTemperatureKitchen" />"
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
));

export default IntegrationPage;
