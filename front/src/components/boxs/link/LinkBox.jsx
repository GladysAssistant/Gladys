import { Text } from 'preact-i18n';
import get from 'get-value';
import style from './style.css';

const DEFAULT_ICON = 'link';

const LinkBox = ({ box }) => {
  const title = get(box, 'title', '');
  const url = get(box, 'url', '');
  const icon = get(box, 'icon', DEFAULT_ICON);

  if (!url) {
    return (
      <div class="card">
        <div class="card-body text-muted text-center">
          <Text id="dashboard.boxes.link.emptyUrl" />
        </div>
      </div>
    );
  }

  return (
    <div class="card">
      <a href={url} target="_blank" rel="noopener noreferrer" class={style.linkCard}>
        <div class={style.linkContent}>
          <i class={`fe fe-${icon} ${style.linkIcon}`} />
          <span class={style.linkTitle}>{title || url}</span>
          <i class={`fe fe-external-link ${style.linkArrow}`} />
        </div>
      </a>
    </div>
  );
};

export default LinkBox;
