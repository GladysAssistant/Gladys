import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import actions from '../../../actions/dashboard/boxes/weather';
import {
  RequestStatus,
  GetWeatherModes,
  GetWeatherStatus,
  DASHBOARD_BOX_STATUS_KEY,
  DASHBOARD_BOX_DATA_KEY
} from '../../../utils/consts';
import get from 'get-value';

const padding = {
  paddingLeft: '40px',
  paddingRight: '40px',
  paddingTop: '10px',
  paddingBottom: '10px'
};

const BOX_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

const WeatherBox = ({ children, ...props }) => (
  <div class="card">
    {props.boxStatus === GetWeatherStatus.HouseHasNoCoordinates && (
      <div>
        <h4 class="card-header">
          <Text id="dashboard.boxTitle.weather" />
        </h4>
        <div class="card-body">
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.weather.houseHasNoCoordinates" />
            </span>
          </p>
        </div>
      </div>
    )}
    {props.boxStatus === GetWeatherStatus.ServiceNotConfigured && (
      <div>
        <h4 class="card-header">
          <Text id="dashboard.boxTitle.weather" />
        </h4>
        <div class="card-body">
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.weather.serviceNotConfigured" />
            </span>
          </p>
        </div>
      </div>
    )}
    {props.boxStatus === RequestStatus.Error && (
      <div>
        <h4 class="card-header">
          <Text id="dashboard.boxTitle.weather" />
        </h4>
        <div class="card-body">
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.weather.unknownError" />
            </span>
          </p>
        </div>
      </div>
    )}
    {props.boxStatus === RequestStatus.Getting && !props.weather && (
      <div>
        <div class="card-body">
          <div class="dimmer active">
            <div class="loader" />
            <div class="dimmer-content" style={padding} />
          </div>
        </div>
      </div>
    )}
    {props.boxStatus === GetWeatherStatus.RequestToThirdPartyFailed && (
      <div>
        <h4 class="card-header">
          <Text id="dashboard.boxTitle.weather" />
        </h4>
        <div class="card-body">
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.weather.requestToThirdPartyFailed" />{' '}
              <Link href="/dashboard/integration/weather/openweather">
                <Text id="dashboard.boxes.weather.clickHere" />
              </Link>
            </span>
          </p>
        </div>
      </div>
    )}
    {props.weather && (
      <div style={padding} class="card-block px-30 py-10">
        <div
            style={{
              fontSize: '14px',
              color: '#76838f'
            }}
        >

          {props.datetimeBeautiful + ' - ' + props.houseName}
        </div>
        <div class="row">
          <div class="col-9">
            <div
              style={{
                fontSize: '40px',
                lineHeight: '1.2'
              }}
              class="font-size-40 blue-grey-700"
            >
              <Text id="global.degreeValue" fields={{ value: props.temperature }} />
              <span
                style={{
                  fontSize: '30px'
                }}
              >
                {props.units === 'metric' ? 'C' : 'F'}
              </span>
            </div>
          </div>
          <div
            class="col-3 text-right"
            style={{
              paddingRight: '10px',
              paddingLeft: '10px',
              marginTop: '-0.75rem'
            }}
          >
            <i
                className={'fe ' + props.weather}
                style={{
                  fontSize: '60px'
                }}
            />
          </div>
        </div>
        {props.display_mode[GetWeatherModes.AdvancedWeather] && (
            <div className="col-9" style={{padding: '0'}}>
              <span>
                <i
                  class="fe fe-droplet"
                  style={{
                    fpaddingRight: '5px'
                  }}
                />
                {props.humidity}
                <span
                  style={{
                    fontSize: '12px',
                    color: 'grey'
                  }}
                >
                %
                </span>
              </span>
              <span style={{ float: 'right' }}>
                  <i
                      class="fe fe-wind"
                      style={{
                        paddingRight: '5px'
                      }}
                  />
                  {props.wind}
                <span
                    style={{
                      fontSize: '12px',
                      color: 'grey'
                    }}
                >
                {props.units === 'si' ? 'km/h' : 'm/h'}
              </span>
            </span>
            </div>
        )}
        {props.display_mode[GetWeatherModes.HourlyForecast] && (
            <div>
              <div
                  class="row"
                  style={{
                    marginTop: '0.5em'
                  }}
              >
                {props.hours_display}
              </div>
            </div>
        )}
        {props.display_mode[GetWeatherModes.DailyForecast] && (
            <div>
              <div
                  class="row"
              >
                <div className="container">
                {props.days_display}
                </div>
              </div>
            </div>
        )}
      </div>
    )}
  </div>
);

@connect('DashboardBoxDataWeather,DashboardBoxStatusWeather', actions)
class WeatherBoxComponent extends Component {
  componentDidMount() {
    // get the weather
    this.props.getWeather(this.props.box, this.props.x, this.props.y);
    // refresh weather every interval
    setInterval(() => this.props.getWeather(this.props.box, this.props.x, this.props.y), BOX_REFRESH_INTERVAL_MS);
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}Weather.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}Weather.${props.x}_${props.y}`);
    const weatherObject = get(boxData, 'weather');
    const displayMode = this.props.box.modes || {};
    const datetimeBeautiful = get(weatherObject, 'datetime_beautiful');
    const temperature = Math.round(get(weatherObject, 'temperature'));
    const units = get(weatherObject, 'units');

    const houseName = get(weatherObject, 'house.name');

    const weather = get(weatherObject, 'weather');

    let humidity, wind, hoursDisplay, daysDisplay;
    if (displayMode[GetWeatherModes.AdvancedWeather]) {
      humidity = get(weatherObject, 'humidity');
      wind = get(weatherObject, 'wind_speed');
      if (units === 'si') {
        wind = wind * 3.6;
        wind = wind.toFixed(2);
      }
    }

    if (displayMode[GetWeatherModes.HourlyForecast]) {
      const hours = get(weatherObject, 'hours');
      if (typeof hours !== 'undefined') {
        let i = 0;
        hoursDisplay = hours.map(hour => {
          return (
              <div style={Object.assign({ width: '10%', margin: '0.25em 1.25%' })}>
                <p style={{ margin: 'auto', textAlign: 'center', fontSize: '10px', color: 'grey' }}>
                  {hour.datetime_beautiful}h
                </p>
                <p style={{ margin: 'auto', textAlign: 'center' }}>
                  <i className={'fe ' + hour.weather_icon} style={{ fontSize: '20px' }} />
                </p>
                <p style={{ margin: 'auto', textAlign: 'center', fontSize: '12px' }}>{hour.temperature}&deg;</p>
              </div>
          );
        });
      }
    }

    if(displayMode[GetWeatherModes.DailyForecast]){
      const days = get(weatherObject, 'days');
      if (typeof days !== 'undefined') {
        let i = 0;
        daysDisplay = days.map(day => {
          return (
              <div className="row" style={{marginTop: '0.5em'}}>
                <div className="col-5">
                  {day.datetime_beautiful}
                </div>
                <div className="col-3">
                  <i className={'fe ' + day.weather_icon} style={{ fontSize: '20px' }} />
                </div>
                <div className="col-4" style={{textAlign: 'right' }}>
                  {day.temperature_min}&deg;/{day.temperature_max}&deg;
                </div>
              </div>
          );
        });
      }
    }

    return (
      <WeatherBox
        {...props}
        weather={weather}
        temperature={temperature}
        units={units}
        boxStatus={boxStatus}
        datetimeBeautiful={datetimeBeautiful}
        houseName={houseName}
        hours_display={hoursDisplay}
        days_display={daysDisplay}
        humidity={humidity}
        wind={wind}
        display_mode={displayMode}
      />
    );
  }
}

export default WeatherBoxComponent;
