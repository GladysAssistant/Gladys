async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.match('image')) {
      return reject(new Error('INVALID_FILE'));
    }

    if (!file.type.match('jpeg') && !file.type.match('jpg') && !file.type.match('png')) {
      return reject(new Error('INVALID_FILE'));
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function() {
      const base64data = reader.result;
      resolve(base64data);
    };
  });
}

async function getCropperBase64Image(cropper) {
  return new Promise(resolve => {
    if (!cropper) {
      return resolve(null);
    }
    const canva = cropper.getCroppedCanvas({
      width: 100,
      height: 100
    });

    if (!canva) {
      return resolve(null);
    }
    canva.toBlob(async blob => {
      const base64Image = await fileToBase64(blob);
      resolve(base64Image);
    });
  });
}

export { fileToBase64, getCropperBase64Image };
