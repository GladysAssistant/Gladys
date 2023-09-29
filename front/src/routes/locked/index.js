import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';

const BUTTON_ARRAY = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];

const KeyPadComponent = ({ currentCode, typeLetter, clearPreviousLetter }) => (
  <div>
    <div class="input-group mb-3">
      <Localizer>
        <input
          type="password"
          class="form-control"
          value={currentCode}
          placeholder={<Text id="locked.codePlaceholder" />}
        />
      </Localizer>
      <div class="input-group-append">
        <button class="btn btn-outline-secondary" onClick={clearPreviousLetter}>
          <i class="fe fe-delete" />
        </button>
      </div>
    </div>
    {BUTTON_ARRAY.map(row => (
      <div class="row">
        {row.map(cell => (
          <div class="col mt-4">
            <button onClick={e => typeLetter(e, cell)} class={cx('btn btn-secondary btn-block')}>
              {cell}
            </button>
          </div>
        ))}
      </div>
    ))}
  </div>
);

class Locked extends Component {
  clearPreviousLetter = e => {
    e.preventDefault();
    if (this.state.currentCode.length > 0) {
      this.setState(prevState => {
        return { ...prevState, currentCode: prevState.currentCode.slice(0, -1) };
      });
    }
  };
  typeLetter = (e, letter) => {
    e.preventDefault();
    this.setState(prevState => {
      return { ...prevState, currentCode: prevState.currentCode + letter };
    });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      currentCode: ''
    };
  }
  componentDidMount() {}
  render({}, { currentCode }) {
    return (
      <div class={cx('container', style.lockedContainer)}>
        <div class="row">
          <div class="col col-login mx-auto">
            <div class="text-center mb-6">
              <h2>
                <Localizer>
                  <img
                    src="/assets/icons/favicon-96x96.png"
                    class="header-brand-img"
                    alt={<Text id="global.logoAlt" />}
                  />
                </Localizer>
                <Text id="login.title" />
              </h2>
            </div>

            <form class="card">
              <div class="card-body p-6">
                <div class={cx('card-title mb-2', style.cardTitle)}>
                  <Text id="locked.cardTitle" />
                </div>
                <p>
                  <Text id="locked.description" />
                </p>
                <div>
                  <KeyPadComponent
                    currentCode={currentCode}
                    typeLetter={this.typeLetter}
                    clearPreviousLetter={this.clearPreviousLetter}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('', {})(Locked);
