import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { useEffect, useRef, useState } from 'preact/hooks';
import { connect } from 'unistore/preact';
import actions from '../../actions/message';
import { RequestStatus } from '../../utils/consts';
import ChatItems from './ChatItems';
import EmptyChat from './EmptyChat';
import AiModelSelector from './AiModelSelector';
import style from './style.css';

const IntegrationPage = connect(
  'user,messages,currentMessageTextInput,gladysIsTyping,MessageGetStatus,httpClient',
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
    gladysIsTyping,
    httpClient
  }) => {
    const textareaRef = useRef(null);
    const [selectedModel, setSelectedModel] = useState('auto');
    const [gladysPlusConfigured, setGladysPlusConfigured] = useState(null);
    const hasMessageToSend = Boolean(currentMessageTextInput && currentMessageTextInput.trim().length > 0);

    useEffect(() => {
      const fetchGatewayStatus = async () => {
        try {
          const gatewayStatus = await httpClient.get('/api/v1/gateway/status');
          setGladysPlusConfigured(gatewayStatus.configured === true);
        } catch (e) {
          setGladysPlusConfigured(false);
        }
      };
      fetchGatewayStatus();
    }, [httpClient]);

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

    const handleSendMessage = () => {
      sendMessage(selectedModel);
    };

    const handleKeyPress = e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(selectedModel);
        return;
      }
      onKeyPress(e);
    };

    useEffect(() => {
      resizeComposerInput();
    }, [currentMessageTextInput]);

    return (
      <div class={cx('page', style.chatPage)}>
        <div class={cx('page-main', style.chatPageMain)}>
          <div class={style.chatPageContent}>
            <div class={cx('container', style.chatPageContainer)}>
              <div class={style.chatMainColumn}>
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
                        {gladysPlusConfigured === true && (
                          <AiModelSelector value={selectedModel} onChange={setSelectedModel} />
                        )}
                        <div class={style.composerInputWrap}>
                          <Localizer>
                            <textarea
                              ref={textareaRef}
                              rows="1"
                              class={cx('form-control', style.chatInput)}
                              placeholder={<Text id="chat.messagePlaceholder" />}
                              value={currentMessageTextInput}
                              onInput={onComposerInput}
                              onKeyPress={handleKeyPress}
                            />
                          </Localizer>
                          <button
                            type="button"
                            class={cx('btn', style.sendButton, {
                              [style.sendButtonActive]: hasMessageToSend,
                              [style.sendButtonIdle]: !hasMessageToSend
                            })}
                            onClick={handleSendMessage}
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
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default IntegrationPage;
