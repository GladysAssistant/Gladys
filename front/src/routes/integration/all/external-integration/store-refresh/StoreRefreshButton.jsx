import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

/**
 * Discreet control to re-download the community integration catalog: the
 * store index is cached server-side, so a freshly published integration
 * only shows up here at the next periodic refresh. The icon + label say
 * what it refreshes; the tooltip says why it exists.
 */
const StoreRefreshButton = ({ onRefresh, status }) => {
  const refreshing = status === RequestStatus.Getting;
  return (
    <Localizer>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        class={cx('btn btn-secondary btn-sm', { 'btn-loading': refreshing })}
        title={<Text id="integration.root.refreshStore.tooltip" />}
      >
        <i class="fe fe-refresh-cw mr-1" />
        <Text id="integration.root.refreshStore.button" />
      </button>
    </Localizer>
  );
};

/**
 * Outcome of the last refresh, on its own line: the messages are longer
 * than the button, so keeping them out of the header flex row stops them
 * from pushing the other controls around. Renders nothing until a refresh
 * has been asked for.
 *
 * `stale` covers the silent failure: an unreachable store does not fail the
 * request, the server answers with its cached catalog, so a plain success
 * message would be a lie.
 */
const StoreRefreshFeedback = ({ status, stale, wrapperClass }) => {
  let messageId;
  let colorClass;
  if (status === RequestStatus.Error) {
    messageId = 'integration.root.refreshStore.error';
    colorClass = 'text-danger';
  } else if (status === RequestStatus.Success) {
    messageId = stale ? 'integration.root.refreshStore.stale' : 'integration.root.refreshStore.success';
    colorClass = stale ? 'text-warning' : 'text-muted';
  } else {
    return null;
  }
  return (
    <div class={cx('small', colorClass, wrapperClass)}>
      <Text id={messageId} />
    </div>
  );
};

export default StoreRefreshButton;
export { StoreRefreshFeedback };
