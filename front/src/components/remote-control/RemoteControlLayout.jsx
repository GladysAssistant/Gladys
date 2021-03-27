import cx from 'classnames';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../server/utils/constants';
import TelevisionRemoteBox from './templates/television/TelevisionRemoteBox';
import LightRemoteBox from './templates/light/LightRemoteBox';

const RemoteControlLayout = ({ remoteType, remoteName, onClick, editionMode, featureByType, loading, dashboard }) => {
  let remoteComponent;
  switch (remoteType) {
    case DEVICE_FEATURE_CATEGORIES.TELEVISION: {
      remoteComponent = (
        <TelevisionRemoteBox onClick={onClick} editionMode={editionMode} featureByType={featureByType} />
      );
      break;
    }
    case DEVICE_FEATURE_CATEGORIES.LIGHT: {
      remoteComponent = <LightRemoteBox onClick={onClick} editionMode={editionMode} featureByType={featureByType} />;
      break;
    }
    default: {
      remoteComponent = null;
    }
  }

  if (!remoteComponent) {
    return null;
  }

  return (
    <div class="card">
      <div
        class={cx('dimmer', {
          active: loading
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="card-header">{remoteName}</div>

          <div
            class={cx('p-5', {
              'pl-md-8 pr-md-8 pl-sm-9 pr-sm-9': dashboard
            })}
          >
            {remoteComponent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteControlLayout;
