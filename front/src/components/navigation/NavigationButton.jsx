import { Component } from 'preact';
import style from './style.css';

class NavigationButton extends Component {
  state = {
    hideUp: true,
    hideDown: true,
    isScrolling: false
  };

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('scrollend', this.handleScrollEnd);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('scrollend', this.handleScrollEnd);
  }

  handleScroll = () => {
    let state = this.state;

    if (window.scrollY === 0 || window.scrollY <= 400) {
      state.hideUp = true;
    } else {
      state.hideUp = false;
    }
    if (window.scrollY >= document.body.scrollHeight - 1200) {
      state.hideDown = true;
    } else {
      state.hideDown = false;
    }

    state.isScrolling = true;
    this.setState(state);
  };

  handleScrollEnd = () => {
    let state = this.state;
    setTimeout(() => {
      state.isScrolling = false;
      this.setState(state);
    }, 3000);
  };

  scrollTop() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  scrollBot() {
    window.scroll({
      top: document.body.scrollHeight,
      left: 0,
      behavior: 'smooth'
    });
  }

  render() {
    return (
      <div className={style.goTo}>
        <div>
          {this.state.isScrolling ? (
            <button
              id="scrollButton"
              className={`btn btn-primary btn-sm ${style.halfCircleUp}`}
              onClick={this.scrollTop}
              disabled={this.state.hideUp}
            >
              Ʌ
            </button>
          ) : null}
        </div>
        <div>
          {this.state.isScrolling ? (
            <button
              id="scrollButton"
              className={`btn btn-primary btn-sm ${style.halfCircleDown}`}
              onClick={this.scrollBot}
              disabled={this.state.hideDown}
            >
              V
            </button>
          ) : null}
        </div>
      </div>
    );
  }
}

export default NavigationButton;
