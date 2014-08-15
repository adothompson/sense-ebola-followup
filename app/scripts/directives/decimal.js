'use strict';

/**
 * @ngdoc directive
 * @name ehealthSenseFollowupApp.directive:decimal
 * @description
 * # decimal
 */
angular.module('lmisChromeApp')
  .directive('decimal', function () {
    return {
      restrict: 'A',
      require: '?ngModel',
      link: function(scope, element, attrs, ngModelCtrl) {
        if (!ngModelCtrl) {
          return;
        }

        ngModelCtrl.$parsers.push(function(val) {
          var clean = val.replace( /[^\d\.]+/g, '');
          if (val !== clean) {
            ngModelCtrl.$setViewValue(clean);
            ngModelCtrl.$render();
          }
          return clean;
        });

        element.bind('keypress', function(event) {
          if (event.keyCode === 32) {
            event.preventDefault();
          }
        });
      }
    };
  });
