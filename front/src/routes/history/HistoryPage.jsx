import { Component } from 'preact';
import { useMemo } from 'preact/hooks';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import dayjs from 'dayjs';

import withIntlAsProp from '../../utils/withIntlAsProp';
import EventLine from './EventLine';
import { ALL_GROUPS } from './categoryGroups';
import style from './style.css';

// Groups consecutive events of the same device feature ("bursts") so
// a chatty sensor doesn't flood the timeline, then splits them by day.
const buildTimeline = events => {
  const days = [];
  let currentDay = null;
  let currentEventGroup = null;

  events.forEach(event => {
    const dayKey = dayjs(event.created_at).format('YYYY-MM-DD');
    if (!currentDay || currentDay.dayKey !== dayKey) {
      currentDay = { dayKey, date: event.created_at, eventGroups: [] };
      days.push(currentDay);
      currentEventGroup = null;
    }
    if (currentEventGroup && currentEventGroup.selector === event.device_feature.selector) {
      currentEventGroup.events.push(event);
    } else {
      currentEventGroup = {
        key: `${event.device_feature.selector}-${event.created_at}`,
        selector: event.device_feature.selector,
        events: [event]
      };
      currentDay.eventGroups.push(currentEventGroup);
    }
  });

  return days;
};

const DayLabel = ({ date, language }) => {
  const day = dayjs(date);
  if (day.isSame(dayjs(), 'day')) {
    return <Text id="history.today" />;
  }
  if (day.isSame(dayjs().subtract(1, 'day'), 'day')) {
    return <Text id="history.yesterday" />;
  }
  return <span>{day.locale(language || 'en').format('dddd D MMMM YYYY')}</span>;
};

class LoadMoreSentinel extends Component {
  componentDidMount() {
    if (typeof IntersectionObserver === 'function') {
      this.observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            this.props.onVisible();
          }
        },
        { rootMargin: '300px' }
      );
      this.observer.observe(this.base);
    }
  }

  componentWillUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  render() {
    return <div class={style.sentinel} />;
  }
}

const HistoryPage = ({ intl, user, ...props }) => {
  // Rebuild the timeline only when the events change, not on every render
  // (e.g. expanding/collapsing a group), since it walks the whole events list.
  const timeline = useMemo(() => buildTimeline(props.events), [props.events]);
  const language = user && user.language;

  return (
    <div class="page">
      <div class="page-main">
        <div class="my-3 my-md-5">
          <div class="container">
            <div class={cx('page-header', style.pageHeader)}>
              <div class={style.headerText}>
                <h1 class="page-title">
                  <Text id="history.title" />
                  {!props.selectedDate && (
                    <span class={style.liveIndicator}>
                      <span class={style.liveDot} />
                      <Text id="history.live" />
                    </span>
                  )}
                </h1>
                <div class={style.subtitle}>
                  <Text id="history.subtitle" />
                </div>
              </div>
              <div class={style.headerControls}>
                <Localizer>
                  <input
                    type="date"
                    class={cx('form-control', style.dateInput)}
                    value={props.selectedDate || ''}
                    onChange={props.selectDate}
                    max={dayjs().format('YYYY-MM-DD')}
                    title={<Text id="history.jumpToDate" />}
                  />
                </Localizer>
                <select onChange={props.selectRoom} class={cx('form-control', 'custom-select', style.roomSelect)}>
                  <option value="">
                    <Text id="history.allRooms" />
                  </option>
                  {props.rooms.map(room => (
                    <option value={room.id} selected={props.selectedRoomId === room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <div class={cx('input-icon', style.searchInput)}>
                  <span class="input-icon-addon">
                    <i class="fe fe-search" />
                  </span>
                  <Localizer>
                    <input
                      type="text"
                      class="form-control"
                      placeholder={<Text id="history.searchPlaceholder" />}
                      onInput={props.search}
                      value={props.searchValue}
                    />
                  </Localizer>
                </div>
              </div>
            </div>

            <div class={style.groupChips}>
              <button
                type="button"
                class={cx(style.groupChip, {
                  [style.groupChipActive]: !props.selectedGroup
                })}
                onClick={() => props.selectGroup(null)}
              >
                <i class="fe fe-list" />
                <Text id="history.groups.all" />
              </button>
              {ALL_GROUPS.map(group => (
                <button
                  type="button"
                  class={cx(style.groupChip, style[`groupChip-${group.colorClass}`], {
                    [style.groupChipActive]: props.selectedGroup === group.id
                  })}
                  onClick={() => props.selectGroup(group.id)}
                >
                  <i class={`fe fe-${group.icon}`} />
                  <Text id={`history.groups.${group.id}`} />
                </button>
              ))}
            </div>

            {props.selectedDate && (
              <div class={style.pastBanner}>
                <span>
                  <i class="fe fe-clock mr-2" />
                  <Text id="history.browsingPast" fields={{ date: dayjs(props.selectedDate).format('DD/MM/YYYY') }} />
                </span>
                <button type="button" class="btn btn-sm btn-outline-primary" onClick={props.backToLive}>
                  <i class="fe fe-zap mr-1" />
                  <Text id="history.backToLive" />
                </button>
              </div>
            )}

            {props.pendingLiveEvents.length > 0 && (
              <button type="button" class={style.newEventsPill} onClick={props.showPendingLiveEvents}>
                <i class="fe fe-arrow-up mr-2" />
                <Text
                  id="history.newEvents"
                  plural={props.pendingLiveEvents.length}
                  fields={{ count: props.pendingLiveEvents.length }}
                />
              </button>
            )}

            {props.error && (
              <div class="alert alert-danger">
                <Text id="history.error" />
              </div>
            )}

            <div
              class={cx('dimmer', {
                active: props.loading && !props.initialized
              })}
            >
              <div class="loader" />
              <div class="dimmer-content">
                {props.initialized && timeline.length === 0 && !props.error && (
                  <div class="card">
                    <div class={cx('card-body', style.emptyState)}>
                      <div class={style.emptyStateIcon}>
                        <i class="fe fe-activity" />
                      </div>
                      <h4>
                        <Text id="history.emptyTitle" />
                      </h4>
                      <p class="text-muted">
                        <Text id="history.emptyText" />
                      </p>
                    </div>
                  </div>
                )}

                {timeline.map(day => (
                  <div class={style.daySection}>
                    <div class={style.dayHeader}>
                      <span class={style.dayHeaderLabel}>
                        <DayLabel date={day.date} language={language} />
                      </span>
                      <span class={style.dayHeaderLine} />
                    </div>
                    <div class="card">
                      <div class={cx('card-body', style.timelineCard)}>
                        {day.eventGroups.map(eventGroup => (
                          <EventLine
                            eventGroup={eventGroup}
                            intl={intl}
                            expanded={props.expandedGroups[eventGroup.key]}
                            toggleExpand={() => props.toggleExpand(eventGroup.key)}
                            featuresBySelector={props.featuresBySelector}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {props.hasMore && !props.loading && <LoadMoreSentinel onVisible={props.loadMore} />}
                {props.hasMore && (
                  <div class={style.loadMoreContainer}>
                    <button
                      type="button"
                      class={cx('btn', 'btn-outline-primary', { 'btn-loading': props.loading })}
                      onClick={props.loadMore}
                      disabled={props.loading}
                    >
                      <Text id="history.loadMore" />
                    </button>
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

export default withIntlAsProp(HistoryPage);
