import { Component } from 'preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import { MAX_LENGTH_TAG } from './constant';
import styles from './style.css';

class SceneTagFilter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tagFilterDropdownOpened: false
    };
    this.unselectTags = this.unselectTags.bind(this);
  }

  setDropdownRef = dropdownRef => {
    this.dropdownRef = dropdownRef;
  };

  toggleTagFilterDropdown = () => {
    this.setState({
      tagFilterDropdownOpened: !this.state.tagFilterDropdownOpened
    });
  };

  closeTagFilterDropdown = e => {
    if (e && this.dropdownRef && this.dropdownRef.contains(e.target)) {
      return;
    }
    this.setState({ tagFilterDropdownOpened: false });
  };

  toggleTag = async e => {
    e.preventDefault();
    const { sceneTagSearch } = this.props;
    const tagName = e.currentTarget.getAttribute('data-tag');

    // Check if the tag is already in the array
    const newTagArray = sceneTagSearch.includes(tagName)
      ? sceneTagSearch.filter(tag => tag !== tagName) // Remove tag if it exists
      : [...sceneTagSearch, tagName]; // Add tag if it doesn't exist

    this.props.searchTags(newTagArray);
  };

  unselectTags = async () => {
    this.props.searchTags([]);
  };

  componentDidMount() {
    document.addEventListener('click', this.closeTagFilterDropdown, true);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.closeTagFilterDropdown, true);
  }

  render(props, { tagFilterDropdownOpened }) {
    return (
      <div
        ref={this.setDropdownRef}
        class={cx('mr-2', 'btn-group', {
          show: tagFilterDropdownOpened
        })}
      >
        <button className="btn btn-secondary btn-sm dropdown-toggle" onClick={this.toggleTagFilterDropdown}>
          <Text id="scene.filterTagsName" />
        </button>
        <div
          class={cx('dropdown-menu', {
            show: tagFilterDropdownOpened
          })}
        >
          <div>
            <li class="dropdown-item" onClick={this.unselectTags}>
              <i class={cx('fe', 'fe-x-square', styles.iconUnselectAll)} />
              <span class="custom-control">
                <Text id="scene.unselectTags" />
              </span>
            </li>
          </div>
          {props.tags &&
            props.tags.map(tag => (
              <div>
                <li class="dropdown-item" onClick={this.toggleTag} data-tag={tag.name}>
                  <div class="custom-checkbox custom-control">
                    <input
                      id={`tags-filter-${tag.name}`}
                      type="checkbox"
                      class="custom-control-input"
                      checked={props.sceneTagSearch.includes(tag.name)}
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
