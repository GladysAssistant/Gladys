import { Component } from 'preact';
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
  const timeline = buildTimeline(props.events);
  const language = user && user.language;

  return (
    <div class="page">
      <div class="page-main">
        <div class="my-3 my-md-5">
          <div class="container">
            <div class="page-header">
              <h1 class="page-title">
                <Text id="history.title" />
                <span class={style.liveBadge}>
                  <span class={style.liveDot} />
                  <Text id="history.live" />
                </span>
              </h1>
              <div class="page-subtitle">
                <Text id="history.subtitle" />
              </div>
              <div class="page-options d-flex">
                <select onChange={props.selectRoom} class="form-control custom-select w-auto">
                  <option value="">
                    <Text id="history.allRooms" />
                  </option>
                  {props.rooms.map(room => (
                    <option value={room.id} selected={props.selectedRoomId === room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <div class="input-icon ml-2">
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
