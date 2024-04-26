/**
 * This method will merge a first array, with the values of a second array
 * For example:
 *  const arrayToFill = ['COLOR_X', null, 'COLOR_Y', null, null, 'COLOR_Z'];
 *  const defaultValues = ['COLOR_A', 'COLOR_B', 'COLOR_C'];
 *  Will result as ['COLOR_X', 'COLOR_B', 'COLOR_Y', 'COLOR_A', 'COLOR_B', 'COLOR_Z']
 */
function mergeArray(arrayToFill, defaultValues) {
  if (!arrayToFill || !Array.isArray(arrayToFill) || !arrayToFill.length) {
    return defaultValues;
  }

  if (!defaultValues || !Array.isArray(defaultValues) || !defaultValues.length) {
    return arrayToFill;
  }

  return arrayToFill.map((value, i) => value || defaultValues[i % defaultValues.length]);
}

export default mergeArray;
