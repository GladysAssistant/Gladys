import { Component, Fragment } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import Downshift from 'downshift/preact';
import cx from 'classnames';
import get from 'get-value';

class Select extends Component {
  findSelected = () => {
    const { multiple, value, options, uniqueKey, useGroups } = this.props;
    let selectedItem;
    if (!multiple) {
      if (uniqueKey && options && typeof value !== 'object') {
        let items = options;
        if (useGroups) {
          items = options.flatMap(o => this.getGroupItems(o));
        }
        selectedItem = items.find(o => get(o, uniqueKey) === value);
      } else {
        selectedItem = value;
      }

      selectedItem = selectedItem || '';
    }

    return selectedItem;
  };

  areItemsEqual(first, second) {
    const { uniqueKey } = this.props;
    if (uniqueKey) {
      return get(first, uniqueKey) === get(second, uniqueKey);
    }

    return first === second;
  }

  stateReducer = (state, changes) => {
    const { multiple } = this.props;

    let newStateToSet = { ...changes };
    switch (changes.type) {
      case Downshift.stateChangeTypes.mouseUp:
      case Downshift.stateChangeTypes.keyDownEscape:
        newStateToSet.selectedItem = state.selectedItem;
        newStateToSet.inputValue = state.inputValue;
        break;
      case Downshift.stateChangeTypes.keyDownEnter:
      case Downshift.stateChangeTypes.clickItem:
        if (multiple) {
          newStateToSet.isOpen = state.isOpen;
          newStateToSet.inputValue = '';
        }
    }

    return newStateToSet;
  };

  onChange = (item, e) => {
    const { multiple, onChange, required } = this.props;
    let selectedItems = [];
    let changed = true;

    if (multiple) {
      selectedItems = this.state.selectedItems;
    }

    if (item) {
      const itemIndex = selectedItems.findIndex(selected => this.areItemsEqual(selected, item));
      if (itemIndex >= 0) {
        if (!required || selectedItems.size() > 1) {
          selectedItems.splice(itemIndex, 1);
        } else {
          changed = false;
        }
      } else {
        selectedItems.push(item);
      }
    }

    if (changed) {
      const callback = () => {
        if (onChange) {
          if (multiple) {
            onChange(selectedItems, e);
          } else {
            onChange(item, e);
          }
        }
      };

      this.setState({ selectedItems }, callback);
    }
  };

  getGroupItems = group => {
    return get(group, this.props.groupItemsKey || 'options');
  };

  filterItem = (downshiftProps, option) => {
    const { inputValue } = downshiftProps;
    const { searchable } = this.props;

    if (searchable && inputValue && typeof inputValue === 'string') {
      let optionLabel = downshiftProps.itemToString(option);
      return optionLabel.toLowerCase().includes(inputValue.toLowerCase());
    }

    return true;
  };

  mapFilteredGroup = (downshiftProps, group) => {
    let options = this.getGroupItems(group);
    if (downshiftProps.inputValue) {
      options = options.filter(option => this.filterItem(downshiftProps, option));
      return { ...group, options };
    }

    return group;
  };

  itemToString = item => {
    const optionLabel = item ? get(item, this.props.itemLabelKey || 'label') : '';

    if (typeof optionLabel === 'object' && optionLabel.type === Text) {
      return get(this.context.intl.dictionary, optionLabel.props.id);
    }

    return `${optionLabel}`;
  };

  itemGroupToString = (downshiftProps, group) => {
    return (this.props.itemGroupToString || downshiftProps.itemToString)(group);
  };

  transformPropsValue(props) {
    let selectedItems = [];
    if (props.value) {
      if (Array.isArray(props.value)) {
        selectedItems = props.value;
      } else {
        selectedItems.push(props.value);
      }
    }
    return selectedItems;
  }

  constructor(props) {
    super(props);

    const selectedItems = this.transformPropsValue(props);
    this.state = {
      selectedItems
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      const selectedItems = this.transformPropsValue(nextProps);

      this.setState({
        selectedItems
      });
    }
  }

  renderItem(downshiftProps, option) {
    const keepItem = this.filterItem(downshiftProps, option);
    if (!keepItem) {
      return null;
    }

    const { multiple } = this.props;
    const selected = this.state.selectedItems.findIndex(selected => this.areItemsEqual(selected, option)) >= 0;
    return (
      <div
        class={cx('dropdown-item', 'cursor-pointer', 'custom-checkbox', 'btn-transparent', {
          'bg-info text-white': selected && !multiple
        })}
        {...downshiftProps.getItemProps({
          item: option,
          isSelected: selected
        })}
      >
        {multiple && (
          <div class="position-relative">
            <input type="checkbox" class="custom-control-input" checked={selected} />
            <span class="custom-control-label position-relative pl-5">{downshiftProps.itemToString(option)}</span>
          </div>
        )}
        {!multiple && downshiftProps.itemToString(option)}
      </div>
    );
  }

  renderEmptyList(downshiftProps) {
    const emptyLabel = this.props.emptyLabel || <Text id="global.selectNoOptionLabel" />;

    return (
      <div
        {...downshiftProps.getMenuProps()}
        class={cx('dropdown-menu', 'w-100', {
          show: downshiftProps.isOpen
        })}
      >
        <div class="dropdown-item text-center disabled">{emptyLabel}</div>
      </div>
    );
  }

  renderItemList(downshiftProps) {
    const options = (this.props.options || []).filter(option => this.filterItem(downshiftProps, option));

    if (options.length === 0) {
      return this.renderEmptyList(downshiftProps);
    }

    return (
      <div
        {...downshiftProps.getMenuProps()}
        class={cx('dropdown-menu', 'w-100', 'dropdown-select', {
          show: downshiftProps.isOpen
        })}
      >
        {options.map(option => this.renderItem(downshiftProps, option))}
      </div>
    );
  }

  renderGroupList(downshiftProps) {
    const groups = (this.props.options || [])
      .map(group => this.mapFilteredGroup(downshiftProps, group))
      .filter(group => this.getGroupItems(group).length !== 0);

    if (groups.length === 0) {
      return this.renderEmptyList(downshiftProps);
    }

    return (
      <div
        {...downshiftProps.getMenuProps()}
        class={cx('dropdown-menu', 'w-100', {
          show: downshiftProps.isOpen
        })}
      >
        {groups.map(group => (
          <Fragment>
            <div class="dropdown-header">{this.itemGroupToString(downshiftProps, group)}</div>
            {this.getGroupItems(group).map(option => this.renderItem(downshiftProps, option))}
          </Fragment>
        ))}
      </div>
    );
  }

  renderInputButtons(downshiftProps) {
    const { loading, multiple, searchable, disabled, clearable } = this.props;

    if (loading) {
      return (
        <span class="input-icon-addon">
          <button type="button" class="btn btn-secondary btn-transparent btn-loading btn-block border-0 mr-1" disabled>
            {' '}
          </button>
        </span>
      );
    } else if (
      !multiple &&
      (searchable || clearable) &&
      (this.state.selectedItems.length > 0 || downshiftProps.inputValue)
    ) {
      return (
        <span class="input-icon-addon cursor-pointer" onClick={downshiftProps.clearSelection}>
          <i class="fe fe-x" />
        </span>
      );
    } else if (disabled) {
      return null;
    }

    return (
      <span class="input-icon-addon cursor-pointer" onClick={downshiftProps.toggleMenu}>
        <i class="fe fe-chevron-down" />
      </span>
    );
  }

  renderInputTags(downshiftProps) {
    const { multiple } = this.props;
    if (!multiple) {
      return null;
    }

    return (
      <div class="mb-1">
        {this.state.selectedItems.map(item => (
          <div class="tag ml-1 mb-1">
            {downshiftProps.itemToString(item)}
            <span class="cursor-pointer ml-1" {...downshiftProps.getItemProps({ item })}>
              <i class="fe fe-x" />
            </span>
          </div>
        ))}
      </div>
    );
  }

  renderInput(downshiftProps) {
    const { loading, searchable, placeholder, disabled } = this.props;

    return (
      <Localizer>
        <input
          size={this.props.size}
          class={cx('form-control', {
            'bg-white': !disabled,
            'cursor-pointer': !searchable
          })}
          {...downshiftProps.getInputProps({
            onClick: downshiftProps.toggleMenu,
            disabled: loading || disabled,
            placeholder: placeholder || <Text id="global.selectPlaceholder" />,
            readOnly: !searchable && !disabled
          })}
        />
      </Localizer>
    );
  }

  render(props) {
    const selectedItem = this.findSelected();

    return (
      <Downshift
        itemToString={this.itemToString}
        {...props}
        onChange={this.onChange}
        selectedItem={selectedItem}
        stateReducer={this.stateReducer}
        value={undefined}
      >
        {downshiftProps => (
          <div class={cx('form-group', { 'mb-0': props.noMargin })}>
            {this.renderInputTags(downshiftProps)}
            <div
              class={cx('input-icon', {
                'mb-3': !props.noMargin
              })}
            >
              {this.renderInput(downshiftProps)}
              {!props.useGroups && this.renderItemList(downshiftProps)}
              {props.useGroups && this.renderGroupList(downshiftProps)}
              {this.renderInputButtons(downshiftProps)}
            </div>
          </div>
        )}
      </Downshift>
    );
  }
}

export default Select;
