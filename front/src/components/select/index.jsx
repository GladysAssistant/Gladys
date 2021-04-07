import Select from 'react-select';
import { useText } from 'preact-i18n';

export const LocalizedSelect = props => {
  const translatedLabels = useText(
    (props.options || []).reduce((acc, option, index) => {
      // we use the index as the key rather than the value
      // this is in case two options have the same value but differing labels
      acc[index] = option.label;
      return acc;
    }, {})
  );

  const options = (props.options || []).map((option, index) => ({
    value: option.value,
    label: translatedLabels[index]
  }));
  return <Select {...{ ...props, options }} />;
};

export default LocalizedSelect;
