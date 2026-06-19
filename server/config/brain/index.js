const { lstatSync, readdirSync, readFileSync, existsSync } = require('fs');
const { join, dirname } = require('path');

const SUPPORTED_LANGUAGES = ['en', 'fr'];

const isDirectory = (source) => lstatSync(source).isDirectory();
const getDirectories = (source) =>
  readdirSync(source)
    .map((name) => join(source, name))
    .filter(isDirectory);
const addLanguage = (arr, language) =>
  arr.map((el) => {
    el.language = language;
    return el;
  });

/**
 * @description Return brain answer templates from configuration files.
 * @returns {Array<{ language: string, label: string, answers: string[] }>} Brain answers.
 * @example
 * const answers = getAnswers();
 */
function getAnswers() {
  const folders = getDirectories(dirname(__filename));

  let answers = [];

  folders.forEach((folder) => {
    SUPPORTED_LANGUAGES.forEach((language) => {
      const answerFile = join(folder, `answers.${language}.json`);

      if (existsSync(answerFile)) {
        const newAnswers = JSON.parse(readFileSync(answerFile, 'utf8'));
        answers = answers.concat(addLanguage(newAnswers, language));
      }
    });
  });

  return answers;
}

module.exports = {
  getAnswers,
  SUPPORTED_LANGUAGES,
};
