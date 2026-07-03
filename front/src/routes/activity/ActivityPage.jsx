import { Text } from 'preact-i18n';
import cx from 'classnames';
import ActivityLogEntry from './ActivityLogEntry';
import ActivityLogFilters from './ActivityLogFilters';
import style from './style.css';

const ActivityPage = ({
  entries,
  loading,
  loadingMore,
  isLastPage,
  period,
  roomSelector,
  rooms,
  mode,
  dictionary,
  language,
  onPeriodChange,
  onRoomChange,
  onModeChange,
  onRefresh,
  onLoadMore
}) => (
    <div class="page">
      <div class="page-main">
        <div class="my-3 my-md-5">
          <div class="container">
            <div class="page-header">
              <div>
                <h1 class="page-title">
                  <Text id="activityLog.pageTitle" />
                </h1>
                <p class="text-muted mb-0">
                  <Text id="activityLog.subtitle" />
                </p>
              </div>
            </div>

            <ActivityLogFilters
              period={period}
              roomSelector={roomSelector}
              rooms={rooms}
              mode={mode}
              onPeriodChange={onPeriodChange}
              onRoomChange={onRoomChange}
              onModeChange={onModeChange}
              onRefresh={onRefresh}
            />

            <div
              class={cx('dimmer', style.activityLogDimmer, {
                active: loading
              })}
            >
              <div class="loader" />
              <div class="dimmer-content">
                <div class={style.activityLogContainer}>
                  {entries.length === 0 && !loading && (
                    <div class={style.activityLogEmpty}>
                      <div class={style.activityLogEmptyIcon}>
                        <i class="fe fe-clock" />
                      </div>
                      <h3>
                        <Text id="activityLog.emptyTitle" />
                      </h3>
                      <p class="text-muted">
                        <Text id="activityLog.emptyDescription" />
                      </p>
                    </div>
                  )}

                  {entries.map((entry, index) => (
                    <ActivityLogEntry
                      key={`${entry.device_feature_selector}-${entry.created_at}-${index}`}
                      entry={entry}
                      dictionary={dictionary}
                      language={language}
                    />
                  ))}

                  {!isLastPage && entries.length > 0 && (
                    <div class={style.activityLogLoadMore}>
                      <button
                        type="button"
                        class="btn btn-outline-primary"
                        onClick={onLoadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <Text id="activityLog.loadingMore" />
                        ) : (
                          <Text id="activityLog.loadMore" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
);

export default ActivityPage;
