(function () {
    angular.module('ui.push-button', []).directive('pushButton', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<a href=""><div class="btn-primary btn-outer circle"><div class="btn-primary btn-inner circle"></div></div></a>',
            require: '?ngModel',
            scope: {
                ngModel: '='
            },
            link: function ($scope, element, attrs, ngModelCtrl, $compile) {
                if (!ngModel)
                return; 
                element.bind('click', function() {
                    console.log("click");
                    ngModelCtrl.$setViewValue(1);
                });
            }
        }
    });
})();
