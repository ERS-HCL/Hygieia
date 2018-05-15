(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .service('paginationWrapperService', paginationWrapperService);
    paginationWrapperService.$inject = ['$q', 'DashboardType', 'dashboardData', 'dashboardService', 'userService', '$http', 'buildData', '$rootScope', 'codeRepoData'];

    function paginationWrapperService($q, DashboardType, dashboardData, dashboardService, userService, $http, buildData, $rootScope, codeRepoData) {
        var currentPage = 0;
        var pageSize = 10;
        var currentPageMyDash = 0;
        var searchFilter = "";
        var dashboards;
        var dashboardTypes;
        var totalItems;
        var totalItemsMyDash;
        var username = userService.getUsername();
        var mydash;
        var ctrl = this;
        this.calculateTotalItems = function (type) {
            return dashboardData.count(type).then(function (data) {
                totalItems = data;
            });
        }

        this.calculateTotalItemsMyDash = function (type) {
            return dashboardData.myDashboardsCount(type).then(function (data) {
                totalItemsMyDash = data;
            });
        }

        this.getTotalItems = function () {
            return totalItems;
        }

        this.getTotalItemsMyDash = function () {
            return totalItemsMyDash;
        }

        this.getCurrentPage = function () {
            return currentPage;
        }

        this.getPageSize = function () {
            return pageSize;
        }

        this.getDashboards = function () {
            return dashboards;
        }

        this.getMyDashboards = function () {
            return mydash;
        }

        this.setDashboards = function (paramDashboards) {
            dashboards = paramDashboards;
        }

        var getInvalidAppOrCompError = function (data) {
            var showError = false;
            if ((data.configurationItemBusServName != undefined && !data.validServiceName)
                || (data.configurationItemBusAppName != undefined && !data.validAppName)) {
                showError = true;
            }

            return showError;
        }

        this.pageChangeHandler = function (pageNumber, type) {
            currentPage = pageNumber;

            if (searchFilter == "") {
                return dashboardData.searchByPage({ "search": '', "type": type, "size": pageSize, "page": pageNumber - 1 })
                    .then(this.processDashboardResponse, this.processDashboardError);
            } else {
                return dashboardData.filterByTitle({ "search": searchFilter, "type": type, "size": pageSize, "page": pageNumber - 1 })
                    .then(this.processDashboardFilterResponse, this.processDashboardError);
            }
        }

        this.pageChangeHandlerForMyDash = function (pageNumber, type) {
            currentPageMyDash = pageNumber;

            if (searchFilter == "") {
                return dashboardData.searchMyDashboardsByPage({ "username": username, "type": type, "size": pageSize, "page": pageNumber - 1 })
                    .then(this.processMyDashboardResponse, this.processMyDashboardError);
            } else {
                return dashboardData.filterMyDashboardsByTitle({ "search": searchFilter, "size": pageSize, "page": pageNumber - 1 })
                    .then(this.processFilterMyDashboardResponse, this.processMyDashboardError);
            }
        }

        this.processDashboardResponse = function (response) {
            var data = response.data;
            var type = response.type;

            // add dashboards to list
            dashboards = [];
            var dashboardsLocal = [];

            function getUpdatedDashboardDetails(obj) {
                dashboardData.getComponent(obj.id).then(function (myres) {
                    var AllDashBuildsData = {};
                    var AllDashCommitsData = {};
                    //Updating Dashboard Data table details from widget
                    function updateDashboardDetailsForActiveWidgets(widgetName, widgetCompId) {
                        //Below Changes for getting Build Details
                        var DashBuilds = [];
                        function buildProcessResponse(data) {
                            var worker = {
                                averageBuildDuration: averageBuildDuration,
                                buildsPerDay: buildsPerDay,
                                latestBuilds: latestBuilds,
                                setDisplayToErrorState: setDisplayToErrorState,
                                totalBuilds: totalBuilds
                            };

                            //region web worker method implementations
                            function averageBuildDuration(data, buildThreshold, cb) {

                                cb({
                                    series: getSeries()
                                });

                                function getSeries() {
                                    var result = getPassFail(simplify(group(filter(data))));

                                    return [
                                        result.passed,
                                        result.failed
                                    ];
                                }

                                // filter to successful builds in the last 15 days
                                function filter(data) {
                                    return _.filter(data, function (item) {
                                        return item.buildStatus == 'Success' && Math.floor(moment(item.endTime).endOf('day').diff(moment(new Date()).endOf('day'), 'days')) >= -15;
                                    });
                                }

                                function group(data) {
                                    return _.groupBy(data, function (item) {
                                        return moment(item.endTime).format('L');
                                    });
                                }

                                function simplify(data) {
                                    // create array with date as the key and build duration times in an array
                                    var simplifiedData = {};
                                    _.forEach(data, function (buildDay, key) {
                                        if (!simplifiedData[key]) {
                                            simplifiedData[key] = [];
                                        }

                                        _.forEach(buildDay, function (build) {
                                            var duration = moment(build.endTime).diff(moment(build.startTime), 'seconds') / 60;
                                            simplifiedData[key].push(duration);
                                        });
                                    });

                                    return simplifiedData;
                                }

                                function getPassFail(simplifiedData) {
                                    // loop through all days in the past two weeks in case there weren't any builds
                                    // on that date
                                    var passed = [], failed = [];
                                    for (var x = 0; x <= 14; x++) {
                                        var date = moment(new Date()).subtract(x, 'days').format('L');
                                        var data = simplifiedData[date];

                                        // if date has no builds, add 0,0
                                        if (!data || !data.length) {
                                            passed.push(0);
                                            failed.push(0);
                                        }
                                        else {
                                            // calculate average and put in proper
                                            var avg = _(data).reduce(function (a, b) {
                                                return a + b;
                                            }) / data.length;

                                            if (avg > buildThreshold) {
                                                passed.push(0);
                                                failed.push(avg);
                                            }
                                            else {
                                                passed.push(avg);
                                                failed.push(0);
                                            }
                                        }
                                    }

                                    return {
                                        passed: passed.reverse(),
                                        failed: failed.reverse()
                                    };
                                }
                            }

                            function buildsPerDay(data, cb) {
                                var fifteenDays = toMidnight(new Date());
                                fifteenDays.setDate(fifteenDays.getDate() - 14);

                                cb({
                                    passed: countBuilds(all(data)),
                                    failed: countBuilds(failed(data))
                                });

                                function all(data) {
                                    return _.filter(data, function (build) {
                                        return build.endTime >= fifteenDays.getTime() && (build.buildStatus !== 'InProgress');
                                    });
                                }

                                function failed(data) {
                                    return _.filter(data, function (build) {
                                        return build.endTime >= fifteenDays.getTime() && (build.buildStatus !== 'Success') && (build.buildStatus !== 'InProgress');
                                    });
                                }

                                function countBuilds(data) {
                                    var counts = [];
                                    var dt = new Date(fifteenDays.getTime());
                                    var grouped = _.groupBy(data, function (build) {
                                        return toMidnight(new Date(build.endTime)).getTime();
                                    });

                                    _.times(15, function () {
                                        var count = grouped[dt.getTime()] ? grouped[dt.getTime()].length : 0;
                                        counts.push(count);
                                        dt.setDate(dt.getDate() + 1);
                                    });

                                    return counts;
                                }


                                function toMidnight(date) {
                                    date.setHours(0, 0, 0, 0);
                                    return date;
                                }
                            }

                            function latestBuilds(data, cb) {
                                // order by end time and limit to last 5
                                data = _.sortBy(data, 'endTime').reverse().slice(0, 5);

                                // loop and convert time to readable format
                                data = _.map(data, function (item) {
                                    return {
                                        status: item.buildStatus.toLowerCase(),
                                        number: item.number,
                                        endTime: item.endTime,
                                        url: item.buildUrl
                                    };
                                });

                                cb(data);
                            }

                            function setDisplayToErrorState(data, failureThreshold, cb) {
                                // order by end time and limit to last 5
                                data = _.sortBy(data, 'endTime').reverse().slice(0, failureThreshold);
                                data = _.filter(data, function (item) {
                                    return (item.buildStatus.toLowerCase() != 'success') && (item.buildStatus.toLowerCase() != 'inprogress');
                                });

                                cb(data && data.length >= failureThreshold);
                            }

                            function totalBuilds(data, cb) {
                                var today = toMidnight(new Date());
                                var sevenDays = toMidnight(new Date());
                                var fourteenDays = toMidnight(new Date());

                                sevenDays.setDate(sevenDays.getDate() - 7);
                                fourteenDays.setDate(fourteenDays.getDate() - 14);

                                cb({
                                    today: countToday(),
                                    sevenDays: countSevenDays(),
                                    fourteenDays: countFourteenDays()
                                });

                                function countToday() {
                                    return _.filter(data, function (build) {
                                        return build.endTime >= today.getTime();
                                    }).length;
                                }

                                function countSevenDays() {
                                    return _.filter(data, function (build) {
                                        return build.endTime >= sevenDays.getTime();
                                    }).length;
                                }

                                function countFourteenDays() {
                                    return _.filter(data, function (build) {
                                        return build.endTime >= fourteenDays.getTime();
                                    }).length;
                                }

                                function toMidnight(date) {
                                    date.setHours(0, 0, 0, 0);
                                    return date;
                                }
                            }
                            //endregion

                            //region web worker calls
                            // call to webworker methods nad set the controller variables with the processed values
                            worker.buildsPerDay(data, function (data) {
                                //$scope.$apply(function () {

                                var labels = [];
                                _(data.passed).forEach(function () {
                                    labels.push(1);
                                });

                                ctrl.DashlineData = {
                                    labels: labels,
                                    series: [{
                                        name: 'success',
                                        data: data.passed
                                    }, {
                                        name: 'failures',
                                        data: data.failed
                                    }]
                                };
                                //});
                            });

                            worker.latestBuilds(data, function (buildsToDisplay) {
                                //$scope.$apply(function () {
                                ctrl.DashrecentBuilds = buildsToDisplay;
                                
                                //});
                            });

                            worker.averageBuildDuration(data, 3, function (buildDurationData) {
                                //$scope.$apply(function () {
                                var labels = [];
                                _(buildDurationData.series[0]).forEach(function () {
                                    labels.push('');
                                });
                                buildDurationData.labels = labels;
                                //_(buildDurationData.series).forEach
                                ctrl.DashbuildDurationData = buildDurationData;
                                //});
                            });

                            worker.setDisplayToErrorState(data, 3, function (displayAsErrorState) {
                                //$scope.$apply(function () {
                                //$scope.display = displayAsErrorState ? DisplayState.ERROR : DisplayState.DEFAULT;
                                //});
                            });

                            worker.totalBuilds(data, function (data) {
                                //$scope.$apply(function () {
                                ctrl.DashtotalBuildsYesterday = data.today;
                                ctrl.DashtotalBuildsLastWeek = data.sevenDays;
                                AllDashBuildsData.DashtotalBuildsLastWeek = data.sevenDays;
                                ctrl.DashtotalBuildsLastMonth = data.fourteenDays;
                                //});
                            });
                            //endregion
                        }
                        //Getting Build Details End
                        //Below Changes for getting Repo details
                        ctrl.commits = [];
                        ctrl.pulls = [];
                        ctrl.issues = [];
                        var commits = [];
                        var groupedCommitData = [];
                        function processCommitResponse(data, numberOfDays) {
                            commits = [];
                            groupedCommitData = [];
                            // get total commits by day
                            var groups = _(data).sortBy('timestamp')
                                .groupBy(function (item) {
                                    return -1 * Math.floor(moment.duration(moment().diff(moment(item.scmCommitTimestamp))).asDays());
                                }).value();
                
                            for (var x = -1 * numberOfDays + 1; x <= 0; x++) {
                                if (groups[x]) {
                                    commits.push(groups[x].length);
                                    groupedCommitData.push(groups[x]);
                                }
                                else {
                                    commits.push(0);
                                    groupedCommitData.push([]);
                                }
                            }
                            var labels = [];
                            _(commits).forEach(function (c) {
                                labels.push('');
                            });
                            //update charts
                            if (commits.length)
                            {
                                // ctrl.commitChartData = {
                                //     series: [commits],
                                //     labels: labels
                                // };
                            }
                            // ctrl.combinedChartData = {
                            //     labels: labels,
                            //     series: [{
                            //         name: 'commits',
                            //         data: commits
                            //     }, {
                            //         name: 'pulls',
                            //         data: pulls
                            //     }, {
                            //         name: 'issues',
                            //         data: issues
                            //     }]
                            // };
                
                            // group get total counts and contributors
                            var today = toMidnight(new Date());
                            var sevenDays = toMidnight(new Date());
                            var fourteenDays = toMidnight(new Date());
                            var thirtyDays = toMidnight(new Date());
                            var fiveDays = today;
                            sevenDays.setDate(sevenDays.getDate() - 7);
                            fourteenDays.setDate(fourteenDays.getDate() - 14);
                            thirtyDays.setDate(thirtyDays.getDate()-30);
                            fiveDays.setDate(fiveDays.getDate()-5);
                
                            var lastDayCommitCount = 0;
                            var lastDayCommitContributors = [];
                
                            var lastSevenDayCommitCount = 0;
                            var lastSevenDaysCommitContributors = [];
                
                            var lastFourteenDayCommitCount = 0;
                            var lastFourteenDaysCommitContributors = [];

                            var lastThirtyDaysCommitCount = 0;
                            var lastThirtyDaysCommitDetails = [];
                            var newCommitDate = [];
                            var lastFiveDaysCommitDetails = [];
                
                            // loop through and add to counts
                            _(data).forEach(function (commit) {
                                if(commit.scmCommitTimestamp >= today.getTime()) {
                                    lastDayCommitCount++;
                
                                    if(lastDayCommitContributors.indexOf(commit.scmAuthor) == -1) {
                                        lastDayCommitContributors.push(commit.scmAuthor);
                                    }
                                }
                                if(commit.scmCommitTimestamp >= thirtyDays.getTime()){
                                    lastThirtyDaysCommitCount++;
                                    if(newCommitDate.indexOf(moment(commit.scmCommitTimestamp).format('ll'))>-1){
                                        lastThirtyDaysCommitCount++;
                                        _(lastThirtyDaysCommitDetails).forEach(function(value){ 
                                            if(value.CommitDate === moment(commit.scmCommitTimestamp).format('ll')){                                              
                                            value.CommitsCount = lastThirtyDaysCommitCount
                                            }
                                        });
                                    }else {                                          
                                        lastThirtyDaysCommitCount = 0;
                                        lastThirtyDaysCommitCount++;
                                    newCommitDate.push(moment(commit.scmCommitTimestamp).format('ll'));                                      
                                    lastThirtyDaysCommitDetails.push({
                                        "CommitDate":moment(commit.scmCommitTimestamp).format('ll'),
                                        "CommitsCount": lastThirtyDaysCommitCount
                                    });
                                    }
                                   
                                }
                                lastFiveDaysCommitDetails = lastThirtyDaysCommitDetails;
                                lastFiveDaysCommitDetails = lastFiveDaysCommitDetails.slice((lastFiveDaysCommitDetails.length - 5), lastFiveDaysCommitDetails.length);
                                if(commit.scmCommitTimestamp >= sevenDays.getTime()) {
                                    lastSevenDayCommitCount++;
                
                                    if(lastSevenDaysCommitContributors.indexOf(commit.scmAuthor) == -1) {
                                        lastSevenDaysCommitContributors.push(commit.scmAuthor);
                                    }
                                }
                
                                if(commit.scmCommitTimestamp >= fourteenDays.getTime()) {
                                    lastFourteenDayCommitCount++;
                                    ctrl.commits.push(commit);
                                    if(lastFourteenDaysCommitContributors.indexOf(commit.scmAuthor) == -1) {
                                        lastFourteenDaysCommitContributors.push(commit.scmAuthor);
                                    }
                                }
                            });
                
                            ctrl.lastDayCommitCount = lastDayCommitCount;
                            ctrl.lastDayCommitContributorCount = lastDayCommitContributors.length;
                            ctrl.lastSevenDaysCommitCount = lastSevenDayCommitCount;
                            //console.log("ctrl.lastSevenDaysCommitCount is : ",ctrl.lastSevenDaysCommitCount);
                            //console.log("Avg Dailey Change is : ",Math.ceil(7/ctrl.lastSevenDaysCommitCount));
                            ctrl.lastSevenDaysCommitContributorCount = lastSevenDaysCommitContributors.length;
                            ctrl.lastFourteenDaysCommitCount = lastFourteenDayCommitCount;
                            ctrl.lastFourteenDaysCommitContributorCount = lastFourteenDaysCommitContributors.length;
                            AllDashCommitsData.lastSevenDaysCommitCount = lastSevenDayCommitCount;
                            AllDashCommitsData.lastDayCommitCount = lastDayCommitCount;
                            AllDashCommitsData.lastFiveDaysCommitDetails = lastFiveDaysCommitDetails;
                            AllDashCommitsData.avgDailyChange = (ctrl.lastSevenDaysCommitCount !== '' && ctrl.lastSevenDaysCommitCount !== null && ctrl.lastSevenDaysCommitCount !== undefined && ctrl.lastSevenDaysCommitCount !== 0)
                                                                ?((Math.ceil(7/ctrl.lastSevenDaysCommitCount)>1)?(Math.ceil(7/ctrl.lastSevenDaysCommitCount)+" Days"):(Math.ceil(7/ctrl.lastSevenDaysCommitCount)+" Day"))
                                                                :0+" Days";

                
                            function toMidnight(date) {
                                date.setHours(0, 0, 0, 0);
                                return date;
                            }
                        }
                
                        //Getting Repo Details End
                        switch (widgetName) {
                            case 'build':
                                var params = {
                                    componentId: widgetCompId,
                                    numberOfDays: 15
                                };
                                buildData.details(params).then(function (data) {
                                    DashBuilds = data.result;
                                    buildProcessResponse(DashBuilds);
                                });
                                break;
                            case 'codeanalysis':
                                break;
                            case 'repo':
                                var params = {
                                    componentId: widgetCompId,
                                    numberOfDays: 14
                                };
                    
                                codeRepoData.details(params).then(function (data) {
                                    processCommitResponse(data.result, params.numberOfDays);
                                    ctrl.lastUpdated = data.lastUpdated;
                                });
                                break;
                            case 'tdp':
                                break;
                            case 'deploy':
                                break;
                            default:
                                break;
                        }
                    }
                    for (var z = 0; z < myres.activeWidgets.length; z++) {
                        updateDashboardDetailsForActiveWidgets(myres.activeWidgets[z], myres.application.components[0].id);
                        if(z===myres.activeWidgets.length-1){
                            var board = {
                                id: obj.id,
                                name: dashboardService.getDashboardTitle(obj),
                                type: obj.type,
                                validServiceName: obj.validServiceName,
                                validAppName: obj.validAppName,
                                configurationItemBusServName: obj.configurationItemBusServName,
                                configurationItemBusAppName: obj.configurationItemBusAppName,
                                isProduct: obj.type && obj.type.toLowerCase() === DashboardType.PRODUCT.toLowerCase(),
                                scoreEnabled: obj.scoreEnabled,
                                scoreDisplay: obj.scoreDisplay,
                                totalBuildsLastWeek: (AllDashBuildsData !== undefined && AllDashBuildsData !== null && AllDashBuildsData !=='')?AllDashBuildsData:0,
                                totalCommitsLastWeek: AllDashCommitsData
                            };
        
                            if (board.isProduct) {
                                //console.log(board);
                            }
                            dashboardsLocal.push(board);
                        }
                    }

                   

                });
            }
            angular.forEach(data, function (value, key) {
                //showErrorVal = getInvalidAppOrCompError(value);
                getUpdatedDashboardDetails(value);
            })
            dashboards = dashboardsLocal;
            dashboardData.count(type).then(function (data) {
                totalItems = data;
            });

            return dashboardsLocal;
        }

        this.processDashboardFilterResponse = function (response) {
            var data = response.data;
            var type = response.type;

            dashboards = [];
            var dashboardsLocal = [];

            for (var x = 0; x < data.length; x++) {
                var board = {
                    id: data[x].id,
                    name: dashboardService.getDashboardTitle(data[x]),
                    isProduct: data[x].type && data[x].type.toLowerCase() === DashboardType.PRODUCT.toLowerCase()
                };

                if (board.isProduct) {
                    //console.log(board);
                }
                dashboardsLocal.push(board);
            }

            dashboards = dashboardsLocal;
            if (searchFilter == "") {
                dashboardData.count(type).then(function (data) {
                    totalItems = data;
                });
            }

            return dashboardsLocal;
        }

        this.processDashboardError = function (data) {
            dashboards = [];
            return dashboards;
        }

        this.processMyDashboardResponse = function (response) {
            var mydata = response.data;
            var type = response.type;

            // add dashboards to list
            mydash = [];
            var dashboardsLocal = [];

            for (var x = 0; x < mydata.length; x++) {
                var showErrorVal = getInvalidAppOrCompError(mydata[x]);
                dashboardsLocal.push({
                    id: mydata[x].id,
                    name: dashboardService.getDashboardTitle(mydata[x]),
                    type: mydata[x].type,
                    isProduct: mydata[x].type && mydata[x].type.toLowerCase() === DashboardType.PRODUCT.toLowerCase(),
                    validServiceName: mydata[x].validServiceName,
                    validAppName: mydata[x].validAppName,
                    configurationItemBusServName: mydata[x].configurationItemBusServName,
                    configurationItemBusAppName: mydata[x].configurationItemBusAppName,
                    showError: showErrorVal,
                    scoreEnabled: mydata[x].scoreEnabled,
                    scoreDisplay: mydata[x].scoreDisplay
                });
            }

            mydash = dashboardsLocal;
            dashboardData.myDashboardsCount(type).then(function (data) {
                totalItemsMyDash = data;
            });


            return dashboardsLocal;
        }

        this.processFilterMyDashboardResponse = function (response) {
            var mydata = response.data;
            var type = response.type;

            // add dashboards to list
            mydash = [];
            var dashboardsLocal = [];

            for (var x = 0; x < mydata.length; x++) {
                var showErrorVal = getInvalidAppOrCompError(mydata[x]);
                dashboardsLocal.push({
                    id: mydata[x].id,
                    name: dashboardService.getDashboardTitle(mydata[x]),
                    type: mydata[x].type,
                    isProduct: mydata[x].type && mydata[x].type.toLowerCase() === DashboardType.PRODUCT.toLowerCase(),
                    validServiceName: mydata[x].validServiceName,
                    validAppName: mydata[x].validAppName,
                    configurationItemBusServName: mydata[x].configurationItemBusServName,
                    configurationItemBusAppName: mydata[x].configurationItemBusAppName,
                    showError: showErrorVal,
                    scoreEnabled: mydata[x].scoreEnabled,
                    scoreDisplay: mydata[x].scoreDisplay
                });
            }

            mydash = dashboardsLocal;
            if (searchFilter == "") {
                dashboardData.myDashboardsCount(type).then(function (data) {
                    totalItemsMyDash = data;
                });
            }

            return dashboardsLocal;
        }

        this.processMyDashboardError = function (data) {
            mydash = [];
            return mydash;
        }

        this.filterByTitle = function (title, type) {
            currentPage = 0;
            currentPageMyDash = 0;
            searchFilter = title;
            var promises = [];

            if (title == "") {
                promises.push(dashboardData.searchByPage({ "search": '', "type": type, "size": pageSize, "page": 0 })
                    .then(this.processDashboardResponse, this.processDashboardError));

                promises.push(dashboardData.searchMyDashboardsByPage({ "username": username, "type": type, "size": pageSize, "page": 0 })
                    .then(this.processMyDashboardResponse, this.processMyDashboardError));
            } else {
                promises.push(dashboardData.filterCount(title, type).then(function (data) { totalItems = data; }));

                promises.push(dashboardData.filterByTitle({ "search": title, "type": type, "size": pageSize, "page": 0 })
                    .then(this.processDashboardFilterResponse, this.processDashboardError));

                promises.push(dashboardData.filterMyDashboardCount(title, type).then(function (data) { totalItemsMyDash = data; }));

                promises.push(dashboardData.filterMyDashboardsByTitle({ "search": title, "type": type, "size": pageSize, "page": 0 })
                    .then(this.processFilterMyDashboardResponse, this.processMyDashboardError));
            }

            return promises;
        }

    }
})();
