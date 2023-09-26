import cx from 'classnames';
import { Localizer, Text } from 'preact-i18n';
import { useState } from 'preact/compat';
import { TagsInput } from 'react-tag-input-component';

const Settings = ({ ...props }) => {
  const [cardOpened, setCardOpened] = useState(false);

  const openCloseCard = () => {
    setCardOpened(!cardOpened);
  };

  return (
    <div class="col">
      <div class="card">
        <div class="card-status bg-green" />
        <div class="card-header" onClick={openCloseCard}>
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
          class="card-body"
          style={{
            display: cardOpened ? '' : 'none'
          }}
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
                  <TagsInput
                    classNames={{ input: 'w-100' }}
                    value={props.scene.tags}
                    onChange={props.setTags}
                    name="tags"
                    placeHolder={<Text id="editScene.editTagsPlaceholder" />}
                  />
                </Localizer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
