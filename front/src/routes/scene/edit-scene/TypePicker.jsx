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
    const {
      categories,
      filter,
      labelPrefix,
      descriptionPrefix,
      fallbackDescriptionPrefix,
      deprecated,
      intl
    } = this.props;
    const { query } = this.state;
    const normalizedQuery = normalizeSearchText(query.trim());

    return categories
      .map(category => {
        const items = category.items
          // a core type is a string translated from the dictionary; an entry
          // declared by an external integration is an object carrying its own
          // (manifest) label, subtitle, description and icon
          .filter(item => typeof item !== 'string' || !filter || filter.includes(item))
          .map(item => {
            if (typeof item !== 'string') {
              return { ...item, type: item.value, deprecated: false };
            }
            const label = get(intl.dictionary, `${labelPrefix}.${item}`, { default: item });
            // a picker may have its own descriptions (the conditions of an if/while block),
            // the generic ones being the fallback of a type it has no specific text for
            const fallbackDescription = fallbackDescriptionPrefix
              ? get(intl.dictionary, `${fallbackDescriptionPrefix}.${item}`, { default: '' })
              : '';
            const description = get(intl.dictionary, `${descriptionPrefix}.${item}`, { default: fallbackDescription });
            return {
              type: item,
              value: item,
              label,
              description,
              deprecated: Boolean(deprecated && deprecated.includes(item))
            };
          })
          .filter(
            item =>
              normalizedQuery === '' ||
              normalizeSearchText(item.label).includes(normalizedQuery) ||
              normalizeSearchText(item.subtitle || '').includes(normalizedQuery) ||
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

  setSearchRef = element => {
    this.searchInput = element;
  };

  focusSearchIfAsked = () => {
    // in a sheet the picker is the whole screen: the search field takes the focus at once
    if (this.props.autoFocusSearch && this.searchInput && !this.focused) {
      this.focused = true;
      try {
        this.searchInput.focus({ preventScroll: true });
      } catch (e) {
        this.searchInput.focus();
      }
    }
  };

  componentDidMount() {
    this.focusSearchIfAsked();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.autoFocusSearch !== this.props.autoFocusSearch) {
      this.focused = false;
      this.focusSearchIfAsked();
    }
  }

  render({ categoryPrefix, icons, searchPlaceholderId, fill }, { query }) {
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
              ref={this.setSearchRef}
              class="form-control"
              data-cy="type-picker-search"
              placeholder={<Text id={searchPlaceholderId} />}
              value={query}
              onInput={this.updateQuery}
            />
          </Localizer>
        </div>
        <div class={cx(style.typePickerList, { [style.typePickerListFill]: fill })}>
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
                    data-value={item.value}
                    onClick={this.selectType}
                    key={item.value}
                  >
                    <span class={cx(style.typePickerIcon, style[COLOR_CLASS[category.color]])}>
                      <i class={item.icon || icons[item.type]} />
                    </span>
                    <span class={style.typePickerOptionText}>
                      <span class={style.typePickerOptionLabel}>
                        {item.label}
                        {item.deprecated && (
                          <span class={cx('badge', 'badge-danger', style.typePickerOptionBadge)}>
                            <Text id="editScene.deprecatedActionBadge" />
                          </span>
                        )}
                      </span>
                      {item.subtitle && <span class={style.typePickerOptionSubtitle}>{item.subtitle}</span>}
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
