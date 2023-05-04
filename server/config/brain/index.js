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
 * @description Return brain configuration.
 * @returns {object} Return brain configuration.
 * @example
 * const config = getConfiguration();
 */
function getConfiguration() {
  const folders = getDirectories(dirname(__filename));

  let questions = [];
  let answers = [];

  folders.forEach((folder) => {
    SUPPORTED_LANGUAGES.forEach((language) => {
      const questionFile = join(folder, `questions.${language}.json`);
      const answerFile = join(folder, `answers.${language}.json`);

      if (existsSync(questionFile)) {
        const newQuestions = JSON.parse(readFileSync(questionFile, 'utf8'));
        questions = questions.concat(addLanguage(newQuestions, language));
      }

      if (existsSync(answerFile)) {
        const newAnswers = JSON.parse(readFileSync(answerFile, 'utf8'));
        answers = answers.concat(addLanguage(newAnswers, language));
      }
    });
  });

  const brainConfig = {
    questions,
    answers,
  };

  return brainConfig;
}

module.exports = {
  getConfiguration,
  SUPPORTED_LANGUAGES,
};
