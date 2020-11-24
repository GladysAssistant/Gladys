import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Chart from 'react-apexcharts';
// import ReactApexCharts from 'react-apexcharts';

import { DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import get from 'get-value';

import actions from '../../../actions/dashboard/boxes/chart';

import chartConfig from '../../../actions/dashboard/boxes/chart-box-config/chartConfig';

@connect('session,user,DashboardBoxDataChartBox,DashboardBoxStatusChartBox', actions)
class ChartMultiFeaturesBox extends Component {
  constructor(props) {
    super(props);

    console.log('constructor: ' + this.props.box + this.props.x, +this.props.y);
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

    this.props.buildChartOption(this.props.box, this.props.x, this.props.y);

    const boxData = get(this.props, `${DASHBOARD_BOX_DATA_KEY}ChartBox.${this.props.x}_${this.props.y}`);

    console.log('test0: ', boxData);
    console.log('test1: ', this.props.box);

    this.state = {
      chartData: {},
      showDropDownChartBox: false,
      apexType,
      options: {},
      series: []
    };
  }
  // TODO mettre le loading

  componentDidMount() {
    console.log('componentDidMount: ' + this.props.box + this.props.x, +this.props.y);
    // this.props.buildChartOption(this.props.box, this.props.x, this.props.y);

    const boxData = get(this.props, `${DASHBOARD_BOX_DATA_KEY}ChartBox.${this.props.x}_${this.props.y}`);
    console.log('test: ', this.props.box);
    this.state = {
      options: boxData.options,
      series: boxData.series
    };
  }

  render(props, { chartData, showDropDownChartBox }) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}ChartBox.${props.x}_${props.y}`);
    console.log('boxData: ', boxData);
    // TODO voir usage box status = dimmer loading ?
    // const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}ChartBox.${props.x}_${props.y}`);
    const options = get(boxData, 'options');
    const series = get(boxData, 'series');
    const roomName = get(boxData, 'roomName');
    const deviceName = get(boxData, 'deviceName');
    console.log('options: ', options);
    console.log('options2: ', this.state.options);
    console.log('series: ', series);
    console.log('apexType: ' + this.state.apexType);
    console.log('roomName: ' + roomName);
    console.log('deviceName: ' + deviceName);

    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{props.box.chartName}</h3>
        </div>
        <div class="card-body">
          <div class="d-flex align-items-center">
            <div class="subheader">
              <Text id="dashboard.boxes.devicesChart.lastValue" />
            </div>
            <div class="ml-auto lh-1">
              <div class={'dropdown ' + (showDropDownChartBox && ' show')}>
                <a
                  class={'dropdown-toggle text-muted show ' + (showDropDownChartBox && ' show')}
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
          <Chart options={options} series={series} type={this.state.apexType} class="chart-sm" />
        </div>
      </div>
    );
  }
}

export default ChartMultiFeaturesBox;
