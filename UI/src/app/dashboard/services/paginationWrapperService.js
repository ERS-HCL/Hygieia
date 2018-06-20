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
                                        return build.buildStatus !== "Failure" && build.buildStatus !== "Aborted";
                                        //return build.buildStatus !== "Failure";
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
                                                return { "status": "Failed" };
                                            } else {
                                                var updatedData = _.filter(currentData, function (build) {
                                                    return build.buildStatus !== "Failure" && build.buildStatus !== 'Aborted';
                                                });
                                                return updatedData;
                                            }
                                        } else {
                                            var updatedData = _.filter(currentData, function (build) {
                                                return build.buildStatus !== "Failure" && build.buildStatus !== "Aborted";
                                            });
                                            return updatedData;
                                        }
                                    } else {
                                        var updatedData = _.filter(currentData, function (build) {
                                            return build.buildStatus !== "Failure" && build.buildStatus !== "Aborted";
                                        });
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
                                        } else if (buildItem.buildStatus === 'Failure' || buildItem.buildStatus === 'Aborted') {
                                            status2 = 1;
                                        }
                                    });
                                    statusTot = status1 + status2;
                                    return statusTot;
                                }
                            }
                            /**To CalculateHours With two timestamp value */
                            function calculateHours(startTimeStampInMS, endTimeStampInMS) {
                                var CurrentTimestamp = moment().valueOf();
                                endTimeStampInMS = (endTimeStampInMS !== 0) ? endTimeStampInMS : CurrentTimestamp;
                                // Build moment duration object
                                var duration = moment.duration(endTimeStampInMS - startTimeStampInMS);
                                // Format duration in HH:mm format
                                var Mhours = duration.days() * 24 + duration.hours();
                                var Mhours2Mins = (duration.days() * 24 + duration.hours()) * 60;
                                Mhours2Mins = Mhours2Mins + duration.minutes();
                                var MtotalHours = Mhours2Mins / 60;
                                return MtotalHours;
                            }
                            //For Reformating data from json data for displaying text in Tabular content
                            function reformattingObject(obj) {
                                var updatedObject = [];
                                _(obj).forEach(function (build) {
                                    updatedObject.push({
                                        recentBuild: {
                                            buildId: parseInt(build.number),
                                            buildStatus: build.status,
                                            buildTime: moment(build.endTime).minutes() + " Mins",
                                            buildUrl: build.url
                                        }
                                    });
                                });
                                return updatedObject;
                            }

                            //To get MEAN Time from new code
                            function getMeanTimeToRecovery(successObj, AllBuilds) {
                                var MEANtimeDuration = 0;
                                var i = 0;
                                var instanceCount = 0;
                                var MTTR = 0;
                                if (successObj.length !== 0) {
                                    if (successObj.length === 1) {
                                        var currentSuccessIteration = '';
                                        var getFailureTime = '';
                                        var getSuccessTime = '';
                                        var getSecondFailureTime = '';
                                        var getSecondSuccessTime = '';
                                        for (var t = 0; t <= AllBuilds.length - 1; t++) {
                                            if (AllBuilds[t].number === successObj[i].number) {
                                                currentSuccessIteration = t;
                                            }
                                        }
                                        for (var t = 0; t <= currentSuccessIteration; t++) {
                                            if (AllBuilds[t].buildStatus === "Failure" || AllBuilds[t].buildStatus === 'Aborted') {
                                                getFailureTime = AllBuilds[t].startTime;
                                            } else {
                                                getFailureTime = '';
                                            }
                                        }

                                        getSuccessTime = AllBuilds[currentSuccessIteration].endTime;
                                        if (getFailureTime !== '' && getSuccessTime !== '') {
                                            var a = calculateHours(getFailureTime, getSuccessTime);
                                            MEANtimeDuration += a;
                                            instanceCount += 1;
                                        }
                                        if (getFailureTime === '') {
                                            MEANtimeDuration = MEANtimeDuration;
                                            instanceCount += 1;
                                        }

                                        for (var t = currentSuccessIteration; t <= AllBuilds.length - 1; t++) {
                                            if (AllBuilds[t].buildStatus === "Failure" || AllBuilds[t].buildStatus === 'Aborted') {
                                                getSecondFailureTime = AllBuilds[t].startTime;
                                            } else {
                                                getSecondFailureTime = '';
                                            }
                                        }
                                        getSecondSuccessTime = moment().valueOf();
                                        if (getSecondFailureTime !== '' && getSecondSuccessTime !== '') {
                                            var a = calculateHours(getSecondFailureTime, getSecondSuccessTime);
                                            MEANtimeDuration += a;
                                            instanceCount += 1;
                                        }
                                        if (getSecondFailureTime === '') {
                                            MEANtimeDuration = MEANtimeDuration;
                                            instanceCount += 1;
                                        }


                                    } else {

                                        if (AllBuilds.length !== 0 && successObj.length >= 1) {
                                            for (i = successObj.length - 1; i >= 0; i--) {
                                                if (successObj[i - 1] !== undefined && (parseInt(successObj[i].number) !== parseInt(successObj[i - 1].number))) {

                                                    if (i === successObj.length - 1) {
                                                        var currentSuccessIteration = '';
                                                        var getFailureTime = '';
                                                        var getSuccessTime = '';
                                                        currentSuccessIteration = function () {
                                                            for (var t = 0; t <= AllBuilds.length - 1; t++) {
                                                                if (AllBuilds[t].number === successObj[i].number) {
                                                                    return t;
                                                                }
                                                            }
                                                        };
                                                        getFailureTime = function () {
                                                            for (var t = currentSuccessIteration(); t <= AllBuilds.length - 1; t++) {
                                                                if (AllBuilds[t].buildStatus === "Failure" || AllBuilds[t].buildStatus === 'Aborted') {
                                                                    return AllBuilds[t].startTime;
                                                                }
                                                            }
                                                            return '';
                                                        };
                                                        getSuccessTime = moment().valueOf();

                                                        if (getFailureTime() !== '' && getSuccessTime !== '') {

                                                            var a = calculateHours(getFailureTime(), getSuccessTime);
                                                            MEANtimeDuration += a;
                                                            instanceCount += 1;
                                                        }
                                                    }
                                                    if (successObj[i - 1] !== undefined && (parseInt(successObj[i].number) !== parseInt(successObj[i - 1].number))) {

                                                        var successBuildTime = successObj[i].endTime;
                                                        var failureBuildTime = '';
                                                        failureBuildTime = getFailureBuildTime(i, successObj, AllBuilds);

                                                        if (failureBuildTime !== "noData") {

                                                            var a = calculateHours(failureBuildTime, successBuildTime);
                                                            MEANtimeDuration += a;
                                                            instanceCount += 1;
                                                        } else {
                                                            MEANtimeDuration = MEANtimeDuration;
                                                            instanceCount += 1;
                                                        }
                                                    }
                                                } else {
                                                    console.log("Etry is  : ", successObj);
                                                }
                                            }
                                        } else {
                                            console.log("I am in here  man");
                                            MEANtimeDuration = MEANtimeDuration;
                                            instanceCount += 1;
                                        }
                                    }
                                    return getMTTRvalue(MEANtimeDuration, instanceCount);
                                } else if (successObj.status === "Failed" && AllBuilds.length !== 0) { //This else part getting MTTR value from initial failure Time

                                    var failureBuildTime = AllBuilds[0].startTime;
                                    var MTTR_Hours = calculateHours(failureBuildTime, 0);
                                    MEANtimeDuration += MTTR_Hours;
                                    instanceCount += 1;
                                    return getMTTRvalue(MEANtimeDuration, instanceCount);
                                } else if (successObj.status === "Failed" && AllBuilds.length === 0) {
                                    MEANtimeDuration = MEANtimeDuration;
                                    instanceCount += 1;
                                    return getMTTRvalue(MEANtimeDuration, instanceCount);
                                }

                            }

                            //To get MTTR Value
                            function getMTTRvalue(MEANtimeDuration, instanceCount) {
                                var MeantTimeToResolvedData = 0;
                                var MTTR = 0;
                                if (instanceCount !== 0) {
                                    MeantTimeToResolvedData = MEANtimeDuration / instanceCount;
                                    if (MeantTimeToResolvedData > 1) {
                                        MTTR = (MeantTimeToResolvedData * 60);
                                        var currentHours = (MTTR / 60).toFixed();
                                        if (currentHours > 24) {
                                            MTTR = ((currentHours / 24).toFixed()) + " Days " + ((currentHours % 24).toFixed()) + " Hours";
                                        } else if (currentHours < 25) {
                                            MTTR = currentHours + " Hours";
                                        }
                                        return MTTR;
                                    } else if (MeantTimeToResolvedData < 1) {
                                        MTTR = (MeantTimeToResolvedData * 60).toFixed() + " Mins";
                                        return MTTR;
                                    }
                                } else {
                                    console.log(" I will be return 'noData'");
                                    return "noData";
                                }
                            }

                            //Get FailureBuldTime
                            function getFailureBuildTime(i, successObj, AllBuilds) {
                                var j = '';
                                var k = '';
                                var l = '';
                                var getSuccessObj1 = '';
                                var getSuccessObj2 = '';
                                for (j = AllBuilds.length - 1; j >= 0; j--) {
                                    if (AllBuilds[j].id === successObj[i].id) {
                                        getSuccessObj1 = j;
                                    }
                                }
                                if (getSuccessObj1 !== '') {
                                    for (k = getSuccessObj1; k >= 0; k--) {
                                        if ((i - 1) !== -1) {
                                            if (AllBuilds[k].id === successObj[i - 1].id) {
                                                getSuccessObj2 = k;
                                            }
                                        }
                                    }
                                    if (getSuccessObj2 !== getSuccessObj1) {
                                        if (getSuccessObj1 !== getSuccessObj2 + 1) {
                                            for (l = getSuccessObj2 + 1; l < getSuccessObj1; l++) {
                                                if (AllBuilds[l].buildStatus === "Failure" || AllBuilds[l].buildStatus === 'Aborted') {
                                                    return AllBuilds[l].startTime;
                                                }
                                            }
                                        }
                                        if (getSuccessObj2 !== '' && (i - 1) !== -1) {
                                            var currentSuccessIteration = '';
                                            currentSuccessIteration = function () {
                                                for (var t = 0; t <= AllBuilds.length - 1; t++) {
                                                    if (AllBuilds[t].number === successObj[i].number) {
                                                        return t;
                                                    }
                                                }
                                            };
                                            for (var t = 0; t < currentSuccessIteration(); t++) {
                                                if (AllBuilds[t].buildStatus === "Failure" || AllBuilds[t].buildStatus === 'Aborted') {
                                                    return AllBuilds[t].startTime;
                                                }
                                            }
                                        }

                                    }
                                }
                            }
                            //Get latest build status
                            function getLastBuildStatus(obj) {
                                if (obj.length !== 0) {
                                    if (obj[obj.length - 1].recentBuild.buildStatus === "success") {
                                        return "Success";
                                    }

                                    if (obj[obj.length - 1].recentBuild.buildStatus === "failure") {
                                        return "Failure";
                                    }
                                    
                                    if (obj[obj.length - 1].recentBuild.buildStatus === "aborted") {
                                        return "Aborted";
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
                                AllDashBuildsData.latestBuildsData = (AllDashBuildsData.latestBuildsData).sort(function (obj1, obj2) {
                                    // Ascending: first age less than the previous
                                    //return parseInt(obj1.recentBuild.buildId) - parseInt(obj2.recentBuild.buildId);
                                    return obj1.recentBuild.buildId - obj2.recentBuild.buildId;
                                });
                                AllDashBuildsData.lastBuildStatus = getLastBuildStatus(AllDashBuildsData.latestBuildsData);
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
                                /*To get recent Builds Details from all builds details*/
                                AllDashBuildsData.last2SuccessBuilds.recentBuild.buildId = (
                                    AllDashBuildsData.latestBuildsData.length !== 0
                                    && AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 1].recentBuild.buildId !== undefined
                                    && AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 1].recentBuild.buildId !== '')
                                    ? AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 1].recentBuild.buildId
                                    : 0;
                                AllDashBuildsData.last2SuccessBuilds.recentBuild.buildStatus = (AllDashBuildsData.latestBuildsData.length !== 0
                                    && AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 1].recentBuild.buildStatus !== undefined
                                    && AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 1].recentBuild.buildStatus !== '')
                                    ? AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 1].recentBuild.buildStatus
                                    : 0;
                                AllDashBuildsData.last2SuccessBuilds.recentBuild.buildTime = (
                                    AllDashBuildsData.latestBuildsData.length !== 0
                                    && AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 1].recentBuild.buildTime !== undefined
                                    && AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 1].recentBuild.buildTime !== '')
                                    ? AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 1].recentBuild.buildTime
                                    : 0;
                                AllDashBuildsData.last2SuccessBuilds.recentBuild.buildUrl = (
                                    AllDashBuildsData.AllSuccessBuilds.length !== 0)
                                    ? AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 1].recentBuild.buildUrl
                                    : "#";
                                AllDashBuildsData.last2SuccessBuilds.recentBuildNext.buildId = (
                                    AllDashBuildsData.latestBuildsData.length === 2
                                    && AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 2].recentBuild.buildId !== undefined
                                    && AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 2].recentBuild.buildId !== '')
                                    ? AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 2].recentBuild.buildId
                                    : 0;
                                AllDashBuildsData.last2SuccessBuilds.recentBuildNext.buildStatus = (
                                    AllDashBuildsData.latestBuildsData.length === 2
                                    && AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 2].recentBuild.buildStatus !== undefined
                                    && AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 2].recentBuild.buildStatus !== '')
                                    ? AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 2].recentBuild.buildStatus
                                    : 0;
                                AllDashBuildsData.last2SuccessBuilds.recentBuildNext.buildTime = (
                                    AllDashBuildsData.latestBuildsData.length === 2
                                    && AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 2].recentBuild.buildTime !== undefined
                                    && AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 2].recentBuild.buildTime !== '')
                                    ? AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 2].recentBuild.buildTime
                                    : 0;
                                AllDashBuildsData.last2SuccessBuilds.recentBuildNext.buildUrl = (
                                    AllDashBuildsData.AllSuccessBuilds.length === 2)
                                    ? AllDashBuildsData.latestBuildsData[AllDashBuildsData.latestBuildsData.length - 2].recentBuild.buildUrl
                                    : "#";
                                AllDashBuildsData.meanTime2Resolved = getMeanTimeToRecovery(data.getAllBuildsStatusDetails, data.getAllBuildsDetails);

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
                            AllDashCommitsData.avgDailyChange = (
                                ctrl.lastSevenDaysCommitCount !== ''
                                && ctrl.lastSevenDaysCommitCount !== null
                                && ctrl.lastSevenDaysCommitCount !== undefined
                                && ctrl.lastSevenDaysCommitCount !== 0)
                                ? ((Math.ceil(7 / ctrl.lastSevenDaysCommitCount) > 1)
                                    ? (Math.ceil(7 / ctrl.lastSevenDaysCommitCount) + " Days")
                                    : (Math.ceil(7 / ctrl.lastSevenDaysCommitCount) + " Day"))
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
                            if (data.result !== undefined
                                && data.result.length !== 0
                                && data.result.length !== undefined) {
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
                                _(groubedByAge).forEach(function (val, key) {
                                    AgeingDetails.push(parseInt(key));
                                });
                                for (var i = 0; i <= AgeingDetails.length - 1; i++) {
                                    if (AgeingDetails.indexOf(i) !== -1) {
                                        AgeingDetailsAll.push({
                                            "ageingDays": i,
                                            "value": groubedByAge[i],
                                            "ageingDate": moment().subtract(i, "days").format("DD-MM-YYYY")
                                        });
                                    }
                                }
                                AllDashDefectsData.todayDefectCount = _.filter(data.result[0].defectAnalysis.detail, function (defect) {
                                    return defect.age < 1;
                                }).length;
                                AllDashDefectsData.avgDailyChange = (
                                    AllDashDefectsData.last7DaysDefectCount !== ''
                                    && AllDashDefectsData.last7DaysDefectCount !== null
                                    && AllDashDefectsData.last7DaysDefectCount !== undefined
                                    && AllDashDefectsData.last7DaysDefectCount !== 0)
                                    ? ((Math.ceil(7 / AllDashDefectsData.last7DaysDefectCount) > 1)
                                        ? (Math.ceil(7 / AllDashDefectsData.last7DaysDefectCount) + " Days")
                                        : (Math.ceil(7 / AllDashDefectsData.last7DaysDefectCount) + " Day"))
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
        // var statusCount = 1;
        // var GitHubDetails = [];
        // function getGithubDetails(){   
        //     $http.get("https://api.github.com/users/tomchentw/repos").then(function(res){
        //         statusCount += 1;
        //         if ( statusCount % 2 == 0) {
        //             GitHubDetails.push({
        //                 "data":res.data,
        //                 "status":"success",
        //                 "timestamp":moment().valueOf()
        //             });
        //         }else{
        //             GitHubDetails.push({
        //                 "data":res.data,
        //                 "status":"failure",
        //                 "timestamp":moment().valueOf()
        //             });
        //         }
        //         console.log("in GithubDetails, GitHubDetails is : ",GitHubDetails);
        //     },function(error){
        //         console.log("in GithubDetails, Error is  : ",error);
        //     })
        // }
        // //getGithubDetails();
        // setInterval(getGithubDetails, 5000);

    }
})();
