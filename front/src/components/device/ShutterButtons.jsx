import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { COVER_STATE } from '../../../../server/utils/constants';
import './ShutterButtons.css';

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

  render({ value, category, type, isLive = false }, {}) {
    return (
      <div class="btn-group" role="group">
        <button
          class={cx('btn btn-sm btn-secondary', {
            active: value === COVER_STATE.OPEN
          })}
          onClick={this.open}
        >
          <i class="fe fe-arrow-up shutter-btn-icon" aria-hidden="true" />
          <span class="shutter-btn-label">
            {value === COVER_STATE.OPEN && isLive ? (
              <Text id={`deviceFeatureAction.category.${category}.stateLiveFinished`} plural={COVER_STATE.OPEN} />
            ) : (
              <Text id={`deviceFeatureAction.category.${category}.${type}`} plural={COVER_STATE.OPEN} />
            )}
          </span>
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
          <i class="fe fe-arrow-down shutter-btn-icon" aria-hidden="true" />
          <span class="shutter-btn-label">
            {value === COVER_STATE.CLOSE && isLive ? (
              <Text id={`deviceFeatureAction.category.${category}.stateLiveFinished`} plural={COVER_STATE.CLOSE} />
            ) : (
              <Text id={`deviceFeatureAction.category.${category}.${type}`} plural={COVER_STATE.CLOSE} />
            )}
          </span>
        </button>
      </div>
    );
  }
}

export default ShutterButtons;
