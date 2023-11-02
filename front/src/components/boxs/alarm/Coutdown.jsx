import { h, Component } from 'preact';
import style from './countdown.css';

class Countdown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seconds: props.seconds
    };
  }

  updateCountdown() {
    if (this.state.seconds > 0) {
      this.setState(prevState => ({ seconds: prevState.seconds - 1, updated: true }));

      // Clear the "updated" class after the animation duration (0.5 seconds)
      setTimeout(() => {
        this.setState({ updated: false });
      }, 500);
    }
  }

  componentDidMount() {
    this.countdownInterval = setInterval(this.updateCountdown.bind(this), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.countdownInterval);
  }

  render() {
    return (
      <div>
        <div class={style.countdown}>
          <span class={`${style.countdownTimer} ${this.state.updated ? style.updated : ''}`}>{this.state.seconds}</span>
        </div>
      </div>
    );
  }
}

export default Countdown;
