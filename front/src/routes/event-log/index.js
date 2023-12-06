import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';

import EventLogPage from './EventLogPage';


class Dashboard extends Component {
    render(props, {}) {
        return <EventLogPage {...props} />;
    }
    }
    