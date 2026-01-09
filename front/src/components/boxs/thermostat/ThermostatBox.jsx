import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ApexCharts from 'apexcharts';
import { Text } from 'preact-i18n';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import { checkAndConvertUnit } from '../../../../../server/utils/units';

class ThermostatBox extends Component {
  state = {
    graphValues: {},
    error: false,
    noDeviceFeatureSelector: null,
    annotations: []
  };


  getIndexForFeature = ( featureSelector ) => {
    const deviceFeatureIndex = this.props.box.device_features.findIndex(
      df => df === featureSelector
    );
    return deviceFeatureIndex;
  }
   
  setValueForFeature = ( graphValues, featureSelector, value ) => {
    const deviceFeatureIndex = this.getIndexForFeature(featureSelector);
    if (deviceFeatureIndex === -1) {
      return graphValues;
    }
    
    const updatedGraphValues = {
      ...graphValues,
      [this.props.box.device_feature_names[deviceFeatureIndex]]: value
    };
    return updatedGraphValues;
  };
  getDevice = async () => {
    try {
      await this.setState({
        error: false
      });

      if (this.props.box.device_features && this.props.box.device_features.length === 0) {
        this.setState({ noDeviceFeatureSelector: true });
        return;
      }

      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_selectors: this.props.box.device_features.join(',')
      });

      if (!devices.length || !devices[0].features.length) {
        this.setState({ noDeviceFeatureSelector: true });
        return;
      }

      const device = devices[0];
      let graphValues = this.state.graphValues || {};
      this.props.box.device_features.forEach ((feature, index) => {
        graphValues = this.setValueForFeature(
          graphValues,
          feature,
          device.features.find(f => f.selector === feature).last_value
        );
      });
      this.setState({
        boxName: device.name,
        noDeviceFeatureSelector: false,
        graphValues: graphValues
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
    const graphValues = this.setValueForFeature(
      this.state.graphValues,
      payload.device_feature_selector,
      payload.last_value
    );
    this.setState({ graphValues });
  };

  getGraphMinMax = () => {
    const maxSetpoint = this.state.graphValues['max_temp_setpoint'] || 50;
    const minSetpoint = this.state.graphValues['min_temp_setpoint'] || 0;
    const band = (Math.abs(maxSetpoint - minSetpoint))/5
    const chartMin = minSetpoint - band
    const chartMax = maxSetpoint + band
    return {chartMin, chartMax};
  }

  updateChartValue = deviceFeature => {
    if (!deviceFeature || !this.chart) return;

    if (deviceFeature.last_value === null) {
      this.setState({
        noDeviceFeatureLastValue: true
      });
      return;
    }

    const value = deviceFeature.last_value !== undefined ? deviceFeature.last_value : 0;
    const { chartMin, chartMax } = this.getGraphMinMax();

    // Calculate percentage for the gauge
    const percentage = chartMax !== chartMin ? Math.round(((value - chartMin) / (chartMax - chartMin)) * 100) : 0;

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
    if (prevProps.box.device_features !== this.props.box.device_features) {
      this.getDevice();
    }
    if (
      prevState.graphValues['actual_temp_sensor'] !== this.state.graphValues['actual_temp_sensor']
    ) {
      // Only initialize the chart if it doesn't exist yet
      if (!this.chart) {
        this.initChart();
      } else {
        this.updateChartValue(this.state.deviceFeature);
      }
    }
  }

  createTicks(value, text, color, min, max) {
    // Map the temperature to the 0-100% range of the radial bar
    const percent = ((value - min) * 100) / (max - min);
    
    return {
      // In RadialBars, x is the label name
      x: text || 'Temperature', 
      y: percent, // Percentage of the bar filled
      marker: {
        size: 8,
        fillColor: color,
        strokeColor: '#fff',
      },
      label: {
        text: `${text}: ${value}°`,
        style: { background: color, color: '#fff' }
      }
    };
  }
  
  initChart() {
    // Defer execution to let Preact attach the element to the DOM
    setTimeout(() => {
      const { graphValues, boxName } = this.state;
      if (Object.keys(graphValues).length === 0) return;

      // Clear any existing chart
      if (this.chart) {
        this.chart.destroy();
      }
      const { chartMin, chartMax } = this.getGraphMinMax();
      const options = {
        // Your series remains a percentage calculation
        series: [((this.state.graphValues['actual_temp_sensor'] - chartMin) * 100) / (chartMax - chartMin)],
        chart: {
          height: 350,
          type: 'radialBar',
          offsetY: -5
        },
        plotOptions: {
          radialBar: {
            startAngle: -135,
            endAngle: 135,
            hollow: { size: '65%' },
            dataLabels: {
              name: { show: true, offsetY: 100 },
              value: {
                offsetY: 60,
                formatter: () => this.formatValueWithUnit(
                  this.state.graphValues['actual_temp_sensor'], 
                  "°C" // TODO: update with actual centigrade or farenhiet
                )
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
            stops: [0, 50, 65, 91]
          }
        },
        stroke: {
          dashArray: 4
        },
      
        labels: [boxName || 'Temperature']
      };

      // Create and render the chart
      this.chart = new ApexCharts(this.chartElement, options);
      this.chart.render();
      // Create annotations for setpoints
      const annotations = this.renderTicks();
      this.setState({ annotations: annotations });
    }, 0);
  }
  /// render css overlay and functionality
  // Add these to your ThermostatBox class

  handleMouseDown = (e, type) => {
    e.preventDefault();
    this.draggingType = type; // 'min_temp_setpoint', etc.
    this.lastX = e.clientX;
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
  };

  getBoundingClientRect = () => {
    const currentRect = this.chartElement ? this.chartElement.getBoundingClientRect() : null;
    const graphRadius = currentRect ? currentRect.width*0.65 / 2 : 0;
    return { currentRect, graphRadius };  
  };

  handleMouseMove = (e) => {
   /* if (!this.draggingType) return;
    const graphValues = this.state.graphValues;
    const { chartMin, chartMax } = this.getGraphMinMax();
    if ( this.lastX < e.clientX ) {
      // moving right
      graphValues[this.draggingType] += 1;
      if (graphValues[this.draggingType] > chartMax) {
        graphValues[this.draggingType] = chartMax;
      }
      if (graphValues[this.draggingType] > 50) {
        graphValues[this.draggingType] = 50;
      }
    } else if ( this.lastX > e.clientX ) {
      // moving left
      graphValues[this.draggingType] -= 1;
      if (graphValues[this.draggingType] < chartMin) {
        graphValues[this.draggingType] = chartMin;
      }
      if (graphValues[this.draggingType] < 0) {
        graphValues[this.draggingType] = 0;
      }
    }
    this.lastX = e.clientX;

    // Here you would trigger the Gladys API call to save the new setpoint
    this.setState({ graphValues: { ...this.state.graphValues } });*/
  }

  handleMouseUp = () => {
    this.draggingType = null;
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    // Here you would trigger the Gladys API call to save the new setpoint
  };
  getTickRotation = (temp, chartMin, chartMax) =>{
    const minTemp = chartMin;
    const maxTemp = chartMax;
    // 1. Calculate how far along the scale the temp is (0 to 1)
    const percent = (temp - minTemp) / (maxTemp - minTemp);
    // 2. Map that to your -135 to +135 range
    const angle = (percent * 270) - 135;
    // 3. The rotation for normality
    // If your tick is a vertical line, 'angle' is the rotation.
    return angle;
}
  /* The base style for a single tick */
  getChartTickStyle = (angle,major) => {
    const {graphRadius} = this.getBoundingClientRect();
    const radius = graphRadius*0.9;
    const height = major ? '15px' : '10px';
    const width = major ? '3px' : '2px';
    const backgroundColor = major ? '#99a3a4' : '#ccd1d1';
    return ({
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: width,          /* Thickness of the tick */
        height: height,        /* Length of the tick */
        backgroundColor: backgroundColor,
        transform: `rotate(${angle}deg) translateY(${-radius}px)`,
    });
  };
  getChartLabelStyle = (angle) => {
    const {graphRadius} = this.getBoundingClientRect();
    const radius = graphRadius*0.68;
    const displacement = angle < 0 ? radius+10 : radius;
    return ({
        position: 'absolute',
        top: '50%',
        left: '50%',
        textAlign: 'center',
        transform: `rotate(${angle}deg) translateY(${-displacement}px) rotate(${-angle}deg)`,
    });
  };
  renderTicks = () => {
      const ticks = [];
      const { chartMin, chartMax } = this.getGraphMinMax();
      for ( let tick = Math.ceil(chartMin); tick <= Math.floor(chartMax); tick += 1 ) {
        const angle = this.getTickRotation(tick, chartMin,  chartMax);
        ticks.push(
          <div 
            key={tick}
            style={this.getChartTickStyle(angle, tick % 5 === 0)}
          ></div>
        );
      }
    for ( let tick = 5; tick <= Math.floor(chartMax); tick += 5 ) {
        const angle = this.getTickRotation(tick, chartMin, chartMax);
        ticks.push(
          <div 
            key={tick}
            style={this.getChartLabelStyle(angle)}
          >{tick}</div>
        );
      }
      
      return ticks;
  }
////
  render(props, { graphValues, annotations, error, noDeviceFeatureSelector, noDeviceFeatureLastValue }) {
      // Helper to calculate CSS for placing handles on the circle
      const getHandleStyle = (value, color) => {
        // Map value to angle (-135 to 135)
        const { chartMin, chartMax } = this.getGraphMinMax();
        const angle = ((value - chartMin) / (chartMax - chartMin)) * 270 - 135;
        return {
          position: 'absolute',
          top: '49%',
          left: '49%',
          width: '24px',
          height: '24px',
          marginLeft: '-4px', // Half of width
          marginTop: '-4px',  // Half of height
          cursor: 'grab',
          backgroundColor: color,
          border: '3px solid white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          zIndex: 10,
          // The magic: Rotate to angle, move out to radius, rotate back to keep text upright
          transform: `rotate(${angle}deg) translateY(-130px) rotate(${-angle}deg)`
        };
      };

    return (
      <div class="card">
        <div style={{ position: 'relative', width: '100%', maxWidth: '350px', margin: '0 auto' }}>
      
        {/* 1. The ApexChart */}
        {Object.keys(graphValues).length > 0 && (
          <div>
            <div ref={el => this.chartElement = el} class="gauge-chart" />
      
            {/* Ticks */}
            {annotations}
              
            {/* 2. Interactive Handles */}
            <div 
              style={getHandleStyle(graphValues.min_temp_setpoint, '#00E396')}
              onMouseDown={(e) => this.handleMouseDown(e, 'min_temp_setpoint')}
            >
              <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>{graphValues.min_temp_setpoint}</span>
            </div>

            <div 
              style={getHandleStyle(graphValues.max_temp_setpoint, '#FF4560')}
              onMouseDown={(e) => this.handleMouseDown(e, 'max_temp_setpoint')}
            >
              <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>{graphValues.max_temp_setpoint}</span>
            </div>

            {/* 4. Interactive Target Handle */}
            <div 
              style={getHandleStyle(graphValues.target_temp_setpoint, '#775DD0')}
              onMouseDown={(e) => this.handleMouseDown(e, 'target_temp_setpoint')}
            >
              <span style={{ color: 'white', fontSize: '10px' }}>🎯</span>
            </div>
          </div>
        )}
        {/* 5. Center Text Overlay
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -20%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{graphValues.actual_temp_sensor}°</div>
          <div style={{ color: '#888', textTransform: 'uppercase', fontSize: '12px' }}>Current</div>
        </div> */}


      </div>
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

export default connect('httpClient,session,user', {})(withIntlAsProp(ThermostatBox));
