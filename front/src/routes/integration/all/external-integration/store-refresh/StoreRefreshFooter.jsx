import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

/**
 * Re-download the community integration catalog. The server keeps the store
 * index in cache, so an integration published since the last refresh stays
 * invisible until the next periodic one.
 *
 * Deliberately at the very end of the list: it is a rare gesture, and that
 * spot is also where it lands right under the "no result" message when a
 * search for a freshly published integration comes back empty — the moment
 * someone actually needs it.
 */
const StoreRefreshFooter = ({ onRefresh, status, stale }) => {
  const refreshing = status === RequestStatus.Getting;
  let messageId;
  let colorClass;
  if (status === RequestStatus.Error) {
    messageId = 'integration.root.refreshStore.error';
    colorClass = 'text-danger';
  } else if (status === RequestStatus.Success) {
    // an unreachable store does not fail the request: the server answers
    // with its cached catalog, so a plain success message would be a lie
    messageId = stale ? 'integration.root.refreshStore.stale' : 'integration.root.refreshStore.success';
    colorClass = stale ? 'text-warning' : 'text-muted';
  }
  return (
    <div class="text-center mt-5 mb-3">
      <span class="text-muted small mr-1">
        <Text id="integration.root.refreshStore.hint" />
      </span>
      <Localizer>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          class="btn btn-link btn-sm p-0"
          title={<Text id="integration.root.refreshStore.tooltip" />}
        >
          <i class="fe fe-refresh-cw mr-1" />
          <Text id={refreshing ? 'integration.root.refreshStore.refreshing' : 'integration.root.refreshStore.button'} />
        </button>
      </Localizer>
      {messageId && (
        // the outcome lands well after the click, so it has to be announced:
        // alert for a failure, status for the quieter outcomes
        <div role={status === RequestStatus.Error ? 'alert' : 'status'} class={cx('small mt-1', colorClass)}>
          <Text id={messageId} />
        </div>
      )}
    </div>
  );
};

export default StoreRefreshFooter;
