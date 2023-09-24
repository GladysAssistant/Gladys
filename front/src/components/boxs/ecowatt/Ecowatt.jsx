import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';

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
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.ecowatt.error" />
            </span>
          </p>
        )}
        {!error && (
          <div class="dimmer-content" style={{ minHeight: '200px' }}>
            <h4 style={{ fontSize: '16px' }}>
              <Text id="dashboard.boxes.ecowatt.dailyTitle" />
            </h4>
            <div class="row">
              {hours &&
                hours.map(hour => (
                  <div style={{ width: '10%', margin: '0.25em 1.25%' }}>
                    <p style={{ margin: 'auto', textAlign: 'center', fontSize: '10px', color: 'grey' }}>{hour.hour}</p>
                    <p style={{ margin: 'auto', textAlign: 'center' }}>
                      {hour.data === 1 && <i class="fe fe-check" style={{ fontSize: '20px', color: '#00b894' }} />}
                      {hour.data === 2 && (
                        <i class="fe fe-alert-circle" style={{ fontSize: '20px', color: '#fdcb6e' }} />
                      )}
                      {hour.data === 3 && (
                        <i class="fe fe-alert-triangle" style={{ fontSize: '20px', color: '#d63031' }} />
                      )}
                    </p>
                  </div>
                ))}
            </div>
            <div class="mt-3">
              <h4 style={{ fontSize: '16px' }}>
                <Text id="dashboard.boxes.ecowatt.nextDaysTitle" />
              </h4>
              <ul class="list-unstyled list-separated mb-0">
                <li class="list-separated-item">
                  {days &&
                    days.map(day => (
                      <div class="row mb-1">
                        <div class="col">{day.day}</div>
                        <div class="col-auto">
                          {day.data === 1 && (
                            <span class="badge badge-success">
                              <Text id="dashboard.boxes.ecowatt.ok" />
                            </span>
                          )}
                          {day.data === 2 && (
                            <span class="badge badge-warning">
                              <Text id="dashboard.boxes.ecowatt.warning" />
                            </span>
                          )}
                          {day.data === 3 && (
                            <span class="badge badge-danger">
                              <Text id="dashboard.boxes.ecowatt.critical" />
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </li>
              </ul>
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
