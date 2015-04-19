/**
 * Created by davis on 4/16/15.
 */
var dashApp = angular.module('dash-demo', ['chart.js']);
dashApp.controller('dashTestCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.series = ['Rep Signups', 'Non-Rep Signups'];
    $scope.onClick = function(points, evt) {
        console.log(points);
        console.log(evt);
    };
    // sample data ?method=range&start=2014-9-2&end=2015-9-15
    $http.get('/dashboard/api?year=2015').success(function(d) {
        var data = JSON.parse(d.data);
        var dates = [];
        var stats = [[], []];
        data = data.sort(function(a, b) {
            return new Date(a['fields'].date) - new Date(b['fields'].date);
        });
        /*
         * if the length is less than 14, just do it by day.
         * if the length is between 15 and 56, add it up by week.
         * greater than 56, do it by month.
         * TODO: refactor into one for loop for compactness.
         * */

        if (data.length <= 14) {
            for (var i in data) {
                var e = data[i]['fields'];
                var fdate = new Date(e.date).toLocaleDateString();
                dates.push(fdate);
                stats[0].push(e['day_rep_signups']);
                stats[1].push(e['day_nonrep_signups']);
            }
        }
        else if (data.length <=56) { // max is eight weeks. (should it be 12 weeks?
            for (var i=0; i<data.length;i+=7) {
                var week = [0,0];
                for (var j=0; j < 7 && i+j < data.length; j++) {
                    e = data[i+j]['fields'];
                    week[0] += parseInt(e['day_rep_signups']);
                    week[1] += parseInt(e['day_nonrep_signups']);
                }
                dates.push(new Date(data[i]['fields'].date).toLocaleDateString());
                stats[0].push(week[0]);
                stats[1].push(week[1]);
            }
        }
        /*
         * This is harder, since months have variable length.
         * What I'm going to do is initiate i outside the for loop,
         * and refer to it in the += so it goes up by the right amount every time.
         */
        else if (data.length <=730) { // by month
            var i;
            for (i=0; i<data.length; i += daysInMonth(data[i]['fields'].date)) {
                var month = [0,0];
                for (var j=0; j < daysInMonth(data[i]['fields'].date) && i+j < data.length; j++) {
                    e = data[i+j]['fields'];
                    month[0] += parseInt(e['day_rep_signups']);
                    month[1] += parseInt(e['day_nonrep_signups']);
                }
                var d = new Date(data[i]['fields'].date)
                dates.push(month_names[d.getMonth()] + ' ' + d.getFullYear());
                stats[0].push(month[0]);
                stats[1].push(month[1]);
            }
        }
        $scope.labels = dates;
        $scope.data = stats;
    });
}]);
month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// year is normal, but month is 0-based.
function daysInMonth(d) {
    d = new Date(d); // make sure it's not a datestring, but an actual date object.
    return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
}