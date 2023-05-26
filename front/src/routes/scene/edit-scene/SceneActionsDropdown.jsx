import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';

class SceneActionsDropdown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false
    };
  }

  toggleShow = e => {
    e.preventDefault();
    console.log({ show: this.state.show });
    this.setState({ show: !this.state.show });
  };

  closeDropdown = () => {
    this.setState({ show: false });
  };

  componentDidMount() {
    document.addEventListener('click', this.closeDropdown, true);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.closeDropdown, true);
  }

  render(props, { show }) {
    return (
      <div class="dropdown ">
        <button onClick={this.toggleShow} class="btn btn-secondary ml-2 dropdown-toggle">
          <span class="d-none d-sm-inline-block">
            <Text id="editScene.moreButton" />
          </span>
        </button>
        <div
          class={cx('dropdown-menu ', style.plusButton, {
            show
          })}
        >
          <a class="dropdown-item" href="#" onClick={props.duplicateScene}>
            <Text id="editScene.editTitleButton" /> <i className="fe fe-edit-3" />
          </a>
          <a class="dropdown-item" href="#" onClick={props.duplicateScene}>
            <Text id="editScene.duplicateButton" /> <i className="fe fe-copy" />
          </a>

          <a class="dropdown-item" href="#" onClick={props.deleteScene}>
            <Text id="editScene.deleteButton" /> <i class="fe fe-trash" />
          </a>
        </div>
      </div>
    );
  }
}

export default SceneActionsDropdown;
