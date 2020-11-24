import { Component } from 'preact';
import { Text } from 'preact-i18n';
import update from 'immutability-helper';
import { connect } from 'unistore/preact';
import Chart from 'react-apexcharts';

import actions from '../../../actions/dashboard/boxes/chart';

import chartConfig from '../../../actions/dashboard/boxes/chart-box-config/chartConfig';
import chartStyle from '../../../actions/dashboard/boxes/chart-box-config/chartStyle';

@connect('session,user,DashboardBoxDataDevicesInRoom,DashboardBoxStatusDevicesInRoom', actions)
class ChartOneFeaturesBox extends Component {
  getChartData() {
    const result = {
      roomName: 'Salon',
      deviceName: 'Temperature',
      lastValue: 30,
      unit: '°C',
      deviceFeatureState: [
        {
          date: '2020-10-01',
          value: 29
        },
        {
          date: '2020-09-01',
          value: 20
        },
        {
          date: '2020-08-01',
          value: 21
        },
        {
          date: '2020-07-01',
          value: 14
        },
        {
          date: '2020-06-01',
          value: 33
        },
        {
          date: '2020-05-01',
          value: 17
        },
        {
          date: '2020-04-01',
          value: 12
        },
        {
          date: '2020-03-01',
          value: 20
        },
        {
          date: '2020-02-01',
          value: 14
        },
        {
          date: '2020-01-01',
          value: 22
        }
      ]
    };

    return result;
  }

  configChart = async () => {
    let cartTypeStyle;
    switch (this.props.box.chartType) {
      case chartConfig.CHART_TYPE_SELECTOR.LINE.name:
        cartTypeStyle = chartStyle.OPTIONS_LINE;
        break;
      case chartConfig.CHART_TYPE_SELECTOR.AREA.name:
        cartTypeStyle = chartStyle.OPTIONS_AREA;
        break;
      case chartConfig.CHART_TYPE_SELECTOR.BAR.name:
        cartTypeStyle = chartStyle.OPTIONS_BAR;
        break;
      default:
        cartTypeStyle = chartStyle.OPTIONS_LINE.NAME;
    }

    // we merge the old with the new one
    let newOptions = update(
      chartStyle.OPTIONS_COMMON,
      {
        chart: {
          $merge: cartTypeStyle.chart
        }
      },
      {
        xaxis: {
          $merge: cartTypeStyle.xaxis
        }
      },
      {
        yaxis: {
          $merge: cartTypeStyle.yaxis
        }
      }
    );
    for (let attrName in cartTypeStyle) {
      if (attrName !== 'chart' && attrName !== 'xaxis' && attrName !== 'yaxis') {
        if (cartTypeStyle.hasOwnProperty(attrName)) {
          newOptions[attrName] = cartTypeStyle[attrName];
        }
      }
    }

    // FAKE DATA
    const chartData = this.getChartData();

    const yData = [];
    chartData.deviceFeatureState.forEach(element => {
      yData.push(element.value);
    });
    const xData = [];
    chartData.deviceFeatureState.forEach(element => {
      xData.push(element.date);
    });

    const newSeries = [
      {
        name: chartData.deviceName,
        data: yData // [30, 40, 91, 60, 49, 55, 70, 15]
      }
    ];
    newOptions.xaxis.categories = xData; // [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998];

    const minYAxis = Math.min.apply(null, yData);
    const maxYAxis = Math.max.apply(null, yData);
    newOptions.yaxis.min = minYAxis - 1;
    newOptions.yaxis.max = maxYAxis + 1;

    this.setState({
      chartData,
      showDropDownChartBox: false,
      series: newSeries,
      options: newOptions
    });
  };

  constructor(props) {
    super(props);

    let apexType;
    switch (this.props.box.chartType) {
      case chartConfig.CHART_TYPE_SELECTOR.LINE.name:
        apexType = chartConfig.CHART_TYPE_SELECTOR.LINE.apexName;
        break;
      case chartConfig.CHART_TYPE_SELECTOR.AREA.name:
        apexType = chartConfig.CHART_TYPE_SELECTOR.AREA.apexName;
        break;
      case chartConfig.CHART_TYPE_SELECTOR.BAR.name:
        apexType = chartConfig.CHART_TYPE_SELECTOR.BAR.apexName;
        break;
      default:
        apexType = chartConfig.CHART_TYPE_SELECTOR.LINE.apexName;
    }

    this.state = {
      chartData: {},
      showDropDownChartBox: false,
      apexType,
      options: {},
      series: []
    };
  }

  componentDidMount() {
    this.configChart();
  }

  render(props, { chartData, showDropDownChartBox }) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{chartData.roomName + ' - ' + chartData.deviceName}</h3>
        </div>
        <div class="card-body">
          <div class="d-flex align-items-center">
            <div class="subheader">
              <Text id="dashboard.boxes.devicesChart.lastValue" />
            </div>
            <div class="ml-auto lh-1">
              <div class={'dropdown ' + (this.state.showDropDownChartBox && ' show')}>
                <a
                  class={'dropdown-toggle text-muted show ' + (this.state.showDropDownChartBox && ' show')}
                  data-toggle="dropdown"
                  onClick={props.toggleDropDown}
                >
                  <Text id="dashboard.period.label.last1day" />
                </a>
                <div class={'dropdown-menu dropdown-menu-right ' + (this.state.showDropDownChartBox && ' show')}>
                  <a class="dropdown-item active" href="#">
                    <Text id="dashboard.period.label.last1day" />
                  </a>
                  <a class="dropdown-item" href="#">
                    <Text id="dashboard.period.label.last1week" />
                  </a>
                  <a class="dropdown-item" href="#">
                    <Text id="dashboard.period.label.last1month" />
                  </a>
                  <a class="dropdown-item" href="#">
                    <Text id="dashboard.period.label.last1year" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="d-flex align-items-baseline">
            <div class="h1 mb-3 mr-2">{chartData.lastValue + ' ' + chartData.unit}</div>
          </div>
          <Chart options={this.state.options} series={this.state.series} type={this.state.apexType} class="chart-sm" />
        </div>
      </div>
    );
  }
}

export default ChartOneFeaturesBox;
