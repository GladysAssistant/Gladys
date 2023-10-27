import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { Component } from 'preact';
import styles from './style.css';
import cx from 'classnames';

class SceneMenu extends Component {
  constructor(props) {
    super(props);
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

  handleCheckboxChange = async tagName => {
    console.log(tagName);
    await this.setState(prevState => ({
      tagsStatus: {
        ...prevState.tagsStatus,
        [tagName]: !prevState.tagsStatus[tagName]
      }
    }));
    const selectedTags = Object.keys(this.state.tagsStatus).filter(tagName => this.state.tagsStatus[tagName]);
    console.log(selectedTags);
    this.props.searchTags(selectedTags);
  };

  render({ tags }, { tagsStatus }) {
    console.log(tagsStatus);
    return (
      <div class="">
        <Link activeClassName="active" class="d-flex align-items-center">
          <span class="icon mr-2">
            <i class="fe fe-hash" />
          </span>
          <Text class="fe-bold" id="scene.filterTagsName" />
        </Link>
        <div class={styles.menuScroll}>
          {tags &&
            tags.map(tag => (
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id={tag.name}
                  onChange={() => this.handleCheckboxChange(tag.name)}
                  checked={tagsStatus[tag.name]}
                />
                <label class="form-check-label" htmlFor={tag.name}>
                  {tag.name}
                </label>
              </div>
            ))}
        </div>
      </div>
    );
  }
}

export default SceneMenu;
