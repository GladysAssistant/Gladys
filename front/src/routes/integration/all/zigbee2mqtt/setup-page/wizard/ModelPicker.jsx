import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { getNameInBrand, groupByBrand, searchAdapters } from './adapters';
import KeyPhoto from './KeyPhoto';
import style from './wizard.css';

// The models grouped by brand, with a search on their names and aliases ("dongle-e", "sonoff p", "skyconnect")
class ModelPicker extends Component {
  updateSearch = e => this.setState({ search: e.target.value });

  render({ adapters, value, onPick, withPhotos }, { search = '' }) {
    const groups = groupByBrand(searchAdapters(adapters, search));
    return (
      <div class={style.modelPicker} data-cy="z2m-wizard-model-picker">
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
