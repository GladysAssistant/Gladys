angular.module('tb-color-picker', [])
    .run(['$templateCache', function ($templateCache) {
        $templateCache.put('color-picker.tp1.html', '<div class="color-picker">' +
            '<div class="selected-color" ng-style="{\'background-color\': color}"></div>' +
            '<div class="color-palette">' +
                '<div ng-repeat="option in options"' +
                'ng-style="{\'background-color\': option}"' +
                'ng-class="{\'palette-selected-color\': option == color, \'transparent-color\': option == \'tranparent\'}"' +
                'ng-click="changeColor(option)"></div>' +
            '</div>' +
        '</div>');
    }])
    .directive('colorPicker', function () {
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