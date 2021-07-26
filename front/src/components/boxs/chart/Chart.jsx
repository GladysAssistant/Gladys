import { Component, createRef } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import ApexCharts from 'apexcharts';
import style from './style.css';

class Chartbox extends Component {
  chartRef = createRef();
  toggleDropdown = () => {
    this.setState({
      dropdown: !this.state.dropdown
    });
  };
  getData = async () => {
    try {
      const data = await this.props.httpClient.get(
        `/api/v1/device_feature/${this.state.deviceFeature}/aggregated_states`,
        {
          interval: 7 * 24 * 60
        }
      );
      const series = [
        {
          name: this.state.title,
          data: []
        }
      ];
      const labels = [];
      data.forEach(point => {
        series[0].data.push(point.value);
        labels.push(point.created_at);
      });
      const firstElement = data[0];
      const lastElement = data[data.length - 1];
      const variation = Math.round((100 * firstElement.value) / lastElement.value);
      const lastValueRounded = Math.round(lastElement.value);
      await this.setState({
        series,
        labels,
        variation,
        lastValueRounded
      });
      this.displayChart();
    } catch (e) {
      console.error(e);
    }
  };
  displayChart = () => {
    const options = {
      chart: {
        type: 'area',
        fontFamily: 'inherit',
        height: this.state.height === 'small' ? 40.0 : 200,
        sparkline: {
          enabled: true
        },
        animations: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        opacity: 0.16,
        type: 'solid'
      },
      stroke: {
        width: 2,
        lineCap: 'round',
        curve: 'smooth'
      },
      // series: this.state.series,
      series: [
        {
          name: 'Temperature',
          data: [
            37,
            35,
            44,
            28,
            36,
            24,
            65,
            31,
            37,
            39,
            62,
            51,
            35,
            41,
            35,
            27,
            93,
            53,
            61,
            27,
            54,
            43,
            19,
            46,
            39,
            62,
            51,
            35,
            41,
            67
          ]
        }
      ],
      grid: {
        strokeDashArray: 4
      },
      xaxis: {
        labels: {
          padding: 0
        },
        tooltip: {
          enabled: false
        },
        axisBorder: {
          show: false
        },
        type: 'datetime'
      },
      yaxis: {
        labels: {
          padding: 4
        }
      },
      // labels: this.state.labels,
      labels: [
        '2020-06-21',
        '2020-06-22',
        '2020-06-23',
        '2020-06-24',
        '2020-06-25',
        '2020-06-26',
        '2020-06-27',
        '2020-06-28',
        '2020-06-29',
        '2020-06-30',
        '2020-07-01',
        '2020-07-02',
        '2020-07-03',
        '2020-07-04',
        '2020-07-05',
        '2020-07-06',
        '2020-07-07',
        '2020-07-08',
        '2020-07-09',
        '2020-07-10',
        '2020-07-11',
        '2020-07-12',
        '2020-07-13',
        '2020-07-14',
        '2020-07-15',
        '2020-07-16',
        '2020-07-17',
        '2020-07-18',
        '2020-07-19',
        '2020-07-20'
      ],
      colors: ['#206bc4'],
      legend: {
        show: false
      }
    };
    console.log(options);
    if (this.chart) {
      this.chart.updateOptions(options);
    } else {
      this.chart = new ApexCharts(this.chartRef.current, options).render();
    }
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      deviceFeature: 'mqtt-temperature-dataset',
      height: 'small',
      title: 'Temperature',
      unit: '°C'
    };
  }
  componentDidMount() {
    this.getData();
  }
  render(props, { title, unit, dropdown, variation, lastValueRounded }) {
    return (
      <div class="card">
        <div class="card-body">
          <div class="d-flex align-items-center">
            <div class={style.subheader}>{title}</div>
            <div class={cx(style.msAuto, style.lh1)}>
              <div class="dropdown">
                <a class="dropdown-toggle text-muted" onClick={this.toggleDropdown}>
                  Last 7 days
                </a>
                <div
                  class={cx(style.dropdownMenuChart, {
                    [style.show]: dropdown
                  })}
                >
                  <a
                    class={cx(style.dropdownItemChart, {
                      [style.active]: true
                    })}
                    href="#"
                  >
                    Last 7 days
                  </a>
                  <a class={cx(style.dropdownItemChart)} href="#">
                    Last 30 days
                  </a>
                  <a class={cx(style.dropdownItemChart)} href="#">
                    Last 3 months
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="d-flex align-items-baseline">
            <div class="h1 mb-0 mr-2">
              {lastValueRounded}
              {unit}
            </div>
            <div
              class={cx(style.meAuto, {
                [style.textGreen]: variation > 0,
                [style.textYellow]: variation === 0,
                [style.textRed]: variation < 0
              })}
            >
              <span class="text-green d-inline-flex align-items-center lh-1">
                {variation}%
                {variation > 0 && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class={cx(style.variationIcon)}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <polyline points="3 17 9 11 13 15 21 7" />
                    <polyline points="14 7 21 7 21 14" />
                  </svg>
                )}
                {variation === 0 && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class={cx(style.variationIcon)}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
                {variation < 0 && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class={cx(style.variationIcon)}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <polyline points="3 7 9 13 13 9 21 17" />
                    <polyline points="21 10 21 17 14 17" />
                  </svg>
                )}
              </span>
            </div>
          </div>
        </div>
        <div ref={this.chartRef} class="chart-sm" />
      </div>
    );
  }
}

export default connect('httpClient')(Chartbox);
