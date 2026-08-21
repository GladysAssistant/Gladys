import cx from 'classnames';
import { Text } from 'preact-i18n';
import style from './style.css';

// An empty action group renders as a "add a step" button. During a
// parallel-card drag it is also a drop target: the empty group adopts the
// dropped card, which becomes a full-fledged step of the flow (the
// data-card-extract attributes are read by stepDrag.js).
const EmptyDropZone = ({ children, ...props }) => (
  <button
    type="button"
    onClick={props.onAddStep}
    data-card-extract
    data-group-path={props.path}
    data-drop-active-class={style.extractTargetActive}
    class={cx('btn btn-outline-primary', style.addStepButton)}
  >
    <i class="fe fe-plus" /> <Text id="editScene.addStepButton" />
  </button>
);

export default EmptyDropZone;
