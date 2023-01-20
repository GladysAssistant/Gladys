import { Component } from 'preact';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

class RelativeTime extends Component {
  refreshTimeDisplay = () => {
    const { datetime, language, futureDisabled } = this.props;
    if (datetime && language) {
      let relativeTime = dayjs(datetime, 'YYYY-MM-DD HH:mm:ss.SSS Z');
      const now = dayjs();

      if (futureDisabled && relativeTime.isAfter(now)) {
        relativeTime = now;
      }

      this.setState({
        relativeTime: relativeTime.locale(language).fromNow()
      });
    }
  };

  constructor(props) {
    super(props);
    this.props;
    this.state = {
      relativeTime: ''
    };
  }

  componentDidMount() {
    this.refreshTimeDisplay();
    this.interval = setInterval(() => {
      this.refreshTimeDisplay();
    }, 60 * 1000);
  }

  componentDidUpdate(previousProps) {
    const dateTimeChanged = previousProps.datetime !== this.props.datetime;
    const languageChanged = previousProps.language !== this.props.language;
    if (dateTimeChanged || languageChanged) {
      this.refreshTimeDisplay();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render(props, { relativeTime }) {
    return relativeTime;
  }
}

export default RelativeTime;
