
module.exports = function (grunt) {
    grunt.registerTask('coverage', [
            'mocha_istanbul'
        ]
    );
};