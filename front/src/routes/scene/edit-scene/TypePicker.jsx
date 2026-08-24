import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import style from './style.css';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import normalizeSearchText from '../../../utils/normalizeSearchText';
import { COLOR_CLASS } from './typesCatalog';

class TypePicker extends Component {
  updateQuery = e => {
    this.setState({ query: e.target.value });
  };

  selectType = e => {
    const value = e.currentTarget.dataset.value;
    this.props.onSelect(value);
  };

  getVisibleCategories = () => {
    const { categories, filter, labelPrefix, descriptionPrefix, intl } = this.props;
    const { query } = this.state;
    const normalizedQuery = normalizeSearchText(query.trim());

    return categories
      .map(category => {
        const items = category.items
          .filter(type => !filter || filter.includes(type))
          .map(type => {
            const label = get(intl.dictionary, `${labelPrefix}.${type}`, { default: type });
            const description = get(intl.dictionary, `${descriptionPrefix}.${type}`, { default: '' });
            return { type, label, description };
          })
          .filter(
            item =>
              normalizedQuery === '' ||
              normalizeSearchText(item.label).includes(normalizedQuery) ||
              normalizeSearchText(item.description).includes(normalizedQuery)
          );
        return { ...category, items };
      })
      .filter(category => category.items.length > 0);
  };

  constructor(props) {
    super(props);
    this.state = {
      query: ''
    };
  }

  render({ categoryPrefix, icons, searchPlaceholderId }, { query }) {
    const visibleCategories = this.getVisibleCategories();

    return (
      <div>
        <div class="input-icon mb-3">
          <span class="input-icon-addon">
            <i class="fe fe-search" />
          </span>
          <Localizer>
            <input
              type="text"
              class="form-control"
              data-cy="type-picker-search"
              placeholder={<Text id={searchPlaceholderId} />}
              value={query}
              onInput={this.updateQuery}
            />
          </Localizer>
        </div>
        <div class={style.typePickerList}>
          {visibleCategories.map(category => (
            <div class={style.typePickerCategory} key={category.key}>
              <div class={style.typePickerCategoryTitle}>
                <Text id={`${categoryPrefix}.${category.key}`} />
              </div>
              <div class={style.typePickerOptions}>
                {category.items.map(item => (
                  <button
                    type="button"
                    class={style.typePickerOption}
                    data-cy="type-picker-option"
                    data-value={item.type}
                    onClick={this.selectType}
                    key={item.type}
                  >
                    <span class={cx(style.typePickerIcon, style[COLOR_CLASS[category.color]])}>
                      <i class={icons[item.type]} />
                    </span>
                    <span class={style.typePickerOptionText}>
                      <span class={style.typePickerOptionLabel}>{item.label}</span>
                      {item.description && <span class={style.typePickerOptionDescription}>{item.description}</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {visibleCategories.length === 0 && (
            <div class={style.typePickerEmpty}>
              <i class="fe fe-search" /> <Text id="editScene.noResultsFound" />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(TypePicker);
