(function () {
    angular.module('ui.push-button', [])
        .directive('pushButton', function () {
            return {
                restrict: 'E',
                replace: true,
                template: '<div class="btn-primary btn-outer circle" style="cursor: pointer;"><div class="btn-primary btn-inner circle"></div></div>',
                require: 'ngModel',
                scope: {
                    ngModel: '='
                },
                link: function (scope, element, attrs, ngModelCtrl) {
                    element.bind('click', function () {
                        ngModelCtrl.$setViewValue(1);
                    });

                    element.bind('mousedown', function () {
                        console.log("bouton appuyé!");
                        var e = element.children();
                        e.addClass('btn-inner-mouse-down');
                    });

                    element.bind('mouseup', function () {
                        console.log("bouton relevé!");
                        var e = element.children();
                        e.addClass('btn-inner-mouse-up');
                    });

                }
            }
        });
})();
