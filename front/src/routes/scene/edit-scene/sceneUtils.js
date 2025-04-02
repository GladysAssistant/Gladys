import get from 'get-value';

// Helper function to determine if a variable in sourcePath is available
// For an action in targetPath
const isVariableAvailableAtThisPath = (variableSourcePath, targetPath) => {
  // if the targetPath is smaller than the sourcePath, it means that
  // the variable is not in the same branch
  if (variableSourcePath.length > targetPath.length) {
    return false;
  }

  const sourceSegments = variableSourcePath.split('.');
  const targetSegments = targetPath.split('.');

  let sourceIndex = 0;
  let targetIndex = 0;

  while (sourceIndex < sourceSegments.length && targetIndex < targetSegments.length) {
    // If we encounter special segments, we need to compare within the same branch
    if (sourceSegments[sourceIndex] === 'then' || sourceSegments[sourceIndex] === 'else') {
      // If target doesn't match the same branch, paths are not comparable
      if (sourceSegments[sourceIndex] !== targetSegments[targetIndex]) {
        return false;
      }
      sourceIndex++;
      targetIndex++;
      continue;
    }

    const sourceNum = parseInt(sourceSegments[sourceIndex], 10);
    const targetNum = parseInt(targetSegments[targetIndex], 10);

    // If numbers are different, we can determine order
    if (sourceNum !== targetNum) {
      return sourceNum < targetNum;
    }

    sourceIndex++;
    targetIndex++;
  }

  // If source path is shorter and all segments matched so far, it's before
  // This handles cases like 1.0 vs 1.0.then.1.1
  return sourceSegments.length < targetSegments.length;
};

const convertPathToText = (path, dictionary) => {
  const pathSegments = path.split('.');
  let text = pathSegments
    .map(segment => {
      if (segment === 'if') {
        return get(dictionary, 'editScene.actionsCard.conditionIfThenElse.shortIf');
      }
      if (segment === 'then') {
        return get(dictionary, 'editScene.actionsCard.conditionIfThenElse.shortThen');
      }
      if (segment === 'else') {
        return get(dictionary, 'editScene.actionsCard.conditionIfThenElse.shortElse');
      }
      return `${Number(segment) + 1}`;
    })
    .join('.');
  // Add . at the end if not already present
  if (!text.endsWith('.')) {
    text += '.';
  }
  return text;
};

export { isVariableAvailableAtThisPath, convertPathToText };
