import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ApexCharts from 'apexcharts';
import { Text } from 'preact-i18n';
import withIntlAsProp from '../../../utils/withIntlAsProp';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import { checkAndConvertUnit } from '../../../../../server/utils/units';

class GaugeBox extends Component {
  state = {
    deviceFeature: null,
    error: false,
    noDeviceFeatureSelector: null
  };
  getDevice = async () => {
    try {
      await this.setState({
        error: false
      });

      if (!this.props.box.device_feature) {
        this.setState({ noDeviceFeatureSelector: true });
        return;
      }

      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_selectors: this.props.box.device_feature
      });

      if (!devices.length || !devices[0].features.length) {
        this.setState({ noDeviceFeatureSelector: true });
        return;
      }

      const device = devices[0];

      const deviceFeature = device.features.find(f => f.selector === this.props.box.device_feature);

      this.setState({
        boxName: device.name,
        deviceFeature,
        noDeviceFeatureSelector: false
      });
    } catch (e) {
      console.error(e);
      this.setState({
        error: true,
        noDeviceFeatureSelector: false
      });
    }
  };

  updateDeviceStateWebsocket = payload => {
    if (payload.device_feature_selector === this.props.box.device_feature) {
      const newDeviceFeature = {
        ...this.state.deviceFeature,
        last_value: payload.last_value,
        last_value_changed: payload.last_value_changed
      };
      this.setState({ deviceFeature: newDeviceFeature });
    }
  };

  updateChartValue = deviceFeature => {
    if (!deviceFeature || !this.chart) return;

    if (deviceFeature.last_value === null) {
      this.setState({
        noDeviceFeatureLastValue: true
      });
      return;
    }

    // Get min and max from deviceFeature or use defaults
    const min = deviceFeature.min !== undefined ? deviceFeature.min : 0;
    const max = deviceFeature.max !== undefined ? deviceFeature.max : 100;
    const value = deviceFeature.last_value !== undefined ? deviceFeature.last_value : 0;

    // Calculate percentage for the gauge
    const percentage = max !== min ? Math.round(((value - min) / (max - min)) * 100) : 0;

    // Update the chart series with the new percentage
    this.chart.updateSeries([percentage]);

    // Update the value formatter to show the actual value with unit if available
    this.chart.updateOptions({
      plotOptions: {
        radialBar: {
          dataLabels: {
            value: {
              formatter: () => this.formatValueWithUnit(value, deviceFeature.unit)
            }
          }
        }
      }
    });
  };

  formatValueWithUnit = (value, unit) => {
    const { user } = this.props;

    // Conversion if necessary (and if user is present)
    const { distance_unit_preference: userUnitPreference } = user;
    const { value: displayValue, unit: displayUnit } = checkAndConvertUnit(value, unit, userUnitPreference);

    // Format the value to 1 decimal place
    const formattedValue = displayValue.toFixed(1);

    // If no unit, just return the formatted value
    if (!displayUnit) {
      return formattedValue;
    }

    // Get the unit translation from the dictionary
    const unitTranslation =
      this.props.intl && this.props.intl.dictionary
        ? this.props.intl.dictionary.deviceFeatureUnitShort[displayUnit]
        : displayUnit;

    // Return the value with the unit
    return `${formattedValue} ${unitTranslation || displayUnit}`;
  };

  handleWebsocketConnected = ({ connected }) => {
    // When the websocket is disconnected, we refresh the data when the websocket is reconnected
    if (!connected) {
      this.wasDisconnected = true;
    } else if (this.wasDisconnected) {
      this.getDevice();
      this.wasDisconnected = false;
    }
  };

  componentDidMount() {
    this.getDevice();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    this.props.session.dispatcher.addListener('websocket.connected', this.handleWebsocketConnected);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    this.props.session.dispatcher.removeListener('websocket.connected', this.handleWebsocketConnected);
  }

  componentDidUpdate(prevProps, prevState) {
    // Initialize or update chart when deviceFeature changes
    if (prevProps.box.device_feature !== this.props.box.device_feature) {
      this.getDevice();
    }
    if (
      this.state.deviceFeature &&
      (!prevState.deviceFeature || prevState.deviceFeature.last_value !== this.state.deviceFeature.last_value)
    ) {
      // Only initialize the chart if it doesn't exist yet
      if (!this.chart) {
        this.initChart();
      } else {
        this.updateChartValue(this.state.deviceFeature);
      }
    }
  }

  initChart() {
    const { deviceFeature, boxName } = this.state;
    if (!deviceFeature || !this.chartElement) return;

    if (deviceFeature.last_value === null) {
      this.setState({
        noDeviceFeatureLastValue: true
      });
      return;
    }

    this.setState({
      noDeviceFeatureLastValue: false
    });

    // Get min and max from deviceFeature or use defaults
    const min = deviceFeature.min !== null ? deviceFeature.min : 0;
    const max = deviceFeature.max !== null ? deviceFeature.max : 100;
    const value = deviceFeature.last_value;

    // Calculate percentage for the gauge
    const percentage = max !== min ? Math.round(((value - min) / (max - min)) * 100) : 0;

    // Clear any existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    // Configure chart options
    const options = {
      series: [percentage],
      chart: {
        height: 250,
        type: 'radialBar',
        offsetY: -10
      },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          dataLabels: {
            name: {
              fontSize: '16px',
              color: undefined,
              offsetY: 120
            },
            value: {
              offsetY: 76,
              fontSize: '22px',
              color: undefined,
              formatter: () => {
                // Show actual value with unit if available
                return this.formatValueWithUnit(value, deviceFeature.unit);
              }
            }
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          shadeIntensity: 0.15,
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 50, 65, 91]
        }
      },
      stroke: {
        dashArray: 4
      },
      labels: [boxName || 'Value']
    };

    // Create and render the chart
    this.chart = new ApexCharts(this.chartElement, options);
    this.chart.render();
  }

  render(props, { deviceFeature, error, noDeviceFeatureSelector, noDeviceFeatureLastValue }) {
    return (
      <div class="card">
        {deviceFeature && <div ref={el => (this.chartElement = el)} class="gauge-chart" />}
        {error && (
          <div class="card-body">
            <div class="alert alert-danger">
              <i class="fe fe-alert-triangle mr-2" /> <Text id="dashboard.boxes.gauge.errorLoadingDevice" />
            </div>
          </div>
        )}
        {noDeviceFeatureSelector && (
          <div class="card-body">
            <div class="alert alert-danger">
              <i class="fe fe-alert-triangle mr-2" /> <Text id="dashboard.boxes.gauge.noDeviceFeatureSelector" />
            </div>
          </div>
        )}
        {noDeviceFeatureLastValue && (
          <div class="card-body">
            <div class="alert alert-warning">
              <i class="fe fe-alert-triangle mr-2" /> <Text id="dashboard.boxes.gauge.noDeviceFeatureLastValue" />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default connect('httpClient,session,user', {})(withIntlAsProp(GaugeBox));
