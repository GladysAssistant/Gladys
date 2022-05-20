import { Text, Localizer } from 'preact-i18n';
import style from './style.css';

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
          {props.message.text}
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

const OutGoingMessage = ({ children, ...props }) => (
  <div class={style.outgoing_msg}>
    <div class={style.sent_msg}>
      <p class={style.msg_txt_wrap}>{props.message.text}</p>
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
              if (message.sender_id === null) return <IncomingMessage user={props.user} message={message} />;
              return <OutGoingMessage user={props.user} message={message} />;
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
