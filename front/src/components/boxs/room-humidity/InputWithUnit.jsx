import { Component } from 'preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';

class InputWithUnit extends Component {
  render({ unit, value, disabled, onChange }) {
    return (
      <div
        style="max-width: 150px;"
        class={cx('input-group input-group-sm', {
          'opacity-60': disabled
        })}
      >
        <input
          class={cx('form-control', 'p-1', 'text-right')}
          type="text"
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
        />
        <div class="input-group-append">
          <span class="input-group-text">
            <Text id={unit} />
          </span>
        </div>
      </div>
    );
  }
}

export default InputWithUnit;
