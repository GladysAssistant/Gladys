import { Text } from 'preact-i18n';
import style from './style.css';

const Messages = ({}) => (
  <div class={style.emptyChatState}>
    <img src="/assets/images/undraw_typing.svg" class={style.emptyChatImage} />
    <p class={style.emptyChatText}>
      <Text id="chat.emptyStateMessage" />
    </p>
  </div>
);

export default Messages;
