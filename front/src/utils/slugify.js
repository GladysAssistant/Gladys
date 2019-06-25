function slugify(str) {
  let newString = str;
  newString = newString.replace(/^\s+|\s+$/g, ''); // trim
  newString = newString.toLowerCase();

  // remove accents, swap ñ for n, etc
  const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
  const to = 'aaaaeeeeiiiioooouuuunc------';
  for (let i = 0, l = from.length; i < l; i += 1) {
    newString = newString.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  newString = newString
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return newString;
}

export default slugify;
