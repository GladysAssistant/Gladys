import { Component } from 'preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import { MAX_LENGTH_TAG } from './constant';
import styles from './style.css';
import debounce from 'debounce';

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
    debounce(this.props.searchTags, 200)(selectedTags);
  };

  unselectTags = async () => {
    const tagsStatus = this.props.tags.reduce(
      (tags, tag) => ({
        ...tags,
        [tag.name]: false
      }),
      {}
    );
    await this.setState({
      tagsStatus
    });
    this.props.searchTags([]);
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
        class={cx('mr-2', 'btn-group', {
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
          <div>
            <li
              class="dropdown-item"
              onClick={() => {
                this.unselectTags();
              }}
            >
              <i class={cx('fe', 'fe-x-square', styles.iconUnselectAll)} />
              <span class="custom-control">
                <Text id="scene.unselectTags" />
              </span>
            </li>
          </div>
          {props.tags &&
            props.tags.map(tag => (
              <div>
                <li class="dropdown-item" onClick={() => this.selectedTags(tag.name)}>
                  <div class="custom-checkbox custom-control">
                    <input
                      id={`tags-filter-${tag.name}`}
                      type="checkbox"
                      class="custom-control-input"
                      onChange={() => this.selectedTags(tag.name)}
                      checked={tagsStatus[tag.name]}
                    />
                    <label class="custom-control-label" htmlFor={`tags-filter-${tag.name}`}>
                      {tag.name.length > MAX_LENGTH_TAG ? `${tag.name.substring(0, MAX_LENGTH_TAG - 3)}...` : tag.name}
                    </label>
                    <span class={cx('badge', 'badge-secondary', styles.tagsSceneCount)}>{tag.scene_count}</span>
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
