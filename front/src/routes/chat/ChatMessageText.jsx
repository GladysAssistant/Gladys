import { linkifyMessageText } from '../../utils/linkifyMessageText';

const ChatMessageText = ({ text }) => {
  const parts = linkifyMessageText(text);

  return (
    <span>
      {parts.map((part, index) =>
        part.type === 'link' ? (
          <a key={index} href={part.href} target="_blank" rel="noopener noreferrer">
            {part.content}
          </a>
        ) : (
          <span key={index}>{part.content}</span>
        )
      )}
    </span>
  );
};

export default ChatMessageText;
