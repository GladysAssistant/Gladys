import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import { RequestStatus } from '../../utils/consts';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

import LogBox from '../../components/log/LogBox.jsx';

import style from './style.css';

class EventLogPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      logs: []
    };
  }

  getLogs = async () => {
    this.setState({
      SceneGetLogs: RequestStatus.Getting
    });
    try {
      const logs = await this.props.httpClient.get('/api/v1/logs');
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
    this.getLogs();
  };

  render(props) {
    const { totalSize = 10} = props;
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
                  <Text id="EventLog.root.subtitle" fields={{ length: 5, total: totalSize }} />
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
                        <input type="checkbox"></input> <Text id="EventLog.root.filter.eventType.all"></Text>
                      </div>
                      <div>
                        <input type="checkbox"></input> <Text id="EventLog.root.filter.eventType.intern"></Text>
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
                        <input type="checkbox"></input> <Text id="EventLog.root.filter.date.today"></Text>
                      </div>
                      <div>
                        <input type="checkbox"></input> <Text id="EventLog.root.filter.date.yesterday"></Text>
                      </div>
                      <div>
                        <input type="checkbox"></input> <Text id="EventLog.root.filter.date.last7Days"></Text>
                      </div>
                      <div>
                        <input type="checkbox"></input> <Text id="EventLog.root.filter.date.last30Days"></Text>
                      </div>
                      <div>
                        <input type="checkbox"></input> <Text id="EventLog.root.filter.date.last365Days"></Text>
                      </div>
                    </div>
                  </div>

                </div>

                <div class="col-lg-9">

                  <div class="row row-cards" >
                    {this.state.logs.map((event) => (
                      <LogBox date={event.created_at} service={event.service} type={event.type} sender_name={event.sender_name} eventProperty={event.event_property}/>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>)
  }
}


export default connect('httpClient,user', {})(EventLogPage);
