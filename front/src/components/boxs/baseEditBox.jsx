import { Text } from 'preact-i18n';

const moveBoxUp = (moveBoxUpFunction, x, y) => e => {
  moveBoxUpFunction(x, y);
};

const moveBoxDown = (moveBoxDownFunction, x, y) => e => {
  moveBoxDownFunction(x, y);
};

const removeBox = (removeBoxFunction, x, y) => () => {
  removeBoxFunction(x, y);
};

const BaseEditBox = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id={props.titleKey} />
      </h3>
      <div class="card-options">
        <a onClick={moveBoxUp(props.moveBoxUp, props.x, props.y)} class="card-options-collapse">
          <i class="fe fe-chevron-up" />
        </a>
        <a onClick={moveBoxDown(props.moveBoxDown, props.x, props.y)} class="card-options-collapse">
          <i class="fe fe-chevron-down" />
        </a>
        <a onClick={removeBox(props.removeBox, props.x, props.y)} class="card-options-remove">
          <i class="fe fe-x" />
        </a>
      </div>
    </div>
    <div class="card-body">{children}</div>
  </div>
);

export default BaseEditBox;
