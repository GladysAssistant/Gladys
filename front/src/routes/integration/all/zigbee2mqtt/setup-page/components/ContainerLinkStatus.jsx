import cx from 'classnames';

const ContainerLinkStatus = ({ linked, loading }) => {
  const line = (
    <div class="flex-fill">
      <div class="d-sm-none py-1 my-1 border" />
      <hr
        class={cx('d-none', 'd-sm-block', {
          border: !loading,
          'bg-dark': !loading,
          'loading-border': loading
        })}
      />
    </div>
  );

  return (
    <div class="d-flex flex-column flex-sm-row flex-fill justify-content-center align-items-center">
      {line}
      <i
        class={cx('fe', 'h3', 'my-0', 'mx-2', {
          'fe-check': linked && !loading,
          'text-success': linked && !loading,
          'fe-x': !linked && !loading,
          'text-danger': !linked && !loading,
          'fe-refresh-cw': loading,
          'text-info': loading
        })}
      />
      {line}
    </div>
  );
};

export default ContainerLinkStatus;
