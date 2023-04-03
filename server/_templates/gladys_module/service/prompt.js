// see types of prompts:
// https://github.com/enquirer/enquirer/tree/master/examples
//
module.exports = {
  params: ({ args }) => {
    return { 
      module: args.module,
      className: args.className,
      attributeName: args.attributeName,
      constName: args.constName,
    };
  },
  prompt: ({ inquirer, args, inflection }) => {
    return inquirer.prompt([
    {
      type: 'input',
      name: 'module',
      message: "What's your module name (ie:androidtv)? It will create the service folder (ie: services/androidtv)"
    },
    {
      type: 'input',
      name: 'className',
      message: 'Used in Service, Handler and Controller name as prefix (ie: AndroidTv => AndroidTvService):'
     },
     {
      type: 'input',
      name: 'attributeName',
      message: 'Used as prefix for attributes (ie: androidtv => androidtvManager):'
     },
     {
      type: 'input',
      name: 'constName',
      message: 'Used as prefix for constants (ie: androidtv => ANDROIDTV):'
     },
   ]
   )
  }
}
