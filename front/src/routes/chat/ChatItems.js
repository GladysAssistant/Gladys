import { Text, Localizer } from 'preact-i18n';
import { useState } from 'preact/hooks';
import style from './style.css';
import ChatMessageText from './ChatMessageText';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const IncomingMessage = ({ children, ...props }) => (
  <div class={style.incoming_msg}>
    <div class={style.incoming_msg_img}>
      <Localizer>
        <img src="/assets/icons/android-icon-192x192.png" alt={<Text id="chat.gladysAlt" />} />
      </Localizer>
    </div>
    <div class={style.received_msg}>
      <div class={style.received_withd_msg}>
        <p class={style.msg_txt_wrap}>
          <ChatMessageText text={props.message.text} />
          {props.message.file && (
            <span>
              <img class={style.imageInMessage} src={`data:${props.message.file}`} alt={props.message.text} />
            </span>
          )}
        </p>
        <span class={style.time_date}>
          {' '}
          {dayjs(props.message.created_at)
            .locale(props.user.language)
            .fromNow()}
        </span>
      </div>
    </div>
  </div>
);

const ToolCallMessage = ({ children, ...props }) => {
  const isError = props.message.tool_status === 'error';
  const [showDetails, setShowDetails] = useState(false);
  return (
    <div class={style.toolCallRow}>
      <div class={style.toolCallCard}>
        <div class={style.toolCallContent}>
          <div class={style.toolCallMainLine}>
            <div class={style.toolCallToolName}>{props.message.tool_name || 'tool_call'}</div>
          </div>
          {showDetails && (
            <div class={style.toolCallText}>
              <ChatMessageText text={props.message.text} />
            </div>
          )}
        </div>
        <span
          class={isError ? style.toolCallStatusError : style.toolCallStatusSuccess}
          title={isError ? 'error' : 'used'}
        >
          {isError ? <Text id="chat.toolCall.statusError" /> : <Text id="chat.toolCall.statusUsed" />}
        </span>
        <button
          type="button"
          class={style.toolCallIconButton}
          onClick={() => setShowDetails(!showDetails)}
          aria-label={showDetails ? 'Hide details' : 'Show details'}
          title={showDetails ? 'Hide details' : 'Show details'}
        >
          <i class={showDetails ? 'fe fe-chevron-up' : 'fe fe-chevron-down'} />
        </button>
      </div>
      <span class={style.time_date}>
        {dayjs(props.message.created_at)
          .locale(props.user.language)
          .fromNow()}
      </span>
    </div>
  );
};

const OutGoingMessage = ({ children, ...props }) => (
  <div class={style.outgoing_msg}>
    <div class={style.sent_msg}>
      <p class={style.msg_txt_wrap}>
        <ChatMessageText text={props.message.text} />
      </p>
      <span class={style.time_date}>
        {' '}
        {props.message.tempId ? (
          <Text id="chat.sendingInProgress" />
        ) : (
          dayjs(props.message.created_at)
            .locale(props.user.language)
            .fromNow()
        )}
      </span>
    </div>
  </div>
);

const Messages = ({ children, ...props }) => (
  <div class={style.messaging}>
    <div class={style.inbox_msg}>
      <div class={style.mesgs}>
        <div class={style.msg_history} id="chat-window">
          {props.messages &&
            props.messages.map(message => {
              if (message.message_type === 'tool_call') {
                return <ToolCallMessage key={message.id || message.created_at} user={props.user} message={message} />;
              }
              if (message.sender_id === null) {
                return <IncomingMessage key={message.id || message.created_at} user={props.user} message={message} />;
              }
              return <OutGoingMessage key={message.id || message.created_at} user={props.user} message={message} />;
            })}

          {props.gladysIsTyping && (
            <p>
              <Text id="chat.typingInProgress" />
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default Messages;
