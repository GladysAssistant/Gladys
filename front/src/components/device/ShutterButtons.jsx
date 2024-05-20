import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { COVER_STATE } from '../../../../server/utils/constants';

class ShutterButtons extends Component {
  open = () => {
    this.props.updateValue(COVER_STATE.OPEN);
  };

  close = () => {
    this.props.updateValue(COVER_STATE.CLOSE);
  };

  stop = () => {
    this.props.updateValue(COVER_STATE.STOP);
  };

  render({ value, category, type }, {}) {
    return (
      <div class="btn-group" role="group">
        <button
          class={cx('btn btn-sm btn-secondary', {
            active: value === COVER_STATE.OPEN
          })}
          onClick={this.open}
        >
          <Text id={`deviceFeatureAction.category.${category}.${type}`} plural={COVER_STATE.OPEN} />
        </button>
        <button
          class={cx('btn btn-sm btn-secondary', 'fe', 'fe-pause', {
            active: value === COVER_STATE.STOP
          })}
          onClick={this.stop}
        />
        <button
          class={cx('btn btn-sm', 'btn-secondary', {
            active: value === COVER_STATE.CLOSE
          })}
          onClick={this.close}
        >
          <Text id={`deviceFeatureAction.category.${category}.${type}`} plural={COVER_STATE.CLOSE} />
        </button>
      </div>
    );
  }
}

export default ShutterButtons;
