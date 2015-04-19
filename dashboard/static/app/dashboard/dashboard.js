/**
 * Created by davis on 4/16/15.
 */
var dashControllers = angular.module('dashControllers', ['chart.js']);

n = -1;

dashControllers.controller('dashTestCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.barseries = ['Rep Signups', 'Non-Rep Signups'];
    $scope.pielabels = ['Rep Signups', 'Non-Rep Signups'];
    $scope.onClick = function(points, evt) {
        var start = null, end = null;
        if (n <= 14) { // currently displaying by day; can't zoom in any further.

        }
        else if (n <= 56) { // currently displaying by week, zoom into the seven days.
            var match = points[0].label.match(/(\d+)\/(\d+)\/(\d+)/);
            var date = new Date(2000+parseInt(match[3]), parseInt(match[1])-1, match[2]);
            start = date;
            end = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 6);
        }
        else if (n <= 730)  { // currently displaying by month
            var date = new Date(points[0].label.slice(4), month_names.indexOf(points[0].label.slice(0,3)));
            start = date;
            end = new Date(date.getUTCFullYear(), date.getUTCMonth()+1, 0);
        }
        else { // currently displaying by year

        }
        if (start && end) {
            $scope.startDate = start.toISOString().slice(0, 10);
            $scope.endDate = end.toISOString().slice(0, 10);
            $scope.getData();
        }
    };
    // by default, start with this year so far.
    var end = new Date();
    var start = new Date(end.getUTCFullYear(), 0);

    $scope.startDate = start.toISOString().slice(0,10);
    $scope.endDate = end.toISOString().slice(0,10);
    // sample data ?method=range&start=2014-9-2&end=2015-9-15
    $scope.getData = function() {
        $http.get('/dashboard/api?method=range&start='+$scope.startDate+'&end='+$scope.endDate).success(function(d) {
            var data = JSON.parse(d.data);
            data = data.sort(function(a, b) {
                return new Date(a['fields'].date) - new Date(b['fields'].date);
            });

            var r = generateChart(data);

            $scope.barlabels = r['dates'];
            $scope.bardata = r['stats'];
            $scope.mode = r['mode'];
            if (r['stats'][0] && r['stats'][1])
                $scope.piedata = [r['stats'][0].reduce(function(x,y){return x+y}), r['stats'][1].reduce(function(x,y){return x+y})];
            else
                $scope.piedata = [];
        });
    };
    $scope.getData();
}]);
month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
day_names = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat']
// year is normal, but month is 0-based.
function daysInMonth(d) {
    d = new Date(d); // make sure it's not a datestring, but an actual date object.
    return new Date(d.getFullYear(), d.getUTCMonth()+1, 0).getDate();
}

function generateChart(data) {
    var dates = [];
    var stats = [[], []];
    var mode = '';
    /*
    * if the length is less than 14, just display it by day.
    * if the length is between 15 and 56, add it up by week.
    * greater than 56, do it by month.
    * greater than two years, do it by year.
    * TODO: refactor into one for loop for compactness.
    * */
    n = data.length;
    if (data.length <= 14) {
        mode = 0;
        for (var i in data) {
            var element = data[i]['fields'];
            var fdate = new Date(element.date);
            // for some reason, using local timezone gives the wrong date (day earlier in this case.
            // TODO: Check in the morning if this still gives the right date.
            dates.push(day_names[fdate.getUTCDay()]+ ' ' + (fdate.getUTCMonth()+1) +'/'+  fdate.getUTCDate());
            stats[0].push(element['day_rep_signups']);
            stats[1].push(element['day_nonrep_signups']);
        }
    }
    /*
     * Have to remember that some data might not be there.
     */
    else if (data.length <=56) { // max is eight weeks. (should it be 12 weeks?)
        mode = 1;
        var i=0;
        var week = [0,0];
        var fdate = new Date(new Date(data[i]['fields'].date));
        dates.push((fdate.getUTCMonth()+1) +'/'+  fdate.getUTCDate() +'/'+ fdate.getUTCFullYear()%100);
        for (i; i < data.length; i++) {
            var element = data[i]['fields'];
            var date = new Date(element.date);
            week[0] += parseInt(element['day_rep_signups']);
            week[1] += parseInt(element['day_nonrep_signups']);
            if (date.getDay() == 0) {
                if (i != 0) { // if this isn't the first thing in the array,
                    var fdate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
                    dates.push((fdate.getUTCMonth()+1) +'/'+  fdate.getUTCDate() +'/'+ fdate.getUTCFullYear()%100);
                    stats[0].push(week[0]);
                    stats[1].push(week[1]);
                    week = [0,0];
                }
            }
        }
        // push the remaining data.
        stats[0].push(week[0]);
        stats[1].push(week[1]);
    }
    /*
     * This is harder, since months have variable length, and some days might be missing.
     * I keep looping through, incrementing the counters, until the month changes.
     * When that happens, I push to the arrays, and reset the counters.
     */
    else if (data.length <=730) { // by month
        mode = 2;
        var i=0;
        var m = new Date(data[i]['fields'].date).getUTCMonth();
        var month = [0,0];
        for (i; i < data.length; i++) {
            var element = data[i]['fields'];
            var date = new Date(element.date);
            if (date.getUTCMonth() == m) {
                month[0] += parseInt(element['day_rep_signups']);
                month[1] += parseInt(element['day_nonrep_signups']);
            } else { // if we've gone into a new month,
                // push last month's stuff
                var lastMonth = new Date(date.getUTCFullYear(), date.getUTCMonth()-1);
                stats[0].push(month[0]);
                stats[1].push(month[1]);
                dates.push(month_names[lastMonth.getUTCMonth()] + ' ' + date.getFullYear());
                // start over
                month[0] = parseInt(element['day_rep_signups']);
                month[1] = parseInt(element['day_nonrep_signups']);
                m = new Date(element.date).getUTCMonth(); // change the month counter
            }
        }
        dates.push(month_names[new Date(data[i-1]['fields'].date).getUTCMonth()] + ' ' + date.getFullYear());
        stats[0].push(month[0]);
        stats[1].push(month[1]);
    }
    return {dates: dates, stats: stats, mode: mode};
}


angular.module('dashFilters', []).filter('unit', function() {
    return function(input) {
        switch(input) {
            case 0:
                return "day";
            case 1:
                return "week";
            case 2:
                return "month";
            case 3:
                return "year";
            default:
                return "";
        }
    }
});