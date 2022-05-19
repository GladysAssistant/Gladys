import { Text } from 'preact-i18n';
import style from './style.css';

const EmptyState = ({}) => (
  <div class={style.emptyStateDivBox}>
    <img src="/assets/images/undraw_personalization.svg" class={style.emptyStateImage} />
    <p class={style.emptyStateText}>
      <Text id="scene.emptySceneSentenceTop" />
    </p>
  </div>
);

export default EmptyState;
