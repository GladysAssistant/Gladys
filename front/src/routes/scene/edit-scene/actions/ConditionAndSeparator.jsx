import { Text } from 'preact-i18n';

import style from '../style.css';

// The condition boxes of an "If / Then / Else" or a "While" block are combined
// with an AND: they all need to be verified. Without a label between two boxes,
// two stacked boxes read as alternatives, so the AND is written between them,
// the same way as the OR between the conditions of a "Condition on variables" box.
// It is not a [data-condition-slot]: the drag & drop of the conditions ignores it.
const ConditionAndSeparator = () => (
  <div class="col-12" data-cy="scene-condition-and-separator">
    <p class={style.conditionAndSeparator}>
      <Text id="editScene.conditionAndText">AND</Text>
    </p>
  </div>
);

export default ConditionAndSeparator;
