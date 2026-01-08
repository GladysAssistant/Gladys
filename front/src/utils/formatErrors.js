const formatHttpError = error => {
  const errorString = error.toString();
  let errorDetailString = '';
  // If it's an standard Gladys http error
  if (error.response && error.response.data) {
    const responseData = error.response.data;
    if (responseData.code) {
      errorDetailString += responseData.code;
    }
    if (responseData.message) {
      errorDetailString += ': ';
      errorDetailString += responseData.message;
    }
    if (responseData.error && Object.keys(responseData.error).length > 0) {
      errorDetailString += ': ';
      errorDetailString += JSON.stringify(responseData.error);
    }
  }
  return { errorString, errorDetailString };
};

export { formatHttpError };
