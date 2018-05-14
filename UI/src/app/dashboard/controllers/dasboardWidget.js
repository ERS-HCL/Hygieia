/**
 * Controller for choosing or creating a new dashboard
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('DashboardWidgetController', DashboardWidgetController);
    DashboardWidgetController.$inject = ['$scope', '$uibModal', '$location', 'dashboardWidgetItem'];
  
    function DashboardWidgetController($scope, $uibModal, $location, dashboardWidgetItem) {
            var ctrl = this;
            ctrl.allWidgetDetails = dashboardWidgetItem;
            console.log("I am in ctrl.allWidgetDetails : ",ctrl.allWidgetDetails);
    }
})();
