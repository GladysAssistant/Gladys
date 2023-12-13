import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import { Component } from 'preact';
import LogBox from '../../components/log/LogBox.jsx';

import style from './style.css';

class EventLogPage extends Component {

  
    render(props) {
      const { category, EventLog, totalSize=10, currentUrl, searchKeyword, user, orderDir } = props;
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
                    <div class = "card"> 
                        <div class= "card-header">
                            <h3 class="card-title">
                            <Text id = "EventLog.root.filter.titleType"></Text>
                            </h3>
                        </div>
                        <div class = "card-body">
                            <div>
                            <input type = "checkbox"></input> <Text id = "EventLog.root.filter.eventType.all"></Text>
                            </div>
                            <div>
                            <input type = "checkbox"></input> <Text id = "EventLog.root.filter.eventType.intern"></Text>
                            </div>
                        </div>
                    </div>
                    <div class = "card"> 
                        <div class= "card-header">
                            <h3 class="card-title">
                            <Text id = "EventLog.root.filter.titleDate"></Text>
                            </h3>
                        </div>
                        <div class = "card-body">
                            <div>
                            <input type = "checkbox"></input> <Text id = "EventLog.root.filter.date.today"></Text>
                            </div>
                            <div>
                            <input type = "checkbox"></input> <Text id = "EventLog.root.filter.date.yesterday"></Text>
                            </div>
                            <div>
                            <input type = "checkbox"></input> <Text id = "EventLog.root.filter.date.last7Days"></Text>
                            </div>
                            <div>
                            <input type = "checkbox"></input> <Text id = "EventLog.root.filter.date.last30Days"></Text>
                            </div>
                            <div>
                            <input type = "checkbox"></input> <Text id = "EventLog.root.filter.date.last365Days"></Text>
                            </div>
                        </div>
                    </div>
                    
                  </div>
           
                  <div class="col-lg-9">
                    
                    <div class="row row-cards" >
                     
                      <LogBox />
                      <LogBox />
                      <LogBox />
                      <LogBox />
                    </div>
                  
                  </div>
                </div>
                
                    
                    
                    </div>
                    </div>
                    </div>
                    
                    </div>)}
}


export default EventLogPage;