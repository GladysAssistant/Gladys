import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import { Component } from 'preact';

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
                    </div>
                    </div>
                    </div>
                    </div>)}
}


export default EventLogPage;