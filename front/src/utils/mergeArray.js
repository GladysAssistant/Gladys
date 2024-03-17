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
