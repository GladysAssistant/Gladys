(function () {
    angular.module('ui.color-picker', []).directive('colorPicker', function() {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="colorpicker-input" style="width:43px; height:20px; border: #adadad; border-width: 1px; border-style: solid; border-radius: 20px;"></div>',
            require: 'ngModel',
            scope: {
                ngModel: '='
            },
            link: function ($scope, element, attrs, ngModelCtrl, $compile) {
                var picker = new CP(element[0]);
		var modelValue = $scope.ngModel;
		if (modelValue) {
                    element.css('background-color', '#' + (modelValue).toString(16));
		}

                picker.on('stop', function (newValue) {
                    var intValue = parseInt(newValue, 16);
                    ngModelCtrl.$setViewValue(intValue);
                    element.css('background-color', '#' + newValue);
                });
            }
        };
    });
})();
