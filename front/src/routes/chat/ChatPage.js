import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { useEffect, useRef } from 'preact/hooks';
import { connect } from 'unistore/preact';
import actions from '../../actions/message';
import { RequestStatus } from '../../utils/consts';
import ChatItems from './ChatItems';
import EmptyChat from './EmptyChat';
import ChatSidebar from './ChatSidebar';
import style from './style.css';

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
  }) => {
    const textareaRef = useRef(null);
    const hasMessageToSend = Boolean(currentMessageTextInput && currentMessageTextInput.trim().length > 0);

    const resizeComposerInput = () => {
      if (!textareaRef.current) {
        return;
      }
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const computed = window.getComputedStyle(textarea);
      const lineHeight = parseFloat(computed.lineHeight) || 24;
      const verticalPadding = (parseFloat(computed.paddingTop) || 0) + (parseFloat(computed.paddingBottom) || 0);
      const verticalBorder = (parseFloat(computed.borderTopWidth) || 0) + (parseFloat(computed.borderBottomWidth) || 0);
      const maxLines = 11;
      const maxHeight = lineHeight * maxLines + verticalPadding + verticalBorder;
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    };

    const onComposerInput = e => {
      updateMessageTextInput(e);
      resizeComposerInput();
    };

    useEffect(() => {
      resizeComposerInput();
    }, [currentMessageTextInput]);

    return (
      <div class={cx('page', style.chatPage)}>
        <div class={cx('page-main', style.chatPageMain)}>
          <div class={cx('my-3 my-md-5', style.chatPageContent)}>
            <div class={cx('container', style.chatPageContainer)}>
              <div class="page-header" />
              <div class={cx('row', style.chatLayout)}>
                <div class={cx('col-lg-8', style.chatMainColumn)}>
                  <div class={cx('card', style.chatCard)}>
                    <div
                      class={cx('dimmer', style.chatDimmer, {
                        active: MessageGetStatus === RequestStatus.Getting
                      })}
                    >
                      <div class="loader" />
                      <div class={cx('dimmer-content', style.chatCardBody)}>
                        <div class={style.chatMessagesArea}>
                          {messages && messages.length ? (
                            <ChatItems user={user} messages={messages} gladysIsTyping={gladysIsTyping} />
                          ) : (
                            <EmptyChat />
                          )}
                        </div>
                        <div class={cx('card-footer', style.chatComposer)}>
                          <div class={style.composerInputWrap}>
                            <Localizer>
                              <textarea
                                ref={textareaRef}
                                rows="1"
                                class={cx('form-control', style.chatInput)}
                                placeholder={<Text id="chat.messagePlaceholder" />}
                                value={currentMessageTextInput}
                                onInput={onComposerInput}
                                onKeyPress={onKeyPress}
                              />
                            </Localizer>
                            <button
                              type="button"
                              class={cx('btn', style.sendButton, {
                                [style.sendButtonActive]: hasMessageToSend,
                                [style.sendButtonIdle]: !hasMessageToSend
                              })}
                              onClick={sendMessage}
                              disabled={!hasMessageToSend}
                            >
                              <i class="fe fe-send" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class={cx('col-lg-4', style.desktopSidebarColumn)}>
                  <ChatSidebar />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default IntegrationPage;
