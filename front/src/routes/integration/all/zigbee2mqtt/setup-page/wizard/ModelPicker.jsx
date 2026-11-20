import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { findAdapter, getNameInBrand, groupByBrand, searchAdapters } from './adapters';
import KeyPhoto from './KeyPhoto';
import style from './wizard.css';

// The models grouped by brand, with a search on their names and aliases ("dongle-e", "sonoff p", "skyconnect")
class ModelPicker extends Component {
  updateSearch = e => this.setState({ search: e.target.value });

  setList = list => {
    this.list = list;
  };

  setSelected = option => {
    this.selected = option;
  };

  // Opened on a model chosen before ("Change the dongle or model"): its scroll area shows it, not the top of the list
  componentDidMount() {
    if (this.list && this.selected && !this.props.inline) {
      const listBox = this.list.getBoundingClientRect();
      const optionBox = this.selected.getBoundingClientRect();
      this.list.scrollTop += optionBox.top - listBox.top - (listBox.height - optionBox.height) / 2;
    }
  }

  // inline: the whole list in the page, without a scroll area of its own (phone)
  render({ adapters, value, onPick, withPhotos, inline }, { search = '' }) {
    const groups = groupByBrand(searchAdapters(adapters, search));
    const selectedAdapter = value ? findAdapter(adapters, value) : null;
    return (
      <div
        ref={this.setList}
        class={cx(style.modelPicker, { [style.modelPickerInline]: inline })}
        data-cy="z2m-wizard-model-picker"
      >
        {selectedAdapter && (
          <div class={style.modelCurrent} data-cy="z2m-wizard-model-current">
            <Text id="integration.zigbee2mqtt.setup.wizard.key.selectedModel" />{' '}
            <strong>{selectedAdapter.displayName}</strong>
          </div>
        )}
        <div class="input-icon mb-2">
          <span class="input-icon-addon">
            <i class="fe fe-search" aria-hidden="true" />
          </span>
          <Localizer>
            <input
              type="search"
              class="form-control"
              value={search}
              onInput={this.updateSearch}
              placeholder={<Text id="integration.zigbee2mqtt.setup.wizard.key.searchPlaceholder" />}
              aria-label={<Text id="integration.zigbee2mqtt.setup.wizard.key.searchLabel" />}
              data-cy="z2m-wizard-model-search"
            />
          </Localizer>
        </div>
        {groups.length === 0 && (
          <p class="text-muted mb-0" data-cy="z2m-wizard-model-none">
            <Text id="integration.zigbee2mqtt.setup.wizard.key.noModel" />
          </p>
        )}
        {groups.map(group => (
          <div key={group.brand} class={style.modelGroup}>
            <div class={style.modelBrand}>
              {group.brand || <Text id="integration.zigbee2mqtt.setup.wizard.key.otherBrands" />}
            </div>
            {group.adapters.map(adapter => (
              <button
                key={adapter.label}
                ref={adapter.label === value ? this.setSelected : undefined}
                type="button"
                class={cx(style.modelOption, { [style.modelOptionSelected]: adapter.label === value })}
                aria-pressed={adapter.label === value ? 'true' : 'false'}
                onClick={() => onPick(adapter.label)}
                data-cy="z2m-wizard-model-option"
              >
                {withPhotos && <KeyPhoto adapter={adapter} size={44} />}
                <span class={style.modelOptionText}>
                  <span class={style.modelOptionName}>{getNameInBrand(adapter)}</span>
                  {adapter.modelCode && <span class={style.modelOptionCode}>{adapter.modelCode}</span>}
                </span>
                {adapter.label === value && <i class="fe fe-check text-primary" aria-hidden="true" />}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  }
}

export default ModelPicker;
