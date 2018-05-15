/**
 * Controller for choosing or creating a new dashboard
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('SiteController', SiteController);

    SiteController.$inject = ['$scope', '$q', '$uibModal', 'dashboardData', '$location', 'DashboardType', 'userService',
        'authService','dashboardService','user','paginationWrapperService'];
    function SiteController($scope, $q, $uibModal, dashboardData, $location, DashboardType, userService,
                            authService, dashboardService, user, paginationWrapperService) {
        var ctrl = this;

        // public variables
        ctrl.search = '';
        ctrl.myadmin = '';
        //For Getting All Widget Details
        ctrl.allWidgetDetails = {
            Builds:{},
            Defects:{},
            Commits:{}
        };
        // ctrl.allWidgetDetails.Builds = widgetBuildsItems;
        // ctrl.allWidgetDetails.Defects = widgetDefectsItems;
        // ctrl.allWidgetDetails.Commits = widgetCommitsItems;
        ctrl.username = userService.getUsername();
        ctrl.showAuthentication = userService.isAuthenticated();

        ctrl.templateUrl = 'app/dashboard/views/navheader.html';
        ctrl.dashboardTypeEnum = DashboardType;

        // public methods
        ctrl.createDashboard = createDashboard;
        ctrl.deleteDashboard = deleteDashboard;
        ctrl.manageTemplates = manageTemplates;
        ctrl.open = open;
        ctrl.login = login;
        ctrl.logout = logout;
        ctrl.admin = admin;
        ctrl.setType = setType;
        ctrl.filterNotOwnedList = filterNotOwnedList;
        ctrl.editDashboard = editDashboard;
        ctrl.pageChangeHandler = pageChangeHandler;
        ctrl.pageChangeHandlerForMyDash = pageChangeHandlerForMyDash;
        ctrl.getTotalItems = getTotalItems;
        ctrl.getTotalItemsMyDash = getTotalItemsMyDash;
        ctrl.getPageSize = getPageSize;
        ctrl.filterByTitle = filterByTitle;
        ctrl.getCurrentWidgetDetails = getCurrentWidgetDetails;

        if (userService.isAdmin()) {
            ctrl.myadmin = true;
        }

        (function() {
            // set up the different types of dashboards with a custom icon
            var types = dashboardData.types();
            _(types).forEach(function (item) {
                if(item.id == DashboardType.PRODUCT) {
                    item.icon = 'fa-cubes';
                }
            });

            ctrl.dashboardTypes = types;

            dashboardData.getPageSize().then(function (data) {
                pullDashboards();
            });
        })();

        function getTotalItems() {
            return paginationWrapperService.getTotalItems();
        }

        function getTotalItemsMyDash() {
            return paginationWrapperService.getTotalItemsMyDash();
        }

        function getCurrentPage() {
            return paginationWrapperService.getCurrentPage();
        }

        function getPageSize() {
            return paginationWrapperService.getPageSize();
        }

        function setType(type) {
            ctrl.dashboardType = type;
            pullDashboards(type);
        }

        function admin() {
            console.log('sending to admin page');
            $location.path('/admin');
        }

        function login() {
          $location.path('/login');
        }

        function logout() {
            authService.logout();
            $location.path('/login');
        }

        // method implementations
        function createDashboard() {
            // open modal for creating a new dashboard
            $uibModal.open({
                templateUrl: 'app/dashboard/views/createDashboard.html',
                controller: 'CreateDashboardController',
                controllerAs: 'ctrl'
            });
        }
        //getting widget details
        function getCurrentWidgetDetails(serviceName,widgetName,widgetData,dashboardId,currentItem){
            if(widgetData !== undefined){
                switch(widgetName){
                    case 'Build':
                        ctrl.allWidgetDetails.Builds.widgetName = widgetName;
                        ctrl.allWidgetDetails.Builds.serviceName = serviceName;
                        ctrl.allWidgetDetails.Builds.widgetModalTitle = widgetName+' '+serviceName;
                        ctrl.allWidgetDetails.Builds.totalBuildsLastWeek = currentItem.totalBuildsLastWeek;
                        //$rootScope.allWidgetDetailsDash = ctrl.allWidgetDetails;
                        //open modal for getting widget details
                        $uibModal.open({
                            templateUrl:'app/dashboard/views/getBuildWidgetDetails.html',
                            controller: 'DashboardWidgetController',
                            controllerAs: 'ctrl',
                            size:'lg',
                            resolve: {
                                dashboardWidgetItem: function() {
                                    return ctrl.allWidgetDetails;
                                }
                            }
                        });
                        break;
                    case 'Defect':
                        ctrl.allWidgetDetails.Defects.widgetName = widgetName;
                        ctrl.allWidgetDetails.Defects.serviceNAme = serviceName;
                        ctrl.allWidgetDetails.Defects.widgetModalTitle = widgetName+' '+serviceName;
                        //open modal for getting widget details
                        $uibModal.open({
                            templateUrl:'app/dashboard/views/getDefectWidgetDetails.html',
                            controller: 'DashboardWidgetController',
                            controllerAs: 'ctrl',
                            size:'lg',
                            resolve: {
                                dashboardWidgetItem: function() {
                                    return ctrl.allWidgetDetails;
                                }
                            }
                        });
                        break;
                    case 'Commit':
                        ctrl.allWidgetDetails.Commits.widgetName = widgetName;
                        ctrl.allWidgetDetails.Commits.serviceName = serviceName;
                        ctrl.allWidgetDetails.Commits.widgetModalTitle = widgetName+' '+serviceName;
                        ctrl.allWidgetDetails.Commits.totalCommitsLastWeek = currentItem.totalCommitsLastWeek;
                        //open modal for getting widget details
                        $uibModal.open({
                            templateUrl:'app/dashboard/views/getCommitWidgetDetails.html',
                            controller: 'DashboardWidgetController',
                            controllerAs: 'ctrl',
                            size:'lg',
                            resolve: {
                                dashboardWidgetItem: function() {
                                    return ctrl.allWidgetDetails;
                                }
                            }
                        });
                        break;
                    default:
                        break;
                }
            }else{
                $location.path('/dashboard/' + dashboardId);
            }
           
            
        }

        function editDashboard(item,size)
        {
            // open modal for renaming dashboard
            var modalInstance = $uibModal.open({
                templateUrl: 'app/dashboard/views/editDashboard.html',
                controller: 'EditDashboardController',
                controllerAs: 'ctrl',
                size:size,
                resolve: {
                    dashboardItem: function() {
                        return item;
                    }
                }
            });
            modalInstance.result.then(function success() {
                pullDashboards()
            });
        }

        function manageTemplates() {
            $location.path('/templates');
        }

        function open(dashboardId) {
            $location.path('/dashboard/' + dashboardId);
        }

        function processDashboardResponse(data) {
            ctrl.dashboards = paginationWrapperService.processDashboardResponse(data, ctrl.dashboardType);
            console.log("dashboards value is : ", ctrl.dashboards);
        }

        function processDashboardFilterResponse(data) {
            ctrl.dashboards = paginationWrapperService.processDashboardFilterResponse(data);
        }

        function processDashboardError(data) {
            ctrl.dashboards = paginationWrapperService.processDashboardError(data);
        }

        function processMyDashboardResponse(mydata) {
            ctrl.mydash = paginationWrapperService.processMyDashboardResponse(mydata, ctrl.dashboardType);
            console.log("mydash data is : ",ctrl.mydash);
        }

        function processFilterMyDashboardResponse(mydata) {
            ctrl.mydash = paginationWrapperService.processFilterMyDashboardResponse(mydata);
        }

        function processMyDashboardError(data) {
            ctrl.mydash = paginationWrapperService.processMyDashboardError(data);
        }

        function deleteDashboard(item) {
            var id = item.id;
            dashboardData.delete(id).then(function () {
                _.remove(ctrl.dashboards, {id: id});
                _.remove(ctrl.mydash, {id: id});
                paginationWrapperService.calculateTotalItems(ctrl.dashboardType);
                paginationWrapperService.calculateTotalItemsMyDash(ctrl.dashboardType);
            }, function(response) {
                var msg = 'An error occurred while deleting the dashboard';

                if(response.status > 204 && response.status < 500) {
                    msg = 'The Team Dashboard is currently being used by a Product Dashboard/s. You cannot delete at this time.';
                }

                swal(msg);
            });
        }

        function filterNotOwnedList(db1, db2) {

            console.log("size before is:" + db1.length);

            var jointArray = db1.concat(db2);

            console.log("size after is:" + jointArray.length);

            var uniqueArray = jointArray.filter(function (elem, pos) {
                return jointArray.indexOf(elem) == pos;
            });

            console.log("size after reduction  is:" + uniqueArray.length);
            ctrl.dashboards = uniqueArray;
        }

        function pullDashboards(type) {
            // request dashboards
            dashboardData.searchByPage({"search": '', "type": type, "size": getPageSize(), "page": 0})
                .then(processDashboardResponse, processDashboardError);

            // request my dashboards
            dashboardData.searchMyDashboardsByPage({"username": ctrl.username, "type": type, "size": getPageSize(), "page": 0})
                .then(processMyDashboardResponse, processMyDashboardError);

            paginationWrapperService.calculateTotalItems(type)
                .then (function () {
                    ctrl.totalItems = paginationWrapperService.getTotalItems();
                })

            paginationWrapperService.calculateTotalItemsMyDash(type)
                .then (function () {
                    ctrl.totalItemsMyDash = paginationWrapperService.getTotalItemsMyDash();
                })
        }

        function pageChangeHandler(pageNumber) {
            paginationWrapperService.pageChangeHandler(pageNumber, ctrl.dashboardType)
                .then(function() {
                    ctrl.dashboards = paginationWrapperService.getDashboards();
                });
        }

        function pageChangeHandlerForMyDash(pageNumber) {
            paginationWrapperService.pageChangeHandlerForMyDash(pageNumber, ctrl.dashboardType)
                .then(function() {
                    ctrl.mydash = paginationWrapperService.getMyDashboards();
                });
        }

        function filterByTitle (title) {
            var promises = paginationWrapperService.filterByTitle(title, ctrl.dashboardType);
            $q.all(promises).then (function() {
                ctrl.dashboards = paginationWrapperService.getDashboards();
                ctrl.mydash = paginationWrapperService.getMyDashboards();
            });
        }
    }
    
})();
