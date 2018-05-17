(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .service('paginationWrapperService', paginationWrapperService);
    paginationWrapperService.$inject = ['$q', 'DashboardType', 'dashboardData', 'dashboardService', 'userService', '$http', 'buildData', '$rootScope', 'codeRepoData', 'codeTdpData'];

    function paginationWrapperService($q, DashboardType, dashboardData, dashboardService, userService, $http, buildData, $rootScope, codeRepoData, codeTdpData) {
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
                    var AllDashDefectsData = {};
                    AllDashDefectsData.defectsCount = '';
                    AllDashDefectsData.last7DaysDefectCount = '';
                    AllDashDefectsData.todayDefectCount = '';
                    AllDashDefectsData.trendingData = {};
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
                                var getAllBuildsStatus = '';
                                var twentyOneDays = toMidnight(new Date());

                                sevenDays.setDate(sevenDays.getDate() - 7);
                                fourteenDays.setDate(fourteenDays.getDate() - 14);
                                twentyOneDays.setDate(twentyOneDays.getDate() - 21);

                                cb({
                                    today: countToday(),
                                    sevenDays: countSevenDays(),
                                    fourteenDays: countFourteenDays(),
                                    getAllBuildsSuccessData: getBuildsSuccessData(),
                                    getAllBuildsStatusDetails: getBuildStatusDetails(),
                                    getAllBuildsDetails: getAllBuildsData()
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
                                function getAllBuildsData() {
                                    return _.filter(data, function (build) {
                                        return build.endTime <= today.getTime();
                                    })
                                }
                                function getBuildsSuccessData() {
                                    return _.filter(data, function (build) {
                                        return build.buildStatus !== "Failure";
                                    });
                                }
                                function getBuildStatusDetails() {
                                    var lastBuildAvailable = false;
                                    var currentData = _.filter(data, function (build) {
                                        build.timeDuration = 7;
                                        return build.endTime >= sevenDays.getTime();
                                    });
                                    if (getStatusDetails(currentData) !== 2) {
                                        currentData = _.filter(data, function (build) {
                                            build.timeDuration = 14;
                                            return build.endTime >= fourteenDays.getTime();
                                        });
                                        if (getStatusDetails(currentData) !== 2) {
                                            currentData = _.filter(data, function (build) {
                                                build.timeDuration = 21;
                                                return build.endTime >= twentyOneDays.getTime();
                                            });
                                            if (getStatusDetails(currentData) !== 2) {
                                                return { status: "Failed" };
                                            } else {
                                                var updatedData = _.filter(currentData, function (build) {
                                                    return build.buildStatus !== "Failure";
                                                });
                                                _(updatedData).forEach(function (build) {
                                                    if (build.number !== data[data.length - 1].number) {
                                                        lastBuildAvailable = true;
                                                    }
                                                });
                                                if (lastBuildAvailable) {
                                                    updatedData.push(data[data.length - 1]);
                                                }
                                                return updatedData;
                                            }
                                        } else {
                                            var updatedData = _.filter(currentData, function (build) {
                                                return build.buildStatus !== "Failure";
                                            });
                                            _(updatedData).forEach(function (build) {
                                                if (build.number !== data[data.length - 1].number) {
                                                    lastBuildAvailable = true;
                                                }
                                            });
                                            if (lastBuildAvailable) {
                                                updatedData.push(data[data.length - 1]);
                                            }
                                            return updatedData;
                                        }
                                    } else {
                                        var updatedData = _.filter(currentData, function (build) {
                                            return build.buildStatus !== "Failure";
                                        });
                                        _(updatedData).forEach(function (build) {
                                            if (build.number !== data[data.length - 1].number) {
                                                lastBuildAvailable = true;
                                            }
                                        });
                                        if (lastBuildAvailable) {
                                            updatedData.push(data[data.length - 1]);
                                        }
                                        return updatedData;
                                    }
                                }

                                //Below changes for checking build status
                                function getStatusDetails(obj) {
                                    var status1 = 0;
                                    var status2 = 0;
                                    var statusTot = 0;
                                    _(obj).forEach(function (buildItem, index) {
                                        if (buildItem.buildStatus === 'Success') {
                                            status1 = 1;
                                        } else if (buildItem.buildStatus === 'Failure') {
                                            status2 = 1;
                                        }
                                    });
                                    statusTot = status1 + status2;
                                    return statusTot;
                                }
                            }
                            //endregion
                            //For calculating Date difference
                            function calculateDays(startDate, endDate) {
                                var start_date = moment(startDate, 'YYYY-MM-DD HH:mm:ss');
                                var end_date = moment(endDate, 'YYYY-MM-DD HH:mm:ss');
                                //var duration = moment.duration(end_date.diff(start_date));
                                var startArr = startDate.split("/");
                                var endArr = endDate.split("/");
                                var a = moment([parseInt(startArr[2]), parseInt(startArr[0]), parseInt(startArr[1])]);
                                var b = moment([parseInt(endArr[2]), parseInt(endArr[0]), parseInt(endArr[1])]);
                                var days = b.diff(a, 'days');
                                // var days = duration.asDays();
                                 return days;
                            }
                            //For Reformating data from json data for displaying text in Tabular content
                            function reformattingObject(obj) {
                                var updatedObject = [];
                                _(obj).forEach(function (build) {
                                    updatedObject.push({
                                        recentBuild: {
                                            buildId: build.number,
                                            buildStatus: build.status,
                                            buildTime: moment(build.endTime).minutes() + " Mins",
                                            buildUrl: build.buildUrl
                                        }
                                    });
                                });
                                return updatedObject;
                            }
                            //Get Mean Time To Resolved Details 
                            function getMeanTimeResolvedData(successObject, BuildsData) {
                                var meanTimeTotal = 0;
                                var timeDuration = 0;
                                var count = 0;
                                if (successObject.status !== "Failed") {
                                    for (var i = 0; i <= successObject.length - 1; i++) {
                                        timeDuration = successObject[i].timeDuration;
                                        var endTime1 = successObject[i].endTime;
                                        if (successObject[i + 1] != undefined) {
                                            var endTime2 = (successObject[i + 1] === undefined) ? successObject[i].endTime : successObject[i + 1].endTime;
                                            if (endTime1 !== undefined && endTime2 !== undefined) {
                                                count += 1;
                                                meanTimeTotal += calculateDays(moment(endTime1).format('L'), moment(endTime2).format('L'));
                                            } else {
                                                meanTimeTotal += 0;
                                            }

                                        }
                                    }
                                } else {
                                    meanTimeTotal = 0;
                                }
                                if (meanTimeTotal !== 0 && count !== 0) {
                                    return Math.ceil(meanTimeTotal / count);
                                } else {
                                    return 0;
                                }

                            }
                            //Get latest build status
                            function getLastBuildStatus(obj) {
                                if (obj.length !== 0) {
                                    if (obj[obj.length - 1].buildStatus === "Success") {
                                        return "Success";
                                    }
                                    if (obj[obj.length - 1].buildStatus === "Failure") {
                                        return "Failure";
                                    }
                                } else {
                                    return 0;
                                }
                            }
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
                                AllDashBuildsData.AllSuccessBuilds = data.getAllBuildsSuccessData;
                                AllDashBuildsData.AllSuccessBuilds = AllDashBuildsData.AllSuccessBuilds.slice((AllDashBuildsData.AllSuccessBuilds.length - 2), AllDashBuildsData.AllSuccessBuilds.length);
                                AllDashBuildsData.latestBuildsData = reformattingObject(ctrl.DashrecentBuilds);
                                AllDashBuildsData.last2SuccessBuilds = {
                                    recentBuild: {
                                        buildId: '',
                                        buildStatus: '',
                                        buildTime: '',
                                        buildUrl: ''
                                    },
                                    recentBuildNext: {
                                        buildId: '',
                                        buildStatus: '',
                                        buildTime: '',
                                        buildUrl: ''
                                    }
                                };
                                AllDashBuildsData.last2SuccessBuilds.recentBuild.buildId = (AllDashBuildsData.AllSuccessBuilds.length !== 0 && AllDashBuildsData.AllSuccessBuilds[1].number !== undefined && AllDashBuildsData.AllSuccessBuilds[1].number !== '') ? AllDashBuildsData.AllSuccessBuilds[1].number : 0;
                                AllDashBuildsData.last2SuccessBuilds.recentBuild.buildStatus = "Success";
                                AllDashBuildsData.last2SuccessBuilds.recentBuild.buildTime = (AllDashBuildsData.AllSuccessBuilds.length !== 0) ? moment.duration(AllDashBuildsData.AllSuccessBuilds[1].duration).minutes() + " Mins" : 0;
                                AllDashBuildsData.last2SuccessBuilds.recentBuild.buildUrl = (AllDashBuildsData.AllSuccessBuilds.length !== 0) ? AllDashBuildsData.AllSuccessBuilds[1].buildUrl : 0;
                                AllDashBuildsData.last2SuccessBuilds.recentBuildNext.buildId = (AllDashBuildsData.AllSuccessBuilds.length !== 0) ? AllDashBuildsData.AllSuccessBuilds[0].number : 0;
                                AllDashBuildsData.last2SuccessBuilds.recentBuildNext.buildStatus = "Success";
                                AllDashBuildsData.last2SuccessBuilds.recentBuildNext.buildTime = (AllDashBuildsData.AllSuccessBuilds.length !== 0) ? moment.duration(AllDashBuildsData.AllSuccessBuilds[0].duration).minutes() + " Mins" : 0;
                                AllDashBuildsData.last2SuccessBuilds.recentBuildNext.buildUrl = (AllDashBuildsData.AllSuccessBuilds.length !== 0) ? AllDashBuildsData.AllSuccessBuilds[1].buildUrl : 0;
                                //For Getting time difference from last successful commits
                                AllDashBuildsData.meanTime2Resolved = getMeanTimeResolvedData(data.getAllBuildsStatusDetails, data.getAllBuildsDetails) + " Days";
                                AllDashBuildsData.lastBuildStatus = getLastBuildStatus(data.getAllBuildsDetails);
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
                            if (commits.length) {
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
                            sevenDays.setDate(sevenDays.getDate() - 7);
                            fourteenDays.setDate(fourteenDays.getDate() - 14);
                            thirtyDays.setDate(thirtyDays.getDate() - 30);

                            var lastDayCommitCount = 0;
                            var lastDayCommitContributors = [];

                            var lastSevenDayCommitCount = 0;
                            var lastSevenDaysCommitContributors = [];

                            var lastFourteenDayCommitCount = 0;
                            var lastFourteenDaysCommitContributors = [];
                            //testing 7 days data 
                            var testing7days = [];
                            var lastSevenDaysCommitDetails = [];
                            //Todo : set commit url to commits from "scmUrl"

                            // loop through and add to counts
                            _(data).forEach(function (commit) {
                                if (commit.scmCommitTimestamp >= today.getTime()) {
                                    lastDayCommitCount++;

                                    if (lastDayCommitContributors.indexOf(commit.scmAuthor) == -1) {
                                        lastDayCommitContributors.push(commit.scmAuthor);
                                    }
                                }

                                if (commit.scmCommitTimestamp >= sevenDays.getTime()) {
                                    lastSevenDayCommitCount++;

                                    if (lastSevenDaysCommitContributors.indexOf(commit.scmAuthor) == -1) {
                                        lastSevenDaysCommitContributors.push(commit.scmAuthor);
                                    }
                                    if (testing7days.indexOf(moment(commit.scmCommitTimestamp).format('ll')) > -1) {
                                        _(lastSevenDaysCommitDetails).forEach(function (value) {
                                            if (value.CommitDate === moment(commit.scmCommitTimestamp).format('ll')) {
                                                value.CommitCount += 1;
                                                value.Commit.push(commit);
                                            }
                                        });
                                    } else {
                                        testing7days.push(moment(commit.scmCommitTimestamp).format('ll'));
                                        lastSevenDaysCommitDetails.push({
                                            "CommitDate": moment(commit.scmCommitTimestamp).format('ll'),
                                            "CommitCount": lastSevenDayCommitCount,
                                            "Commit": [commit]
                                        });
                                    }
                                } else {
                                }
                                if (commit.scmCommitTimestamp >= fourteenDays.getTime()) {
                                    lastFourteenDayCommitCount++;
                                    ctrl.commits.push(commit);
                                    if (lastFourteenDaysCommitContributors.indexOf(commit.scmAuthor) == -1) {
                                        lastFourteenDaysCommitContributors.push(commit.scmAuthor);
                                    }
                                }
                            });
                            ctrl.lastDayCommitCount = lastDayCommitCount;
                            ctrl.lastDayCommitContributorCount = lastDayCommitContributors.length;
                            ctrl.lastSevenDaysCommitCount = lastSevenDayCommitCount;
                            ctrl.lastSevenDaysCommitContributorCount = lastSevenDaysCommitContributors.length;
                            ctrl.lastFourteenDaysCommitCount = lastFourteenDayCommitCount;
                            ctrl.lastFourteenDaysCommitContributorCount = lastFourteenDaysCommitContributors.length;
                            AllDashCommitsData.lastSevenDaysCommitCount = lastSevenDayCommitCount;
                            AllDashCommitsData.lastDayCommitCount = lastDayCommitCount;
                            AllDashCommitsData.lastSevenDaysCommitDetails = lastSevenDaysCommitDetails;
                            AllDashCommitsData.avgDailyChange = (ctrl.lastSevenDaysCommitCount !== '' && ctrl.lastSevenDaysCommitCount !== null && ctrl.lastSevenDaysCommitCount !== undefined && ctrl.lastSevenDaysCommitCount !== 0)
                                ? ((Math.ceil(7 / ctrl.lastSevenDaysCommitCount) > 1) ? (Math.ceil(7 / ctrl.lastSevenDaysCommitCount) + " Days") : (Math.ceil(7 / ctrl.lastSevenDaysCommitCount) + " Day"))
                                : 0 + " Days";

                            function toMidnight(date) {
                                date.setHours(0, 0, 0, 0);
                                return date;
                            }
                        }
                        //Changes for TDP details
                        function processDefectResponse(data) {
                            var today = toMidnight(new Date());
                            var avgDefectDetails = {
                                avgDefectData: []
                            };

                            var lastDefectAvailable = false;
                            AllDashDefectsData.defectsCount = 0;
                            AllDashDefectsData.last7DaysDefectCount = 0;
                            AllDashDefectsData.todayDefectCount = 0;
                            AllDashDefectsData.trendingData.last7DaysDefects = [];
                            AllDashDefectsData.avgDailyChange = 0;
                            AllDashDefectsData.defectTdpUrl = "#";
                            if (data.result !== undefined && data.result.length !== 0 && data.result.length !== undefined) {
                                var count = 0;
                                _(data.result[0].defectAnalysis.severities.info).forEach(function (val, key) {
                                    count += parseInt(val);
                                });
                                AllDashDefectsData.defectsCount = count;
                                AllDashDefectsData.last7DaysDefectCount = _.filter(data.result[0].defectAnalysis.detail, function (defect) {
                                    return defect.age < 7;
                                }).length;
                                var testingDefectDetails = [];
                                var groupBy = function (xs, key) {
                                    return xs.reduce(function (rv, x) {
                                        (rv[x[key]] = rv[x[key]] || []).push(x);
                                        return rv;
                                    }, {});
                                };
                                
                                var groubedByAge = groupBy(data.result[0].defectAnalysis.detail, 'age');
                                var AgeingDetails = [];
                                var AgeingDetailsAll = [];
                                _(groubedByAge).forEach(function(val,key){
                                    AgeingDetails.push(parseInt(key));
                                });
                                for(var i=0;i <= AgeingDetails.length-1;i++){
                                    if(AgeingDetails.indexOf(i) !== -1){
                                        AgeingDetailsAll.push({
                                        "ageingDays":i,
                                        "value":groubedByAge[i],
                                        "ageingDate":moment().subtract(i, "days").format("DD-MM-YYYY")
                                    });
                                    }
                                }
                                AllDashDefectsData.todayDefectCount = _.filter(data.result[0].defectAnalysis.detail, function (defect) {
                                    return defect.age < 1;
                                }).length;
                                AllDashDefectsData.avgDailyChange = (AllDashDefectsData.last7DaysDefectCount !== '' && AllDashDefectsData.last7DaysDefectCount !== null && AllDashDefectsData.last7DaysDefectCount !== undefined && AllDashDefectsData.last7DaysDefectCount !== 0)
                                    ? ((Math.ceil(7 / AllDashDefectsData.last7DaysDefectCount) > 1) ? (Math.ceil(7 / AllDashDefectsData.last7DaysDefectCount) + " Days") : (Math.ceil(7 / AllDashDefectsData.last7DaysDefectCount) + " Day"))
                                    : 0 + " Days";
                                AllDashDefectsData.defectTdpUrl = data.result[0].queryURL;
                                // }
                                AllDashDefectsData.trendingData.last7DaysDefects = AgeingDetailsAll;
                            } else {
                                //console.log("Defect Response error");
                            }
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
                                var params = {
                                    componentId: widgetCompId
                                };
                                codeTdpData.details(params).then(function (data) {
                                    processDefectResponse(data);
                                    ctrl.lastUpdated = data.lastUpdated;
                                });
                                break;
                            case 'deploy':
                                break;
                            default:
                                break;
                        }
                    }
                    for (var z = 0; z < myres.activeWidgets.length; z++) {
                        updateDashboardDetailsForActiveWidgets(myres.activeWidgets[z], myres.application.components[0].id);

                        if (z === myres.activeWidgets.length - 1) {
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
                                totalBuildsLastWeek: (AllDashBuildsData !== undefined && AllDashBuildsData !== null && AllDashBuildsData !== '') ? AllDashBuildsData : 0,
                                totalCommitsLastWeek: AllDashCommitsData,
                                //totalDefectsCount: (AllDashDefectsData.defectsCount !== undefined && AllDashDefectsData.defectsCount !== '')?AllDashDefectsData.defectsCount:0
                                totalDefectsCount: AllDashDefectsData
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
