module.exports = questions => ({ prompter, args }) => {
  const providedArgs = questions.reduce((selectedArgs, question) => {
    if (args[question.name]) {
      selectedArgs[question.name] = args[question.name];
    }
    return selectedArgs;
  }, {});
  return prompter.prompt(questions.filter(({ name }) => !providedArgs[name]));
    // See https://github.com/jondot/hygen/issues/35#issuecomment-594718170
    // .then(answers => ({ ...answers, ...providedArgs }));
};