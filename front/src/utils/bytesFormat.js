import get from 'get-value';

const SIZES = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'];

function bytesFormatter(size, lang, dictionary) {
  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  const sizeCode = SIZES[i];
  const sizeName = get(dictionary, `deviceFeatureUnitShort.${sizeCode}`);
  return `${(size / Math.pow(1024, i)).toFixed(2) * 1} ${sizeName}`;
}

export { bytesFormatter };
