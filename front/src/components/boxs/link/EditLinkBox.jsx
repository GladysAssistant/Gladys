import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';

const DEFAULT_ICON = 'link';

const LINK_ICONS = ['link', 'globe', 'server', 'hard-drive', 'wifi', 'monitor', 'cpu', 'home'];

class EditLinkBox extends Component {
  updateTitle = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { title: e.target.value });
  };

  updateUrl = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { url: e.target.value });
  };

  updateIcon = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { icon: e.target.value });
  };

  render(props) {
    const icon = props.box.icon || DEFAULT_ICON;

    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.link">
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.link.editTitleLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="dashboard.boxes.link.editTitlePlaceholder" />}
              value={props.box.title || ''}
              onInput={this.updateTitle}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.link.editUrlLabel" />
          </label>
          <Localizer>
            <input
              type="url"
              class="form-control"
              placeholder={<Text id="dashboard.boxes.link.editUrlPlaceholder" />}
              value={props.box.url || ''}
              onInput={this.updateUrl}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.link.editIconLabel" />
          </label>
          <select value={icon} onChange={this.updateIcon} class="form-control">
            {LINK_ICONS.map(linkIcon => (
              <option value={linkIcon}>
                <Text id={`dashboard.boxes.link.icons.${linkIcon}`} />
              </option>
            ))}
          </select>
        </div>
      </BaseEditBox>
    );
  }
}

export default EditLinkBox;
