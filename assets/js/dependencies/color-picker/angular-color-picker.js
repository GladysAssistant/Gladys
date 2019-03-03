(function () {
    angular.module('ui.color-picker', []).directive('colorPicker', function() {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="colorpicker-input" style="width:43px; height:20px; border: #adadad; border-width: 1px; border-style: solid; border-radius: 20px;"></div>',
            require: 'ngModel',
            scope: {
                ngModel: '=',
                intValue: '='
            },
            link: function ($scope, element, attrs, ngModelCtrl, $compile) {
                var picker = new CP(element[0]);
                
                $scope.$watch('ngModel', function(newValue, oldValue) {
                    if(Number.isInteger(newValue)){
                        picker.set('#' + (newValue).toString(16))
                        picker.source.style.backgroundColor = '#' + (newValue).toString(16)
                    }else {
                        picker.set(newValue)
                        picker.source.style.backgroundColor = newValue
                    }
                    
                });

                picker.on('stop', function(newColor) {
                    var intValue = $scope.intValue

                    if(intValue != undefined && intValue != null && intValue != false){
                        ngModelCtrl.$setViewValue(parseInt(newColor, 16));
                    }else {
                        ngModelCtrl.$setViewValue('#' + newColor);
                    }
                })

                picker.on('change', function(newColor) {
                    picker.source.style.backgroundColor = '#' + newColor
                })
            }
        };
    });
})();
