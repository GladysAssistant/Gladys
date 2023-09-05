import { Component } from 'preact';
import cx from 'classnames';
import styles from './styles.css';
import { Text } from 'preact-i18n';

class InputWithUnit extends Component {
  render({ unit, value, classNames, disabled, onChange }) {
    return (
      <div
        class={cx('input-group input-group-sm', styles.inputWithUnit, {
          [styles.alpha]: disabled
        })}
      >
        <input
          class={cx('form-control', 'p-1', 'text-right')}
          style=""
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
