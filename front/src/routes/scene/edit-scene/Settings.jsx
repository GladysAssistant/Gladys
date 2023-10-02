import cx from 'classnames';
import { Localizer, Text } from 'preact-i18n';
import CreatableSelect from 'react-select/creatable';
import { Component } from 'preact';
import styles from './style.css';

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cardOpened: false
    };
  }

  openCloseCard = () => {
    this.setState({
      cardOpened: !this.state.cardOpened
    });
  };

  render(props, { cardOpened }) {
    return (
      <div class="col">
        <div class="card">
          <div class="card-status bg-green" />
          <div class="card-header" onClick={this.openCloseCard}>
            <i
              class={cx('fe', 'mr-2', {
                'fe-chevron-right': !cardOpened,
                'fe-chevron-down': cardOpened
              })}
            />
            <h4 class="text-center card-title ">
              <Text id="editScene.settings" />
            </h4>
            <div class="card-options" />
          </div>
          <div
            class={cx('card-body', styles.settings, {
              [styles.settingsOpen]: cardOpened
            })}
          >
            <div
              class={cx('dimmer', {
                active: props.saving
              })}
            >
              <div class="loader" />
              <div class="dimmer-content">
                <div class="form-group">
                  <div class="form-label">
                    <Text id="editScene.nameTitle" />
                  </div>
                  <Localizer>
                    <input
                      type="text"
                      className="form-control"
                      onChange={props.updateSceneName}
                      value={props.scene.name}
                      placeholder={<Text id="editScene.editNamePlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <div class="form-label">
                    <Text id="editScene.descriptionTitle" />
                  </div>
                  <Localizer>
                    <input
                      type="text"
                      class="form-control"
                      maxlength="100"
                      onChange={props.updateSceneDescription}
                      value={props.scene.description}
                      placeholder={<Text id="editScene.editDescriptionPlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <div class="form-label">
                    <Text id="editScene.tagsTitle" />
                  </div>
                  <Localizer>
                    <CreatableSelect
                      defaultValue={props.scene.tags.map(tag => ({ value: tag.name, label: tag.name }))}
                      closeMenuOnSelect={false}
                      isMulti
                      options={props.tags && props.tags.map(tag => ({ value: tag.name, label: tag.name }))}
                      onChange={tags => props.setTags(tags.map(tag => tag.value))}
                    />
                  </Localizer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Settings;
