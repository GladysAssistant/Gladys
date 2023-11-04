import { Component } from 'preact';
import cx from 'classnames';

class SceneTagFilter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tagFilterDropdownOpened: false
    };
  }

  componentWillReceiveProps(nextProps) {
    console.log(nextProps);
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
    console.log(nextProps.sceneTagSearch);
    if (nextProps.sceneTagSearch) {
      nextProps.sceneTagSearch.forEach(tagName => {
        tagsStatus[tagName] = true;
      });
    }
    this.setState({
      tagsStatus
    });
    console.log('tags state', this.state.tagsStatus);
  }

  toggleTagFilterDropdown = () => {
    this.setState({
      tagFilterDropdownOpened: !this.state.tagFilterDropdownOpened
    });
  };

  selectedTags = async (tagName, checked) => {
    await this.setState({
      tagsStatus: {
        ...this.state.tagsStatus,
        [tagName]: checked
      }
    });
    const selectedTags = Object.keys(this.state.tagsStatus).filter(tagName => this.state.tagsStatus[tagName]);
    console.log(selectedTags);
    this.props.searchTags(selectedTags);
  };

  render(props, { tagFilterDropdownOpened, tagsStatus }) {
    return (
      <div
        class={cx('btn-group', {
          show: tagFilterDropdownOpened
        })}
      >
        <button className="btn btn-secondary btn-sm dropdown-toggle ml-2" onClick={this.toggleTagFilterDropdown}>
          Filtrer par tags
        </button>
        <div
          class={cx('dropdown-menu', {
            show: tagFilterDropdownOpened
          })}
        >
          {props.tags &&
            props.tags.map(tag => (
              <div>
                <li className="dropdown-item">
                  <div class="custom-checkbox custom-control">
                    <input
                      id={`tags-filter-${tag.name}`}
                      type="checkbox"
                      className="custom-control-input"
                      onChange={e => this.selectedTags(tag.name, e.target.checked)}
                      checked={tagsStatus[tag.name]}
                    />
                    <label className="custom-control-label" htmlFor={`tags-filter-${tag.name}`}>
                      {tag.name}
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
