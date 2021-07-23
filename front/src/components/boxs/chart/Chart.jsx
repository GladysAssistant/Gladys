import { Component } from 'preact';
import cx from 'classnames';
import ApexCharts from 'apexcharts';
import style from './style.css';

class Chartbox extends Component {
  toggleDropdown = () => {
    this.setState({
      dropdown: !this.state.dropdown
    });
  };
  componentDidMount() {
    this.chart = new ApexCharts(document.getElementById('chart-revenue-bg'), {
      chart: {
        type: 'area',
        fontFamily: 'inherit',
        height: 40.0,
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
      series: [
        {
          name: 'Profits',
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
      labels: [
        '2020-06-20',
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
        '2020-07-19'
      ],
      colors: ['#206bc4'],
      legend: {
        show: false
      }
    }).render();
  }
  render(props, { dropdown }) {
    return (
      <div class="card">
        <div class="card-body">
          <div class="d-flex align-items-center">
            <div class={style.subheader}>Temperature</div>
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
            <div class="h1 mb-0 mr-2">22°C</div>
            <div class={style.meAuto}>
              <span class="text-green d-inline-flex align-items-center lh-1">
                8%
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="icon ms-1"
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
              </span>
            </div>
          </div>
        </div>
        <div id="chart-revenue-bg" class="chart-sm" />
      </div>
    );
  }
}

export default Chartbox;
