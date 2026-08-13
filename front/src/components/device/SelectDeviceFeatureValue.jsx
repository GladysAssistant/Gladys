import { Text } from 'preact-i18n';
import Select from 'react-select';

import { isValueInOptions } from '../../utils/deviceFeatureValueOptions';

/**
 * @description Select one of the values a device feature holding constants can take.
 * The options carry their translated label, so the scene editor shows "Vacuum" where it used to
 * show the raw "5", like the device widget on the dashboard does.
 * @param {Object} props - The component props.
 * @param {Array} props.options - The list of { label, value } options.
 * @param {any} props.value - The currently selected value, if any.
 * @param {Function} props.updateValue - Called with the new value, or undefined when cleared.
 * @returns {Object} The select.
 * @example
 * <SelectDeviceFeatureValue options={options} value={2} updateValue={setValue} />
 */
const SelectDeviceFeatureValue = ({ options, value, updateValue }) => {
  // Controlled, and null when the value is not in the list: a value the feature does not declare
  // must show as nothing selected rather than as a valid-looking choice.
  const selectedOption = isValueInOptions(options, value)
    ? options.find((option) => `${option.value}` === `${value}`)
    : null;

  const handleChange = (selectedValueOption) =>
    updateValue(selectedValueOption ? selectedValueOption.value : undefined);

  return (
    <Select
      value={selectedOption}
      onChange={handleChange}
      options={options}
      placeholder={<Text id="global.selectPlaceholder" />}
      className="react-select-container"
      classNamePrefix="react-select"
    />
  );
};

export default SelectDeviceFeatureValue;
