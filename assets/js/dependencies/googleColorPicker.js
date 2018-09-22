angular.module('ui.google-color-picker', [])
    .run(['$templateCache', function ($templateCache) {
        $templateCache.put('color-picker.tp1.html', '<div class="google-color-picker">' +
            '<div class="google-selected-color" ng-style="{\'background-color\': color}"></div>' +
            '<div class="google-color-palette">' +
                '<div ng-repeat="option in options"' +
                'ng-style="{\'background-color\': option}"' +
                'ng-class="{\'google-palette-selected-color\': option == color, \'google-transparent-color\': option == \'tranparent\'}"' +
                'ng-click="changeColor(option)"></div>' +
            '</div>' +
        '</div>');
    }])
    .directive('googleColorPicker', function () {
        return {
            restrict: 'E',
            templateUrl: 'color-picker.tp1.html',
            replace: true,
            scope: {
                color: '=',
                options: '=',
                onColorChanged: '&',
            },
            link: function (scope) {
                scope.changeColor = function (option) {
                    var old = scope.color;
                    scope.color = option;
                    scope.onColorChanged({ newColor: option, oldColor: old });
                }
            }
        };
    });