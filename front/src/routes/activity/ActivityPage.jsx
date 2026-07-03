import { Text } from 'preact-i18n';
import cx from 'classnames';
import ActivityLogEntry from './ActivityLogEntry';
import ActivityLogFilters from './ActivityLogFilters';
import { groupEntriesByDay } from './utils';
import style from './style.css';

const ActivityPage = ({
  entries,
  loading,
  loadingMore,
  isLastPage,
  period,
  customFrom,
  customTo,
  roomSelector,
  rooms,
  mode,
  dictionary,
  language,
  onPeriodChange,
  onCustomFromChange,
  onCustomToChange,
  onRoomChange,
  onModeChange,
  onRefresh,
  onLoadMore
}) => {
  const dayGroups = groupEntriesByDay(entries, language, dictionary);

  return (
    <div class="page">
      <div class="page-main">
        <div class="my-3 my-md-5">
          <div class="container">
            <div class={cx('page-header', style.pageHeader)}>
              <div>
                <h1 class="page-title">
                  <Text id="activityLog.pageTitle" />
                </h1>
                <p class={cx('text-muted', 'mb-0', style.subtitle)}>
                  <Text id="activityLog.subtitle" />
                </p>
              </div>
              <div class={cx('page-options', 'd-flex', style.pageOptions)}>
                <ActivityLogFilters
                  period={period}
                  customFrom={customFrom}
                  customTo={customTo}
                  roomSelector={roomSelector}
                  rooms={rooms}
                  mode={mode}
                  onPeriodChange={onPeriodChange}
                  onCustomFromChange={onCustomFromChange}
                  onCustomToChange={onCustomToChange}
                  onRoomChange={onRoomChange}
                  onModeChange={onModeChange}
                  onRefresh={onRefresh}
                />
              </div>
            </div>

            <div class={cx('dimmer', style.dimmerWrap, { active: loading && entries.length > 0 })}>
              <div class="loader" />
              <div class="dimmer-content">
                {loading && entries.length === 0 ? (
                  <div class={style.feed}>
                    {[1, 2, 3, 4].map(i => (
                      <div class={style.skeletonEntry} key={i}>
                        <div class={style.skeletonTime} />
                        <div class={style.skeletonRow}>
                          <div class={style.skeletonIcon} />
                          <div class={style.skeletonLines}>
                            <div class={style.skeletonTitle} />
                            <div class={style.skeletonMeta} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div class={style.feed}>
                    {entries.length === 0 && !loading && (
                      <div class={style.empty}>
                        <div class={style.emptyIcon}>
                          <i class="fe fe-activity" />
                        </div>
                        <h3 class={style.emptyTitle}>
                          <Text id="activityLog.emptyTitle" />
                        </h3>
                        <p class={style.emptyText}>
                          <Text id="activityLog.emptyDescription" />
                        </p>
                      </div>
                    )}

                    {dayGroups.map(group => (
                      <section key={group.key} class={style.daySection}>
                        {dayGroups.length > 1 || period === 'custom' ? (
                          <div class={style.dayHeader}>{group.label}</div>
                        ) : null}
                        {group.entries.map((entry, index) => (
                          <ActivityLogEntry
                            key={`${entry.device_feature_selector}-${entry.created_at}-${index}`}
                            entry={entry}
                            dictionary={dictionary}
                            language={language}
                          />
                        ))}
                      </section>
                    ))}

                    {!isLastPage && entries.length > 0 && (
                      <div class={style.loadMore}>
                        <button type="button" class={style.loadMoreBtn} onClick={onLoadMore} disabled={loadingMore}>
                          {loadingMore ? <Text id="activityLog.loadingMore" /> : <Text id="activityLog.loadMore" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
