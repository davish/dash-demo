/**
 * Created by davis on 4/16/15.
 *
 * DONE: Datepicker for range
 * DONE: "Zoom Out" button
 * DONE: Make zoom better
 * DONE: Map queries to URLs for navigation
 * DONE: WoW growth instead of just cumulative signups
 * DONE: Make WoW growth use aggregate fields from statistics to save on Math and make it not change based on startdate
 * DONE: save the chart(s) to a PDF
 * DONE: Forward and back buttons for navigating between months
 * DONE: Add month view
 */
var dashControllers = angular.module('dashControllers', ['chart.js']);

n = -1;

dashControllers.controller('dashTestCtrl', ['$scope', '$http', '$location', function($scope, $http, $location) {
    // used for toggling buttons with ng-click, this way we need only one function.
    $scope.toggle = function(b) {
        $scope[b] = !$scope[b];
        if (b === 'cumulative') {
            if ($scope.cumulative) {
                $scope.line.options.scaleLabel = " <%= value %> %";
                $scope.line.options.multiTooltipTemplate = "<%=datasetLabel%>: <%= numeral(value).format('0.00')%>%";
                $scope.line.options.tooltipTemplate = "<%=label%>: <%=numeral(value).format('0.00')%>%";
            } else {
                $scope.line.options.scaleLabel = " <%= value %>";
                $scope.line.options.multiTooltipTemplate = "<%=datasetLabel%>: <%= numeral(value).format('0,0')%>";
                $scope.line.options.tooltipTemplate = '<%=label%>: <%=numeral(value).format(\'0,0\')%>'
            }
        }
    };
    // options and data for the line graph
    $scope.line = {
        data: [],
        series: [],
        labels: [],
        options: {
            animation: false,
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
            if ($scope.mode == 1)  { // zoom into a day view if we're in week mode
                var match = points[0].label.match(/(\d+)\/(\d+)\/(\d+)/);
                var date = new Date(2000+parseInt(match[3]), parseInt(match[1])-1, match[2]); // Y3K bug :)
                start = date;
                end = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 6);
                $scope.mode = 0;
            }
            else if ($scope.mode == 2) {
                var match = points[0].label.match(/([A-z]+) ([0-9]+)/);
                start = new Date(match[2], month_names.indexOf(match[1]), 1);
                end = new Date(start.getUTCFullYear(), start.getUTCMonth()+1, 0);
                $scope.mode = 1;
            }
            if (start && end && start < end) { // make sure the chart won't give any errors
                $scope.startDate = start.toISOString().slice(0, 10);
                $scope.endDate = end.toISOString().slice(0, 10);
                $scope.refreshGraphs();
            }
        }
    };
    // options and data for the pie graph.
    $scope.pie = {
        data: [],
        labels: ["Rep Signups", "Non-Rep Signups"],
        options: {
            animation: false,
            tooltipTemplate: " <%=label%>: <%= numeral(circumference / 6.283).format('(0[.][00]%)') %> " +
            "(<%= numeral(value).format('0,0') %>)"
        }
    };
    // navigational functions
    $scope.nav = {
        zoomIn: function() {
            var decrement;
            if ($scope.mode == 0) {
                decrement = 2;
            } else if ($scope.mode == 1) {
                decrement = 7;
            } else if ($scope.mode == 2) {
                decrement = 28;
            }
            var startNow = new Date($scope.startDate);
            var endNow = new Date($scope.endDate); // current end point

            var startNew = new Date(
                startNow.getUTCFullYear(),
                startNow.getUTCMonth(),
                startNow.getUTCDate() + decrement
            );
            var endNew = new Date(
                endNow.getUTCFullYear(),
                endNow.getUTCMonth(),
                endNow.getUTCDate() - decrement
            ); // this way the center of the chart always stays the same
            if (startNew < endNew) {
                $scope.startDate = startNew.toISOString().slice(0, 10);
                $scope.endDate = endNew.toISOString().slice(0, 10);
                $scope.refreshGraphs();
            }

        },
        zoomOut: function() { // same as zoomIn, could possibly be one function, literally two lines different
            var increment;
            if ($scope.mode == 0) {
                increment = 2;
            } else if ($scope.mode == 1) {
                increment = 7;
            } else if ($scope.mode == 2) {
                increment = 28;
            }
            var startNow = new Date($scope.startDate);
            var endNow = new Date($scope.endDate); // current end point
            var startNew = new Date(
                startNow.getUTCFullYear(),
                startNow.getUTCMonth(),
                startNow.getUTCDate() - increment // different line
            );
            var endNew = new Date(
                endNow.getUTCFullYear(),
                endNow.getUTCMonth(),
                endNow.getUTCDate() + increment // different line
            );
            if (startNew < endNew) {
                $scope.startDate = startNew.toISOString().slice(0, 10);
                $scope.endDate = endNew.toISOString().slice(0, 10);
                $scope.refreshGraphs();
            }
        },
        // Shift date-range back one week.
        back: function() { // again, same as forward but for one line.
            var stdt = new Date($scope.startDate); // startdate in a date variable so we can use it.
            var enddt = new Date($scope.endDate);
            var decrement; // ISOString with new start date.
            if ($scope.mode == 0) { // decrement by one day. (-1)
                decrement = 1;
            } else if ($scope.mode == 1) { // one week (-7)
                decrement = 7;
            } else if ($scope.mode == 2) { // one month (-daysInMonth(month))
                decrement = daysInMonth(stdt);
            }
            $scope.startDate = new Date(
                stdt.getUTCFullYear(),
                stdt.getUTCMonth(),
                stdt.getUTCDate()-decrement
            ).toISOString().slice(0,10);
            $scope.endDate = new Date(
                enddt.getUTCFullYear(),
                enddt.getUTCMonth(),
                enddt.getUTCDate()-decrement
            ).toISOString().slice(0,10);
            $scope.refreshGraphs();
        },
        forward: function() {
            var stdt = new Date($scope.startDate); // startdate in a date variable so we can use it.
            var enddt = new Date($scope.endDate);
            var increment; // ISOString with new start date.
            if ($scope.mode == 0) { // decrement by one day. (-1)
                increment = 1;
            } else if ($scope.mode == 1) { // one week (-7)
                increment = 7;
            } else if ($scope.mode == 2) { // one month (-daysInMonth(month))
                increment = daysInMonth(stdt);
            }
            $scope.startDate = new Date(
                stdt.getUTCFullYear(),
                stdt.getUTCMonth(),
                stdt.getUTCDate()+increment
            ).toISOString().slice(0,10);
            $scope.endDate = new Date(
                enddt.getUTCFullYear(),
                enddt.getUTCMonth(),
                enddt.getUTCDate()+increment
            ).toISOString().slice(0,10);
            $scope.refreshGraphs();
        }
    };

    $scope.changeLocation  = function(n, o){
        if (typeof n !== 'undefined') // if it's not when the page first loads, i.e. stuff is undefined.
            $location.path($scope.startDate+'/'+$scope.endDate+'/'+$scope.mode+($scope.differentiate?"1":"0")+($scope.cumulative ? "1":"0"));
    };
    $scope.$watch(function(scope) {return scope.startDate}, $scope.changeLocation);
    $scope.$watch(function(scope) {return scope.endDate}, $scope.changeLocation);
    $scope.$watch(function(scope){return scope.mode}, $scope.changeLocation);
    $scope.$watch(function(scope){return scope.differentiate}, $scope.changeLocation);
    $scope.$watch(function(scope){return scope.cumulative}, $scope.changeLocation);

    $scope.$watch(function() {return $location.path()}, function(n, o) {
        var r = n.match(/\/([0-9\-]+)\/([0-9\-]+)\/([0-9])([0-9])([0-9])/); // parse the URL
        if (r) { // set the values
            $scope.startDate = r[1];
            $scope.endDate = r[2];
            $scope.mode = r[3];
            $scope.differentiate = (r[4] == "1");
            $scope.cumulative = (r[5] == "1");
        } else { // if nothing, then set default vals
            var end = new Date();
            var start = new Date(end.getUTCFullYear(), 0);

            $scope.startDate = start.toISOString().slice(0,10);
            $scope.endDate = end.toISOString().slice(0,10);
            $scope.mode = 1;
            $scope.differentiate = true;
            $scope.cumulative = false;
        }
        $scope.refreshGraphs();
    });

    $scope.refreshGraphs = function() { // get new data
        $http.get('/dashboard/api?method=range&start='+$scope.startDate+'&end='+$scope.endDate).success(function(d) {
            var data = JSON.parse(d.data);
            $scope.rawData = data;
            $scope.redrawGraphs(data);
        });
    };
    $scope.redrawGraphs = function(data) { // with data, redraw graphs
        if ($scope.mode == 0 && data.length > 45) { // if it's too big for day view, change to week.
            $scope.mode = 1;
        }
        else if ($scope.mode == 1 && data.length < 27) {
            $scope.mode = 0;
        }

        data = data.sort(function(a, b) { // make sure data is in ascending order by date
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
        // when we redraw the graph, we have to also update the data url for the image.
        var url = $('#line')[0].toDataURL();
        $scope.downloadhref = url;
    };
    //$scope.refreshGraphs();
}]);
month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
day_names = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
// year is normal, but month is 0-based.
function daysInMonth(d) {
    d = new Date(d); // make sure it's not a datestring, but an actual date object.
    return new Date(d.getFullYear(), d.getUTCMonth()+1, 0).getDate();
}
/**
 Given the raw data returned from the server-side PostgreSQL Query, generate a format of chart that Chart.js will like.
*/
function genChart(data, cumulative, mode) {
    var dates = [];
    var stats = [[], [], []];

    if (mode == 0) { // just count by element for days
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
     * Have to remember that some data might not be there.
     * Increment counters until you hit a Sunday, in which case you push to the array and start incrementing from
     * the beginning again.
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
    // same thing with months, but we have the variable m which keeps track of current month.
    else {
        var i=0;
        var m = new Date(data[i]['fields'].date).getUTCMonth();
        var month = [0,0,0];
        for (i; i < data.length; i++) {
            var element = data[i]['fields'];
            var date = new Date(element.date);
            if (date.getUTCMonth() == m) {
                month[0] += parseInt(element['day_rep_signups']);
                month[1] += parseInt(element['day_nonrep_signups']);
            } else { // if we've gone into a new month,
                // push last month's stuff
                var lastMonth = new Date(date.getUTCFullYear(), date.getUTCMonth()-1);
                month[2] = month[0] + month[1];
                if (cumulative) cumulativeWeek(month, element); // cumulativeWeek also, ironically, works for months.
                stats[0].push(month[0]);
                stats[1].push(month[1]);
                stats[2].push(month[2]);
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
        stats[2].push(month[2]);
    }

    return {dates: dates, stats: stats, mode: mode};
}

function absoluteElement(element) { // used for day view
    return [
        element['day_rep_signups'],
        element['day_nonrep_signups'],
        element['day_rep_signups']+element['day_nonrep_signups']
    ];
}

function cumulativeElement(e) { // get cumulative DoD for the day view.
    return [
        e['day_rep_signups'] / (e['aggregate_rep_signups']-e['day_rep_signups'])*100,
        e['day_nonrep_signups'] / ((e['aggregate_total_signups'] - e['aggregate_rep_signups']) - e['day_nonrep_signups'])*100,
        (e['day_rep_signups']+e['day_nonrep_signups']) / (e['aggregate_total_signups'] - (e['day_rep_signups']+e['day_nonrep_signups']))*100
    ]
}
// objects/arrays are mutable, we take advantage of that when doing WoW calcs.
// Calculate the cumulative % growth, and replace the absolute measurement with it.
function cumulativeWeek(week, latestElement) { 
    week[0] = week[0] / (latestElement['aggregate_rep_signups']-week[0])*100;
    week[1] = week[1] / ((latestElement['aggregate_total_signups'] - latestElement['aggregate_rep_signups']) - week[1])*100;
    week[2] = week[2] / (latestElement['aggregate_total_signups'] - week[2])*100;
}

/**
 * Filter for turning mode (variable from 0-2) into a string for display purposes.
*/
angular.module('dashFilters', []).filter('unit', function() {
    return function(input) {
        input = parseInt(input);
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