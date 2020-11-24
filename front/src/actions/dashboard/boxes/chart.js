import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
import update from 'immutability-helper';
import chartConfig from './chart-box-config/chartConfig';
import chartStyle from '../../../actions/dashboard/boxes/chart-box-config/chartStyle';

const BOX_KEY = 'ChartBox';
function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    toggleDropDown(state) {
      state.showDropDownChartBox = !state.showDropDownChartBox;
      console.log('toggleDropDown' + state.showDropDownChartBox);
      store.setState({
        showDropDownChartBox: !state.showDropDownChartBox
      });
    },
    buildChartOption(state, box, x, y) {
      const chartData = {
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

      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        let chartTypeStyle;
        switch (box.chartType) {
          case chartConfig.CHART_TYPE_SELECTOR.LINE.name:
            chartTypeStyle = chartStyle.OPTIONS_LINE;
            break;
          case chartConfig.CHART_TYPE_SELECTOR.AREA.name:
            chartTypeStyle = chartStyle.OPTIONS_AREA;
            break;
          case chartConfig.CHART_TYPE_SELECTOR.BAR.name:
            chartTypeStyle = chartStyle.OPTIONS_BAR;
            break;
          default:
            chartTypeStyle = chartStyle.OPTIONS_LINE.NAME;
        }

        // we merge the old with the new one
        let options = update(
          chartStyle.OPTIONS_COMMON,
          {
            chart: {
              $merge: chartTypeStyle.chart
            }
          },
          {
            xaxis: {
              $merge: chartTypeStyle.xaxis
            }
          },
          {
            yaxis: {
              $merge: chartTypeStyle.yaxis
            }
          }
        );
        for (let attrName in chartTypeStyle) {
          if (attrName !== 'chart' && attrName !== 'xaxis' && attrName !== 'yaxis') {
            if (chartTypeStyle.hasOwnProperty(attrName)) {
              options[attrName] = chartTypeStyle[attrName];
            }
          }
        }

        const xData = [];
        const yData = [];
        chartData.deviceFeatureState.forEach(element => {
          xData.push(element.date);
          yData.push(element.value);
        });
        options.xaxis.categories = xData; // [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998];

        const minYAxis = Math.min.apply(null, yData);
        const maxYAxis = Math.max.apply(null, yData);
        options.yaxis.min = minYAxis - 1;
        options.yaxis.max = maxYAxis + 1;

        const series = [
          {
            name: chartData.deviceName,
            data: yData // [30, 40, 91, 60, 49, 55, 70, 15]
          }
        ];

        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          options,
          series,
          roomName: chartData.roomName,
          deviceName: chartData.deviceName
        });

        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    }
  };

  return actions;
}

export default createActions;
