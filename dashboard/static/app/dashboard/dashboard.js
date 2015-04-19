/**
 * Created by davis on 4/16/15.
 */
var dashApp = angular.module('dash-demo', ['chart.js']);
dashApp.controller('dashTestCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.series = ['Rep Signups', 'Non-Rep Signups'];
    $scope.onClick = function(points, evt) {
        var date = points[0].label;
        console.log(date);
    };
    // by default, start with this year so far.
    var e = new Date();
    var s = new Date(e.getUTCFullYear(), 0);

    $scope.startDate = s.toISOString().slice(0,10);
    $scope.endDate = e.toISOString().slice(0,10);
    // sample data ?method=range&start=2014-9-2&end=2015-9-15
    $scope.getData = function() {
        $http.get('/dashboard/api?method=range&start='+$scope.startDate+'&end='+$scope.endDate).success(function(d) {
            var data = JSON.parse(d.data);
            data = data.sort(function(a, b) {
                return new Date(a['fields'].date) - new Date(b['fields'].date);
            });

            var r = generateChart(data);

            $scope.labels = r['dates'];
            $scope.data = r['stats'];
        });
    };
    $scope.getData();
}]);
month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// year is normal, but month is 0-based.
function daysInMonth(d) {
    d = new Date(d); // make sure it's not a datestring, but an actual date object.
    return new Date(d.getFullYear(), d.getUTCMonth()+1, 0).getDate();
}

function generateChart(data) {
    var dates = [];
    var stats = [[], []];
     /*
     * if the length is less than 14, just display it by day.
     * if the length is between 15 and 56, add it up by week.
     * greater than 56, do it by month.
     * greater than two years, do it by year.
     * TODO: refactor into one for loop for compactness.
     * */
    if (data.length <= 14) {
            for (var i in data) {
                var e = data[i]['fields'];
                var fdate = new Date(e.date);
                // for some reason, using local timezone gives the wrong date (day earlier in this case.
                // TODO: Check in the morning if this still gives the right date.
                dates.push((fdate.getUTCMonth()+1) +'/'+  fdate.getUTCDate() +'/'+ fdate.getUTCFullYear()%100);
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
            var d = new Date(data[i]['fields'].date);
            dates.push(month_names[d.getUTCMonth()] + ' ' + d.getFullYear());
            stats[0].push(month[0]);
            stats[1].push(month[1]);
        }
    }
    return {dates: dates, stats: stats};
}