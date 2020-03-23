import { Component, Fragment } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import Downshift from 'downshift/preact';
import cx from 'classnames';
import get from 'get-value';

class SelectComponent extends Component {
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

  onChange = item => {
    const { multiple, onChange } = this.props;
    let selectedItems = [];

    if (multiple) {
      selectedItems = this.state.selectedItems;
    }

    if (item) {
      const itemIndex = selectedItems.findIndex(selected => this.areItemsEqual(selected, item));
      if (itemIndex >= 0) {
        selectedItems.splice(itemIndex, 1);
      } else {
        selectedItems.push(item);
      }
    }

    let callback = () => {
      if (onChange) {
        if (multiple) {
          onChange(selectedItems);
        } else {
          onChange(item);
        }
      }
    };

    this.setState({ selectedItems }, callback);
  };

  getGroupItems(group) {
    return get(group, this.props.groupItemsKey || 'options');
  }

  filterItem = (downshiftProps, option) => {
    const { inputValue, selectedItem } = downshiftProps;
    const { multiple, searchable } = this.props;

    if (!multiple && selectedItem) {
      return true;
    } else if (searchable && inputValue && typeof inputValue === 'string') {
      let optionLabel = downshiftProps.itemToString(option);
      if (typeof optionLabel === 'object' && optionLabel.type === Text) {
        optionLabel = get(this.context.intl.dictionary, optionLabel.props.id);
      }

      if (typeof optionLabel === 'string') {
        return optionLabel.toLowerCase().includes(inputValue.toLowerCase());
      }
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
    return item ? get(item, this.props.itemLabelKey || 'label') : '';
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

    let selectedItems = this.transformPropsValue(props);
    this.state = {
      selectedItems
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      let selectedItems = this.transformPropsValue(nextProps);

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
        class={cx('dropdown-menu', 'w-100', {
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
    const { loading, multiple, searchable } = this.props;

    if (loading) {
      return (
        <span class="input-icon-addon">
          <button type="button" class="btn btn-secondary btn-transparent btn-loading btn-block border-0 mr-1" disabled>
            {' '}
          </button>
        </span>
      );
    } else if (!multiple && searchable && (this.state.selectedItems.length > 0 || downshiftProps.inputValue)) {
      return (
        <span class="input-icon-addon cursor-pointer" onClick={downshiftProps.clearSelection}>
          <i class="fe fe-x" />
        </span>
      );
    }

    return (
      <span class="input-icon-addon cursor-pointer" onClick={downshiftProps.toggleMenu}>
        <i class="fe fe-chevron-down" />
      </span>
    );
  }

  renderInputTags(downshiftProps) {
    if (!this.props.multiple) {
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
    const { loading, searchable, placeholder } = this.props;

    return (
      <Localizer>
        <input
          class="form-control custom-select"
          {...downshiftProps.getInputProps({
            onClick: downshiftProps.toggleMenu,
            disabled: loading,
            placeholder: placeholder || <Text id="global.selectPlaceholder" />,
            readOnly: !searchable
          })}
        />
      </Localizer>
    );
  }

  render(props) {
    return (
      <Downshift
        itemToString={this.itemToString}
        {...props}
        onChange={this.onChange}
        selectedItem={props.multiple ? null : props.value || ''}
        stateReducer={this.stateReducer}
      >
        {downshiftProps => (
          <div class="form-group">
            {this.renderInputTags(downshiftProps)}
            <div class="input-icon mb-3">
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

export default SelectComponent;
