/**
 * Created by davis on 4/16/15.
 */
var dashApp = angular.module('dash-demo', [
    'dashControllers',
    'dashFilters'
]);

dashApp.config(['$compileProvider', function($compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|data):/);
}]);