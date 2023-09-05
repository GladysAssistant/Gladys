import { Component } from 'preact';
import cx from 'classnames';

class InputWithUnit extends Component {
  render({ unit, value, classNames }) {
    return (
      <div style="height: 20px" class={cx('d-flex align-items-center', classNames)}>
        <input
          class="form-control p-1"
          style="width: 25px; line-height: 1.14285714; font-size: 0.8rem;"
          type="text"
          value={value}
        />
        <div style="background-color: #FF00FF; box-sizing: border-box; line-height: 1.14285714;font-size: 0.8rem;">
          {unit}
        </div>
      </div>
    );
  }
}

export default InputWithUnit;
