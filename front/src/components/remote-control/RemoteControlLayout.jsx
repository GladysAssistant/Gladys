import { createElement } from 'preact';
import cx from 'classnames';
import { TEMPLATE_BY_CATEGORY } from './templates';

const RemoteControlLayout = ({ remoteType, remoteName, onClick, editionMode, featureByType, loading, dashboard }) => {
  const template = TEMPLATE_BY_CATEGORY[remoteType];
  if (!template) {
    return null;
  }

  const remoteComponent = template.component;
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
              'pl-9 pr-9': dashboard
            })}
          >
            {createElement(remoteComponent, { onClick, editionMode, featureByType, dashboard })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteControlLayout;
