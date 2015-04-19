/**
 * Created by davis on 4/16/15.
 *
 * TODO: Datepicker for range
 * TODO: "Zoom Out" button
 * TODO: Map queries to URLs for navigation
 */
var dashControllers = angular.module('dashControllers', ['chart.js']);



n = -1;

dashControllers.controller('dashTestCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.barseries = ['Rep Signups', 'Non-Rep Signups'];
    $scope.pielabels = ['Rep Signups', 'Non-Rep Signups'];
    $scope.differentiate = true;
    $scope.cumulative = false;
    $scope.toggle = function(b) {
        $scope[b] = !$scope[b];
        $scope.getData();
    };

    $scope.opts = {
        tooltipTemplate: " <%=label%>: <%= numeral(value).format('(00[.]00)') %> " +
        "- <%= numeral(circumference / 6.283).format('(0[.][00]%)') %>"
    };
    $scope.onClick = function(points, evt) {
        var start = null, end = null;
        if (n > 14)  { // zoom into a day view
            var match = points[0].label.match(/(\d+)\/(\d+)\/(\d+)/);
            var date = new Date(2000+parseInt(match[3]), parseInt(match[1])-1, match[2]);
            start = date;
            end = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 6);
        }
        if (start && end && start < end) {
            $scope.startDate = start.toISOString().slice(0, 10);
            $scope.endDate = end.toISOString().slice(0, 10);
            $scope.getData();
        }
    };
    $scope.zoomOut = function() {
        var startZoom = new Date($scope.startDate);
        var endZoom = new Date(startZoom.getUTCFullYear(), startZoom.getUTCMonth(),
            startZoom.getUTCDate() + daysInMonth(startZoom)).toISOString().slice(0,10);
        console.log(endZoom);
        $scope.endDate = endZoom;
        $scope.getData();
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
            var bardata;
            var barseries;
            $scope.barlabels = r['dates'];
            if ($scope.differentiate) { // if we're splitting up rep/non-rep signups
                bardata = r['stats'].slice(0,2);
                barseries = ['Rep Signups', 'Non-Rep Signups'];
            } else {
                bardata = [r['stats'][2]];
                barseries = ['Signups'];
            }
            if ($scope.cumulative) { // if we wanna see the cumulative growth
                var cumul = [];
                for (var j=0; j<bardata.length;j++) {
                    var c = [bardata[j][0]];
                    for (var i=1; i<bardata[j].length;i++) {
                        c.push(c[c.length-1]+bardata[j][i]);
                    }
                    cumul.push(c);
                }
                bardata = cumul;
            }
            $scope.bardata = bardata;
            $scope.barseries = barseries;
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
day_names = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
// year is normal, but month is 0-based.
function daysInMonth(d) {
    d = new Date(d); // make sure it's not a datestring, but an actual date object.
    return new Date(d.getFullYear(), d.getUTCMonth()+1, 0).getDate();
}

function generateChart(data) {
    var dates = [];
    var stats = [[], [], []];
    var mode = '';
    /*
    * if the length is less than 14, just display it by day.
    * if the length is between 15 and 56, add it up by week.
    * greater than 56, do it by month.
    * greater than two years, do it by year.
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
            stats[2].push(element['day_rep_signups']+element['day_nonrep_signups']);
        }
    }
    /*
     * Have to remember that some data might not be there. if (data.length <=56)
     */
    else { // max is eight weeks. (should it be 12 weeks?)
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
                    stats[2].push(week[0]+week[1]);

                    week = [0,0];
                }
            }
        }
        // push the remaining data.
        stats[0].push(week[0]);
        stats[1].push(week[1]);
        stats[2].push(week[0]+week[1]);
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