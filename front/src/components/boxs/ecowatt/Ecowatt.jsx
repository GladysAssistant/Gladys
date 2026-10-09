import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import dayjs from 'dayjs';
import style from './style.css';

// The Ecowatt signal level IS the information: tinted tiles and color-dot
// pills from the same family as the EDF Tempo widget
const LEVEL_STYLE_KEYS = {
  1: 'levelOk',
  2: 'levelWarning',
  3: 'levelCritical'
};

const LEVEL_LABEL_KEYS = {
  1: 'ok',
  2: 'warning',
  3: 'critical'
};

const DayLevel = ({ level }) =>
  LEVEL_STYLE_KEYS[level] ? (
    <span class={cx(style.dayBadge, style[LEVEL_STYLE_KEYS[level]])}>
      <span class={style.dayDot} />
      <Text id={`dashboard.boxes.ecowatt.${LEVEL_LABEL_KEYS[level]}`} />
    </span>
  ) : null;

const EcowattBox = ({ hours, days, loading, error }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <i class="fe fe-zap" />
        <span class="m-1">
          <Text id="dashboard.boxes.ecowatt.title" />
        </span>
      </h3>
    </div>
    <div class="card-body">
      <div class={`dimmer ${loading ? 'active' : ''}`}>
        <div class="loader" />
        {error && (
          <div class={style.errorState}>
            <i class="fe fe-bell" />
            <span>
              <Text id="dashboard.boxes.ecowatt.error" />
            </span>
          </div>
        )}
        {!error && (
          <div class="dimmer-content" style={{ minHeight: '200px' }}>
            <h4 class={style.sectionTitle}>
              <Text id="dashboard.boxes.ecowatt.dailyTitle" />
            </h4>
            <div class={style.hoursStrip}>
              {hours &&
                hours.map(hour => (
                  <div class={cx(style.hourCell, style[LEVEL_STYLE_KEYS[hour.data]])}>
                    {hour.hour}
                    <span class={style.hourUnit}>h</span>
                  </div>
                ))}
            </div>
            <div class="mt-3">
              <h4 class={style.sectionTitle}>
                <Text id="dashboard.boxes.ecowatt.nextDaysTitle" />
              </h4>
              {days &&
                days.map(day => (
                  <div class={style.dayRow}>
                    <span class={style.dayName}>{day.day}</span>
                    <DayLevel level={day.data} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

class Ecowatt extends Component {
  refreshData = async () => {
    try {
      await this.setState({ error: false, loading: true });
      const ecowattData = await this.props.httpClient.get('/api/v1/service/ecowatt/signals');
      const hours = [];
      const days = [];
      const currentHour = dayjs().hour();
      if (ecowattData.today) {
        ecowattData.today.values.forEach(todayHour => {
          if (todayHour.pas >= currentHour && hours.length < 8) {
            hours.push({
              hour: todayHour.pas,
              data: todayHour.hvalue
            });
          }
        });
        if (hours.length < 8 && ecowattData.tomorrow) {
          ecowattData.tomorrow.values.forEach(tomorrowHour => {
            if (hours.length < 8) {
              hours.push({
                hour: tomorrowHour.pas,
                data: tomorrowHour.hvalue
              });
            }
          });
        }
      }
      ecowattData.days.forEach(day => {
        days.push({
          day: dayjs(day.jour)
            .locale(this.props.user.language)
            .format('ddd LL'),
          data: day.dvalue
        });
      });
      this.setState({ hours, days, error: false, loading: false });
    } catch (e) {
      this.setState({ error: true, loading: false });
    }
  };

  componentDidMount() {
    this.refreshData();
  }

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      loading: true,
      error: false
    };
  }

  render({}, { hours, days, loading, error }) {
    return <EcowattBox hours={hours} days={days} loading={loading} error={error} />;
  }
}

export default connect('httpClient,user', {})(Ecowatt);
