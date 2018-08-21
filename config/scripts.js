  
/* To get the path for scripts 
*/

module.exports.scripts = {
	folder:'api/scripts',
	servicesFolder: './api/services',
	modelFolder: './api/models',
	servicesHooksFolder: 'services',
	hooksFolder: './api/hooks',
	vmOptions:{ 
	},
	defaultSandbox: {
		console:console,
		setTimeout:setTimeout,
		setInterval: setInterval,
		clearTimeout:clearTimeout,
		clearInterval:clearInterval
	}
};