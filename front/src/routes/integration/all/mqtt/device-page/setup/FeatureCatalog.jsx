import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../../../utils/consts';
import FeaturePreview from './FeaturePreview';
import { filterFeatureCatalogOptions } from '../utils';
import style from '../style.css';

class FeatureCatalog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      expandedCategories: {}
    };
  }

  toggleCategory = categoryLabel => {
    this.setState(prevState => ({
      expandedCategories: {
        ...prevState.expandedCategories,
        [categoryLabel]: !prevState.expandedCategories[categoryLabel]
      }
    }));
  };

  getDescription = (category, type) => {
    const specific = get(
      this.props.intl.dictionary,
      `integration.mqtt.featureCatalog.descriptions.${category}.${type}`
    );
    if (specific) {
      return specific;
    }
    const categoryDescription = get(
      this.props.intl.dictionary,
      `integration.mqtt.featureCatalog.categoryDescriptions.${category}`
    );
    if (categoryDescription) {
      return categoryDescription;
    }
    return get(this.props.intl.dictionary, 'integration.mqtt.featureCatalog.fallbackDescription');
  };

  render({ deviceFeaturesOptions, intl, user, onSelectFeature }, { search, expandedCategories }) {
    const filteredOptions = filterFeatureCatalogOptions(deviceFeaturesOptions, search, intl.dictionary);

    return (
      <div class={style.featureCatalog}>
        <div class={style.featureCatalogHeader}>
          <h4 class="mb-0">
            <Text id="integration.mqtt.featureCatalog.title" />
          </h4>
          <p class="text-muted mb-0">
            <Text id="integration.mqtt.featureCatalog.subtitle" />
          </p>
        </div>

        <div class="input-icon mb-3">
          <span class="input-icon-addon">
            <i class="fe fe-search" />
          </span>
          <Localizer>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="integration.mqtt.featureCatalog.searchPlaceholder" />}
              value={search}
              onInput={e => this.setState({ search: e.target.value })}
            />
          </Localizer>
        </div>

        <div class={style.featureCatalogContent}>
          {filteredOptions.length === 0 && (
            <p class="text-muted text-center py-4">
              <Text id="integration.mqtt.featureCatalog.noResults" />
            </p>
          )}

          {filteredOptions.map(group => {
            const isExpanded = expandedCategories[group.label] !== false;

            return (
              <div class={style.featureCatalogCategory} key={group.label}>
                <button
                  type="button"
                  class={style.featureCatalogCategoryHeader}
                  onClick={() => this.toggleCategory(group.label)}
                >
                  <i class={cx('fe', isExpanded ? 'fe-chevron-down' : 'fe-chevron-right')} />
                  <span>{group.label}</span>
                  <span class="badge badge-secondary ml-auto">{group.options.length}</span>
                </button>

                {isExpanded && (
                  <div class={style.featureCatalogGrid}>
                    {group.options.map(option => {
                      const [category, type] = option.value.split('|');
                      const icon = get(DeviceFeatureCategoriesIcon, `${category}.${type}`, 'radio');

                      return (
                        <button
                          type="button"
                          key={option.value}
                          class={style.featureCatalogCard}
                          onClick={() => onSelectFeature(option)}
                        >
                          <div class={style.featureCatalogCardHeader}>
                            <i class={`fe fe-${icon}`} />
                            <span class={style.featureCatalogCardTitle}>{option.label}</span>
                          </div>
                          <p class={style.featureCatalogCardDescription}>{this.getDescription(category, type)}</p>
                          <div class={style.featureCatalogCardPreview}>
                            <span class={style.featureCatalogPreviewLabel}>
                              <Text id="integration.mqtt.featureCatalog.previewLabel" />
                            </span>
                            <FeaturePreview
                              category={category}
                              type={type}
                              label={option.label}
                              intl={intl}
                              user={user}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default FeatureCatalog;
