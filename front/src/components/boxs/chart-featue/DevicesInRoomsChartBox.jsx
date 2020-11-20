import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Chart from 'react-apexcharts';

import actions from '../../../actions/dashboard/boxes/devicesInRoom';

import lineConfig from './chart-style/lineConfig';
import areaConfig from './chart-style/areaConfig';
import barConfig from './chart-style/barConfig';
/*
import { RequestStatus, DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
*/

@connect('session,user,DashboardBoxDataDevicesInRoom,DashboardBoxStatusDevicesInRoom', actions)
class DevicesInRoomsChartBox extends Component {
  generateData(baseval, count, yrange) {
    let i = 0;
    const series = [];
    while (i < count) {
      const x = Math.floor(Math.random() * (750 - 1 + 1)) + 1;
      const y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
      const z = Math.floor(Math.random() * (75 - 15 + 1)) + 15;

      series.push([x, y, z]);
      baseval += 86400000;
      i++;
    }
    return series;
  }

  getDeviceFeatures = async () => {
    const newSeries = [
      {
        name: 'series-1',
        data: [30, 40, 91, 60, 49, 55, 70, 15]
      }
    ];
    const newOptions = lineConfig.OPTIONS;
    newOptions.xaxis.categories = [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998];

    const newSeriesArea = [
      {
        name: 'series-1',
        data: [30, 40, 91, 60, 49, 55, 70, 15]
      }
    ];
    const newOptionsArea = areaConfig.OPTIONS;
    newOptionsArea.xaxis.categories = [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998];

    const newSeriesBar = [
      {
        name: 'series-1',
        data: [30, 40, 91, 60, 49, 55, 70, 15]
      }
    ];
    const newOptionsBar = barConfig.OPTIONS;
    newOptionsBar.xaxis.categories = [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998];

    const newSeries2 = [
      {
        name: 'series-1',
        data: [30, 40, 91, 60, 49, 55, 70, 15]
      },
      {
        name: 'series-2',
        data: [10, 20, 88, 7, 77, 15, 70, 18]
      }
    ];
    const newOptions2 = {
      chart: {
        id: 'basic-bar'
      },
      xaxis: {
        categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998]
      }
    };

    const newOptionsDonut = {};
    const newSeriesDonut = [44, 55, 41, 17, 15];
    const newLabelDonut = ['A', 'B', 'C', 'D', 'E'];

    const newOptionsBubble = {
      dataLabels: {
        enabled: false
      },
      fill: {
        opacity: 0.8
      },
      title: {
        text: 'Simple Bubble Chart'
      },
      xaxis: {
        tickAmount: 12,
        type: 'category'
      },
      yaxis: {
        max: 70
      }
    };
    const newSeriesBubble = [
      {
        name: 'Bubble1',
        data: this.generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
          min: 10,
          max: 60
        })
      },
      {
        name: 'Bubble2',
        data: this.generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
          min: 10,
          max: 60
        })
      },
      {
        name: 'Bubble3',
        data: this.generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
          min: 10,
          max: 60
        })
      },
      {
        name: 'Bubble4',
        data: this.generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
          min: 10,
          max: 60
        })
      }
    ];

    this.setState({
      series: newSeries,
      options: newOptions,
      series2: newSeries2,
      options2: newOptions2,
      seriesArea: newSeriesArea,
      optionsArea: newOptionsArea,
      seriesBar: newSeriesBar,
      optionsBar: newOptionsBar,
      optionsDonut: newOptionsDonut,
      seriesDonut: newSeriesDonut,
      label: newLabelDonut,
      optionsBubble: newOptionsBubble,
      seriesBubble: newSeriesBubble
    });
  };

  constructor(props) {
    super(props);

    this.state = {
      options: {},
      options2: {},
      optionsArea: {},
      optionsBar: {},
      series: [],
      series2: [],
      seriesArea: [],
      seriesBar: [],
      optionsDonut: {},
      seriesDonut: [],
      label: [],
      optionsBubble: {},
      seriesBubble: []
    };
  }

  componentDidMount() {
    this.getDeviceFeatures();
  }

  render(props) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.zwave.network.title" />
          </h3>
        </div>
        <Chart options={this.state.optionsBar} series={this.state.seriesBar} type="bar" width="100%" heigth="400px" />
        <Chart options={this.state.options2} series={this.state.series2} type="bar" width="100%" heigth="400px" />
        <Chart options={this.state.options} series={this.state.series} type="line" width="100%" heigth="400px" />
        <Chart options={this.state.options2} series={this.state.series2} type="line" width="100%" heigth="400px" />
        <Chart
          options={this.state.optionsArea}
          series={this.state.seriesArea}
          type="area"
          width="100%"
          heigth="400px"
        />
        <Chart
          options={this.state.optionsDonut}
          series={this.state.seriesDonut}
          type="donut"
          width="100%"
          heigth="400px"
        />
        <Chart options={this.state.options} series={this.state.series} type="radar" width="100%" heigth="400px" />
        <Chart
          options={this.state.optionsBubble}
          series={this.state.seriesBubble}
          type="bubble"
          width="100%"
          heigth="400px"
        />
      </div>
    );
  }
}

export default DevicesInRoomsChartBox;
