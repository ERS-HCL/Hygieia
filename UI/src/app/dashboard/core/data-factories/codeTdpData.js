/**
 * Gets code repo related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('codeTdpData', codeTdpData);

    function codeTdpData($http) {
        //var testDetailRoute = 'test-data/commit_detail.json';
        var caDetailRoute = '/api/defect';

        return {
            details: details
        };

        // get 15 days worth of commit data for the component
        function details(params) {
            //return $http.get(HygieiaConfig.local ? testDetailRoute : caDetailRoute, { params: params })
            return $http.get(caDetailRoute, { params: params })
                .then(function (response) {
                    return response.data;
                });
        }
    }
})();