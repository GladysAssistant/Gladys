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
      textareaRef.current.style.height = 'auto';
      const lineHeight = 24;
      const maxLines = 11;
      const maxHeight = lineHeight * maxLines;
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
      textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > maxHeight ? 'auto' : 'hidden';
    };

    const onComposerInput = e => {
      updateMessageTextInput(e);
      resizeComposerInput();
    };

    useEffect(() => {
      resizeComposerInput();
    }, [currentMessageTextInput]);

    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="container">
              <div class="page-header" />
              <div class={cx('row', style.chatLayout)}>
                <div class={cx('col-lg-8', style.chatMainColumn)}>
                  <div class={cx('card', style.chatCard)}>
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
