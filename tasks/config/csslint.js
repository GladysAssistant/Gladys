

module.exports = function(grunt){
    
    grunt.config.set('csslint', {
        strict: {
            options: {
            import: 2
            },
            src: ['./assets/styles/dependencies/adminLTE/AdminLTE.css']
        },
        }
	);
    
    grunt.loadNpmTasks('grunt-contrib-csslint');
};