import { Component } from 'preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import { MAX_LENGTH_TAG } from './constant';

class SceneTagFilter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tagFilterDropdownOpened: false
    };
  }

  setDropdownRef = dropdownRef => {
    this.dropdownRef = dropdownRef;
  };

  componentWillReceiveProps(nextProps) {
    let tagsStatus = {};
    if (nextProps.tags) {
      tagsStatus = nextProps.tags.reduce(
        (tags, tag) => ({
          ...tags,
          [tag.name]: false
        }),
        {}
      );
    }
    if (nextProps.sceneTagSearch) {
      nextProps.sceneTagSearch.forEach(tagName => {
        tagsStatus[tagName] = true;
      });
    }
    this.setState({
      tagsStatus
    });
  }

  toggleTagFilterDropdown = () => {
    this.setState({
      tagFilterDropdownOpened: !this.state.tagFilterDropdownOpened
    });
  };

  closeTagFilterDropdown = e => {
    if (this.dropdownRef && this.dropdownRef.contains(e.target)) {
      return;
    }
    this.setState({ tagFilterDropdownOpened: false });
  };

  selectedTags = async tagName => {
    await this.setState({
      tagsStatus: {
        ...this.state.tagsStatus,
        [tagName]: !this.state.tagsStatus[tagName]
      }
    });
    const selectedTags = Object.keys(this.state.tagsStatus).filter(tagName => this.state.tagsStatus[tagName]);
    this.props.searchTags(selectedTags);
  };

  componentDidMount() {
    document.addEventListener('click', this.closeTagFilterDropdown, true);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.closeTagFilterDropdown, true);
  }

  render(props, { tagFilterDropdownOpened, tagsStatus }) {
    return (
      <div
        ref={this.setDropdownRef}
        class={cx('btn-group', {
          show: tagFilterDropdownOpened
        })}
      >
        <button className="btn btn-secondary btn-sm dropdown-toggle ml-2" onClick={this.toggleTagFilterDropdown}>
          <Text id="scene.filterTagsName" />
        </button>
        <div
          class={cx('dropdown-menu', {
            show: tagFilterDropdownOpened
          })}
        >
          {props.tags &&
            props.tags.map(tag => (
              <div>
                <li className="dropdown-item" onClick={() => this.selectedTags(tag.name)}>
                  <div class="custom-checkbox custom-control">
                    <input
                      id={`tags-filter-${tag.name}`}
                      type="checkbox"
                      className="custom-control-input"
                      onChange={() => this.selectedTags(tag.name)}
                      checked={tagsStatus[tag.name]}
                    />
                    <label className="custom-control-label" htmlFor={`tags-filter-${tag.name}`}>
                      {tag.name.length > MAX_LENGTH_TAG ? `${tag.name.substring(0, MAX_LENGTH_TAG - 3)}...` : tag.name}
                    </label>
                  </div>
                </li>
              </div>
            ))}
        </div>
      </div>
    );
  }
}

export default SceneTagFilter;
