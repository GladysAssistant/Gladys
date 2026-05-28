import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { connect } from 'unistore/preact';
import actions from '../../actions/message';
import { RequestStatus } from '../../utils/consts';
import ChatItems from './ChatItems';
import EmptyChat from './EmptyChat';
import ChatSidebar from './ChatSidebar';

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
                <ChatSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
);

export default IntegrationPage;
