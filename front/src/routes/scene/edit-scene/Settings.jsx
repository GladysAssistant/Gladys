import cx from 'classnames';
import { Localizer, Text } from 'preact-i18n';
import CreatableSelect from 'react-select/creatable';
import IconSelector from '../../../components/scene/IconSelector';

const Settings = ({ children, ...props }) => {
  return (
    <div class="col">
      <div class="card">
        <div class="card-status bg-green" />
        <div class="card-header">
          <i class="fe fe-settings mr-2" />
          <h4 class="text-center card-title ">
            <Text id="editScene.settings" />
          </h4>
          <div class="card-options">
            <a onClick={props.closeSettings} class="card-options-remove cursor-pointer">
              <i class="fe fe-x" />
            </a>
          </div>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: props.saving
            })}
          >
            <div class="loader" />
            <div class="dimmer-content row">
              <div class="col-sm-12 col-md-6">
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
                      placeholder={<Text id="editScene.editTagsPlaceholder" />}
                      formatCreateLabel={inputValue => (
                        <Text id="editScene.createTag" fields={{ tagName: inputValue }} />
                      )}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </Localizer>
                </div>
              </div>
              <div class="col">
                <div class="form-group">
                  <label className="form-label">
                    <Text id="editScene.iconLabel" />
                  </label>
                  <IconSelector value={props.scene.icon} onChange={props.updateSceneIcon} darkModeNoFilter />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
