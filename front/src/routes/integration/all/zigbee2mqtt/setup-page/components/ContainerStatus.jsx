import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

const ContainerStatus = ({ imageSrc, title, loading, running, exists }) => {
  let containerStatus;
  if (loading) {
    containerStatus = <Text id="systemSettings.containerState.restarting" />;
  } else if (!exists) {
    containerStatus = <Text id="systemSettings.containerState.dead" />;
  } else if (running) {
    containerStatus = <Text id="systemSettings.containerState.running" />;
  } else {
    containerStatus = <Text id="systemSettings.containerState.exited" />;
  }

  return (
    <div class="d-flex flex-row flex-sm-column flex-fill text-center justify-content-between justify-content-sm-center">
      <div class="text-uppercase text-muted h6">{title}</div>
      <div class="my-3 d-none d-sm-block">
        <Localizer>
          <img src={imageSrc} alt={title} title={title} width="80" height="80" />
        </Localizer>
      </div>
      <div>
        <div
          class={cx('tag', {
            'tag-success': running,
            'tag-secondary': !running,
            'tag-info': loading
          })}
        >
          {containerStatus}
        </div>
      </div>
    </div>
  );
};

export default ContainerStatus;
