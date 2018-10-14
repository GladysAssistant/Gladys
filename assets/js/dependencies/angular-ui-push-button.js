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
                link: function ($scope, element, attrs, ngModelCtrl) {

                    element.bind('click', function () {
                        ngModelCtrl.$setViewValue($scope.ngModel);

                        var e = element.children();
                        var animationEvent = whichAnimationEvent();
                        e.addClass('btn-inner-mouse-down');
                        e.one(animationEvent,
                            function (event) {
                                e.removeClass('btn-inner-mouse-down');
                                e.addClass('btn-inner-mouse-up');
                                e.one(animationEvent,
                                    function (event) {
                                        e.removeClass('btn-inner-mouse-up');
                                    });
                            });
                    });

                    function whichAnimationEvent() {
                        var t,
                            el = document.createElement("fakeelement");

                        var animations = {
                            "animation": "animationend",
                            "OAnimation": "oAnimationEnd",
                            "MozAnimation": "animationend",
                            "WebkitAnimation": "webkitAnimationEnd"
                        }

                        for (t in animations) {
                            if (el.style[t] !== undefined) {
                                return animations[t];
                            }
                        }
                    }
                }
            }
        });
})();
