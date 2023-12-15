import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import { RequestStatus } from '../../utils/consts';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

import LogBox from '../../components/log/LogBox.jsx';

import style from './style.css';

const ITEM_PER_PAGE = 5;

class EventLogPage extends Component {


  constructor(props) {
    super(props);
    this.state = {
      logs: [],
      pageNumber: 1,
    };
  }

  getLogs = async (pageNumber) => {
    this.setState({
      SceneGetLogs: RequestStatus.Getting
    });
    try {
      const dates = {
        from : "2023-12-15", //dayjs.subtract(1, 'day').toDate().toString(),
        to : "2023-12-15"//dayjs().toDate().toString()
      }
      console.log("test: ", dates)
      const logs = await this.props.httpClient.get(`/api/v1/logs?page=${pageNumber}&per_page=${ITEM_PER_PAGE}&date_filter_from=${dates.from}&date_filter_to=${dates.to}}`);
      this.setState({
        logs,
        SceneGetLogs: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        SceneGetLogs: RequestStatus.Error + e
      });
    }
  };

  componentDidMount = () => {
    this.getLogs(1);
  };

  setPageNumber = (pageNumber) => {
    this.setState({
      pageNumber: pageNumber
    })
    this.getLogs(pageNumber);
  }

  getPageToShow = () => {
    const { pageNumber, logs } = this.state;
    console.log(logs.total);
    const totalPages = Math.ceil(logs.total / ITEM_PER_PAGE);
    const startPage = Math.max(1, pageNumber - 2);
    const endPage = Math.min(totalPages, pageNumber + 2);
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  render(props) {
    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="container">
              <div class="page-header">
                <h1 class="page-title">
                  <Text id="EventLog.root.title" />
                </h1>
                <div class="page-subtitle">
                  <Text id="EventLog.root.subtitle" fields={{ begin: this.state.logs.start, end : this.state.logs.end, total: this.state.logs.total }} />
                </div>
              </div>
              <div class="row">
                <div class="col-lg-3">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">
                        <Text id="EventLog.root.filter.titleType"></Text>
                      </h3>
                    </div>
                    <div class="card-body">
                    <div>
                        <input type="radio" name = "typeFilter" checked = "checked"></input> <Text id="EventLog.root.filter.eventType.all"></Text>
                      </div>
                      <div>
                        <input type="radio" name = "typeFilter"></input> <Text id="EventLog.root.filter.eventType.device"></Text>
                      </div>
                      <div>
                        <input type="radio" name = "typeFilter"></input> <Text id="EventLog.root.filter.eventType.intern"></Text>
                      </div>
                    </div>
                  </div>
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">
                        <Text id="EventLog.root.filter.titleDate"></Text>
                      </h3>
                    </div>
                    <div class="card-body">
                      <div>
                        <input type="radio" name = "timeFilter" checked = "checked"></input> <Text id="EventLog.root.filter.date.today"></Text>
                      </div>
                      <div>
                        <input type="radio" name = "timeFilter"></input> <Text id="EventLog.root.filter.date.yesterday"></Text>
                      </div>
                      <div>
                        <input type="radio" name = "timeFilter"></input> <Text id="EventLog.root.filter.date.last7Days"></Text>
                      </div>
                      <div>
                        <input type="radio" name = "timeFilter"></input> <Text id="EventLog.root.filter.date.last30Days"></Text>
                      </div>
                      <div>
                        <input type="radio" name = "timeFilter"></input> <Text id="EventLog.root.filter.date.last365Days"></Text>
                      </div>
                    </div>
                  </div>

                </div>

                <div class="col-lg-9">

                  <div class="row row-cards" >
                    {this.state.logs.data ? this.state.logs.data.map((event) => (
                      <LogBox date={event.created_at} service={event.service} type={event.type} sender_name={event.sender_name} eventProperty={event.event_property}/>
                    )) : null}
                  </div>
                  <nav aria-label="Page navigation">
                    <ul class="pagination">
                    <li class={`page-item ${this.state.pageNumber == 1? 'disabled' : ''}`}><button class="page-link" onClick = {() =>this.setPageNumber(1)}>«</button></li>
                    {this.getPageToShow().map((pageNumber) => (
                      <li class={`page-item ${pageNumber == this.state.pageNumber? 'active' : ''}`}><button class="page-link" onClick = {() =>this.setPageNumber(pageNumber)} disabled = {pageNumber == this.state.pageNumber}>{pageNumber}</button></li>))
                    }
                    <li class={`page-item ${this.state.pageNumber == (Math.ceil(this.state.logs.total / ITEM_PER_PAGE))? 'disabled' : ''}`}><button class="page-link" onClick = {() =>this.setPageNumber(Math.ceil(this.state.logs.total / ITEM_PER_PAGE))}>»</button></li>  
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>)
  }
}


export default connect('httpClient,user', {})(EventLogPage);
