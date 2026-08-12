import { useEffect, useState } from 'preact/hooks';
import { linkifyMessageText } from '../../utils/linkifyMessageText';
import { getMarkdownRenderer, loadMarkdownRenderer } from '../../utils/markdownRenderer';
import style from './style.css';

/**
 * @param {boolean} markdown - Whether the text should be rendered as markdown.
 * @param {string} text - Message text.
 * @returns {string|null} The rendered HTML, or null while it is not available.
 */
function renderMarkdownIfLoaded(markdown, text) {
  if (!markdown || !text) {
    return null;
  }
  const render = getMarkdownRenderer();
  return render ? render(text) : null;
}

// Markdown is rendered only for the messages written by Gladys: what the user
// typed, and the raw payloads of the tool calls, are displayed as-is.
const ChatMessageText = ({ text, markdown = false }) => {
  const [html, setHtml] = useState(() => renderMarkdownIfLoaded(markdown, text));

  useEffect(() => {
    if (!markdown || !text) {
      setHtml(null);
      return undefined;
    }
    let cancelled = false;
    loadMarkdownRenderer()
      .then(render => {
        if (!cancelled) {
          setHtml(render(text));
        }
      })
      .catch(() => {
        // keep the plain text rendering below
        if (!cancelled) {
          setHtml(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [text, markdown]);

  if (html !== null) {
    return <div class={style.markdown_content} dangerouslySetInnerHTML={{ __html: html }} />;
  }

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
