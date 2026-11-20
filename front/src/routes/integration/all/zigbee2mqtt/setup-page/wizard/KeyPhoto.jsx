import { Component } from 'preact';
import cx from 'classnames';

import { getPhotoUrl } from './adapters';
import style from './wizard.css';

// The photo of a coordinator model, loaded from zigbee2mqtt.io; an icon without Internet or without known photo
class KeyPhoto extends Component {
  showIcon = () => this.setState({ failedUrl: getPhotoUrl(this.props.adapter) });

  render({ adapter, size = 64, round = false }, { failedUrl }) {
    const url = getPhotoUrl(adapter);
    return (
      <span
        class={cx(style.keyPhoto, { [style.keyPhotoRound]: round })}
        style={{ width: `${size}px`, height: `${size}px` }}
        data-cy="z2m-wizard-key-photo"
      >
        {url && url !== failedUrl ? (
          <img
            src={url}
            alt=""
            loading="lazy"
            referrerpolicy="no-referrer"
            width={size - 8}
            height={size - 8}
            onError={this.showIcon}
          />
        ) : (
          <i class="fe fe-cpu" aria-hidden="true" style={{ fontSize: `${Math.round(size / 2.4)}px` }} />
        )}
      </span>
    );
  }
}

export default KeyPhoto;
