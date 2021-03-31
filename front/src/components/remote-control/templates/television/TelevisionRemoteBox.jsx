import cx from 'classnames';
import { Text } from 'preact-i18n';

import AbstractRemoteComponent from '../AbstractRemoteComponent';
import { DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';
import ButtonOptions from './template';

class TelevisionRemoteBox extends AbstractRemoteComponent {
  toggleButtons = () => {
    this.setState({
      collapsed: !this.state.collapsed
    });
  };

  constructor(props) {
    super(props, ButtonOptions);

    const { dashboard } = props;
    this.state = {
      ...this.state,
      collapsed: dashboard
    };
  }

  render({ dashboard }, { collapsed }) {
    return (
      <div>
        <div class="d-flex">
          <div class="d-flex btn-group">
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.POWER_BUTTON, 1)}
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.POWER_BUTTON, 0)}
          </div>
          <div class="flex-fill" />
          {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.SOURCE_BUTTON)}
        </div>

        <div class="d-flex btn-group mt-3">
          {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_BUTTON, 1)}
          {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_BUTTON, 2)}
          {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_BUTTON, 3)}
        </div>
        <div class="d-flex btn-group mt-2">
          {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_BUTTON, 4)}
          {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_BUTTON, 5)}
          {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_BUTTON, 6)}
        </div>
        <div class="d-flex btn-group mt-2">
          {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_BUTTON, 7)}
          {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_BUTTON, 8)}
          {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_BUTTON, 9)}
        </div>
        <div class="d-flex btn-group mt-2">
          {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.GUIDE_BUTTON)}
          {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_BUTTON, 0)}
          {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.MENU_BUTTON)}
        </div>

        <div class="d-flex mt-3">
          <div class="flex-fill" />
          <div class="btn-group-vertical flex-fill">
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_UP_BUTTON)}
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_MUTE_BUTTON)}
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_DOWN_BUTTON)}
          </div>
          <div class="flex-fill" />
          <div class="btn-group-vertical flex-fill">
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_UP_BUTTON)}
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_PREVIOUS_BUTTON)}
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_DOWN_BUTTON)}
          </div>
          <div class="flex-fill" />
        </div>

        {dashboard && (
          <div onClick={this.toggleButtons} class="cursor-pointer mt-2">
            <hr class="mb-1" />
            <i
              class={cx('fe', 'mr-2', {
                'fe-chevron-up': !collapsed,
                'fe-chevron-down': collapsed
              })}
            />
            <Text id="remoteControl.television.toggleMore" />
          </div>
        )}

        <div
          class={cx('collapse', {
            show: !collapsed,
            hide: collapsed
          })}
        >
          <div class="d-flex justify-content-between mt-3">
            <div class="d-flex flex-column align-items-start">
              <div class="mb-auto">{this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.TOOLS_BUTTON)}</div>
              <div>{this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.RETURN_BUTTON)}</div>
            </div>

            <div class="rounded-circle bg-secondary border">
              <div class="d-flex justify-content-center">
                {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.UP_BUTTON)}
              </div>
              <div class="d-flex justify-content-between">
                {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.LEFT_BUTTON)}
                {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.ENTER_BUTTON)}
                {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.RIGHT_BUTTON)}
              </div>
              <div class="d-flex justify-content-center">
                {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.DOWN_BUTTON)}
              </div>
            </div>

            <div class="d-flex flex-column align-items-start">
              <div class="mb-auto">{this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.INFO_BUTTON)}</div>
              <div>{this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.EXIT_BUTTON)}</div>
            </div>
          </div>

          <div class="d-flex btn-group mt-3">
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.RED_BUTTON)}
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.GREEN_BUTTON)}
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.YELLOW_BUTTON)}
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.BLUE_BUTTON)}
          </div>

          <div class="d-flex btn-group mt-3">
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.REWIND_BUTTON)}
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.PAUSE_BUTTON)}
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.FORWARD_BUTTON)}
          </div>
          <div class="d-flex btn-group mt-2">
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.RECORD_BUTTON)}
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.PLAY_BUTTON)}
            {this.renderButton(DEVICE_FEATURE_TYPES.TELEVISION.STOP_BUTTON)}
          </div>
        </div>
      </div>
    );
  }
}

export default TelevisionRemoteBox;
