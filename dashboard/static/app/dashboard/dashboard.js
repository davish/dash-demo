/**
 * Created by davis on 4/16/15.
 *
 * DONE: Datepicker for range
 * DONE: "Zoom Out" button TODO: Make zoom out better
 * DONE: Map queries to URLs for navigation
 * DONE: WoW growth instead of just cumulative signups
 * DONE: Fix week counting, it's a problem.
 * DONE: Make WoW growth use aggregate fields from statistics to save on Math and make it not change based on startdate
 * TODO: save the chart(s) to a PDF
 * TODO: Add month view
 */
var dashControllers = angular.module('dashControllers', ['chart.js']);

n = -1;

dashControllers.controller('dashTestCtrl', ['$scope', '$http', '$location', function($scope, $http, $location) {
    $scope.mode = 1;
    $scope.differentiate = true;
    $scope.cumulative = false;
    $scope.toggle = function(b) {
        $scope[b] = !$scope[b];
        if (b === 'cumulative') {
            if ($scope.cumulative) {
                $scope.line.options.scaleLabel = "<%= value %> %";
                $scope.line.options.multiTooltipTemplate = '<%=datasetLabel%>: <%= numeral(value).format(\'0.00\') %>%';
                $scope.line.options.tooltipTemplate = "<%=label%>: <%=numeral(value).format('0.00')%>%";
            } else {
                $scope.line.options.scaleLabel = "<%= value %>";
                $scope.line.options.multiTooltipTemplate = '<%=datasetLabel%>: <%= numeral(value).format(\'0,0\') %>';
                $scope.line.options.tooltipTemplate = '<%=label%>: <%=numeral(value).format(\'0,0\')%>'
            }
        }
        $scope.redrawGraphs($scope.rawData);
    };

    $scope.line = {
        data: [],
        series: [],
        labels: [],
        options: {
            bezierCurve : false,
            pointHitDetectionRadius : 1,
            multiTooltipTemplate: '<%=datasetLabel%>: <%= numeral(value).format(\'0,0\') %>',
            tooltipTemplate: '<%=label%>: <%=numeral(value).format(\'0,0\')%>',
            scaleOverride: false,
            scaleStartValue: 0,
            scaleStepWidth: 1,
            scaleSteps: 100,
            scaleBeginAtZero: true
        },
        onClick: function(points, evt) {
            var start = null, end = null;
            if ($scope.mode == 1)  { // zoom into a day view
                var match = points[0].label.match(/(\d+)\/(\d+)\/(\d+)/);
                var date = new Date(2000+parseInt(match[3]), parseInt(match[1])-1, match[2]);
                start = date;
                end = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 6);
                $scope.mode = 0;
            }
            if (start && end && start < end) {
                $scope.startDate = start.toISOString().slice(0, 10);
                $scope.endDate = end.toISOString().slice(0, 10);
                $scope.refreshGraphs();
            }
        }
    };

    $scope.pie = {
        data: [],
        labels: ["Rep Signups", "Non-Rep Signups"],
        options: {
            animation: false,
            tooltipTemplate: " <%=label%>: <%= numeral(circumference / 6.283).format('(0[.][00]%)') %> " +
            "(<%= numeral(value).format('0,0') %>)"
        }
    };

    $scope.zoomOut = function() {
        var startZoom = new Date($scope.startDate);
        var endZoom = new Date(startZoom.getUTCFullYear(), startZoom.getUTCMonth(),
            startZoom.getUTCDate() + daysInMonth(startZoom)).toISOString().slice(0,10);
        console.log(endZoom);
        $scope.endDate = endZoom;
        $scope.refreshGraphs();
    };
    // by default, start with this year so far.
    var end = new Date();
    var start = new Date(end.getUTCFullYear(), 0);

    $scope.startDate = start.toISOString().slice(0,10);
    $scope.endDate = end.toISOString().slice(0,10);
    // sample data ?method=range&start=2014-9-2&end=2015-9-15

    $scope.$watch(function(scope) { return scope.startDate }, function(n, o) {
        $location.path($scope.startDate + '/' + $scope.endDate);
        $scope.refreshGraphs();
    });
    $scope.$watch(function(scope) { return scope.endDate }, function(n, o) {
        $location.path($scope.startDate + '/' + $scope.endDate);
        $scope.refreshGraphs();
    });
    $scope.$watch(function() {return $location.path()}, function(n, o) {
        var r = n.match(/\/([0-9\-]+)\/([0-9\-]+)/)
        $scope.startDate = r[1];
        $scope.endDate = r[2];
    });

    $scope.refreshGraphs = function() {
        $http.get('/dashboard/api?method=range&start='+$scope.startDate+'&end='+$scope.endDate).success(function(d) {
            var data = JSON.parse(d.data);
            $scope.rawData = data;
            $scope.redrawGraphs(data);
        });
    };
    $scope.redrawGraphs = function(data) {
        data = data.sort(function(a, b) {
            return new Date(a['fields'].date) - new Date(b['fields'].date);
        });

        var r = genChart(data, $scope.cumulative, $scope.mode);
        $scope.line.series=$scope.differentiate ? ['Rep Signups', 'Non-Rep Signups'] : ['Signups'];
        $scope.line.data = $scope.differentiate ? r['stats'].slice(0,2) : [r['stats'][2]];
        $scope.line.labels = r['dates'];
        $scope.mode = r['mode'];
        if (r['stats'][0] && r['stats'][1])
            $scope.pie.data = [r['stats'][0].reduce(function(x,y){return x+y}), r['stats'][1].reduce(function(x,y){return x+y})];
        else
            $scope.pie.data = [];
    };
    $scope.refreshGraphs();
}]);
month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
day_names = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
// year is normal, but month is 0-based.
function daysInMonth(d) {
    d = new Date(d); // make sure it's not a datestring, but an actual date object.
    return new Date(d.getFullYear(), d.getUTCMonth()+1, 0).getDate();
}

function genChart(data, cumulative, mode) {
    var dates = [];
    var stats = [[], [], []];
    if (data.length < 14) mode = 0;
    if (mode == 0) {
        for (var i in data) {
            var element = data[i]['fields'];
            var fdate = new Date(element.date);
            dates.push(day_names[fdate.getUTCDay()]+ ' ' + (fdate.getUTCMonth()+1) +'/'+  fdate.getUTCDate());
            var r = cumulative ? cumulativeElement(element) : absoluteElement(element);
            stats[0].push(r[0]);
            stats[1].push(r[1]);
            stats[2].push(r[2]);
        }
    }
    /*
     * Have to remember that some data might not be there. if (data.length <=56)
     */
    else if (mode == 1) { // max is eight weeks. (should it be 12 weeks?)
        var i=0;
        var week = [0,0,0];
        var fdate = new Date(new Date(data[i]['fields'].date));
        dates.push((fdate.getUTCMonth()+1) +'/'+  fdate.getUTCDate() +'/'+ fdate.getUTCFullYear()%100);
        for (i; i < data.length; i++) {
            var element = data[i]['fields'];

            week[0] += parseInt(element['day_rep_signups']);
            week[1] += parseInt(element['day_nonrep_signups']);

            var date = new Date(element.date);
            if (date.getUTCDay() == 0) {
                if (i != 0) { // if this isn't the first thing in the array,
                    var fdate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
                    dates.push((fdate.getUTCMonth()+1) +'/'+  fdate.getUTCDate() +'/'+ fdate.getUTCFullYear()%100);
                    week[2] = week[0] + week[1];
                    /*
                     * WoW growth.
                     * given set W and week n, WoW growth is
                     * W[n] / sum(W[n-1])
                     */
                    if (cumulative) cumulativeWeek(week, element);

                    stats[0].push(week[0]);
                    stats[1].push(week[1]);
                    stats[2].push(week[0]+week[1]);

                    week = [0,0];
                }
            }
        }
        week[2] = week[0] + week[1];
        // push the remaining data.
        if (cumulative) cumulativeWeek(week, data[i-1]['fields']);
        stats[0].push(week[0]);
        stats[1].push(week[1]);
        stats[2].push(week[0]+week[1]);
    }
    else {
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
                if (cumulative) cumulativeWeek(month, element);
                stats[0].push(month[0]);
                stats[1].push(month[1]);
                dates.push(month_names[lastMonth.getUTCMonth()] + ' ' + date.getUTCFullYear());
                // start over
                month[0] = parseInt(element['day_rep_signups']);
                month[1] = parseInt(element['day_nonrep_signups']);
                m = new Date(element.date).getUTCMonth(); // change the month counter
            }
        }
        dates.push(month_names[new Date(data[i-1]['fields'].date).getUTCMonth()] + ' ' + date.getFullYear());
        if (cumulative) cumulativeWeek(month, element);
        stats[0].push(month[0]);
        stats[1].push(month[1]);
    }

    return {dates: dates, stats: stats, mode: mode};
}

function absoluteElement(element) {
    return [
        element['day_rep_signups'],
        element['day_nonrep_signups'],
        element['day_rep_signups']+element['day_nonrep_signups']
    ];
}

function cumulativeElement(e) {
    return [
        e['day_rep_signups'] / (e['aggregate_rep_signups']-e['day_rep_signups'])*100,
        e['day_nonrep_signups'] / ((e['aggregate_total_signups'] - e['aggregate_rep_signups']) - e['day_nonrep_signups'])*100,
        e['day_rep_signups']+e['day_nonrep_signups'] / (e['aggregate_total_signups'] - (e['day_rep_signups']+e['day_nonrep-signups']))*100
    ]
}

function cumulativeWeek(week, latestElement) {
    week[0] = week[0] / (latestElement['aggregate_rep_signups']-week[0])*100;
    week[1] = week[1] / ((latestElement['aggregate_total_signups'] - latestElement['aggregate_rep_signups']) - week[1])*100;
    week[2] = week[2] / (latestElement['aggregate_total_signups'] - week[2])*100;
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