(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('TdpViewController', TdpViewController);

    //TdpViewController.$inject = ['$q', '$scope','codeTdpData', 'pullTdpData', 'issueTdpData', 'collectorData', '$uibModal'];
    TdpViewController.$inject = ['$q', '$scope','$http'];
    //function TdpViewController($q, $scope, codeTdpData, pullTdpData, issueTdpData, collectorData, $uibModal) {
        function TdpViewController($q, $scope,$http) {
        var ctrl = this;        
        ctrl.load = function() {
            var deferred = $q.defer();

            var params = {
                componentId: $scope.widgetConfig.componentId,
                numberOfDays: 14
            };

//http://10.105.53.171:3004/tdpDetailsNew
/**Below changes for displaying  TDP details*/
         $http.get("/api/defect?componentId=" + params.componentId).then(function(response){
            console.log("response.data is : ", response.data);
            ctrl.tdpDetailsNew = {
                categories:[],
                severities:[],
                priorities:[],
                ageing:[],
                status:''
            };  
            // console.log("response.data.content.categories : ",response.data.result[0].defectAnalysis.categories);
            // console.log("response.data.content.severities : ",response.data.result[0].defectAnalysis.severities);
            // console.log("response.data.content.priorities : ",response.data.result[0].defectAnalysis.priorities);
            if(response.data.result !== undefined && response.data.result.length !== 0){
                _.each(response.data.result[0].defectAnalysis.categories.info,function(value,key){
                    //console.log("current categories value and key is "+value+" "+key);
                    ctrl.tdpDetailsNew.categories.push({"name":key,"value":value});
                });
                _.each(response.data.result[0].defectAnalysis.severities.info,function(value,key){
                    //console.log("current severities value and key is "+value+" "+key);
                    ctrl.tdpDetailsNew.severities.push({"name":key,"value":value});
                });
                _.each(response.data.result[0].defectAnalysis.priorities.info,function(value,key){
                    //console.log("current tdpdetails value and key is "+value+" "+key);
                    ctrl.tdpDetailsNew.priorities.push({"name":key,"value":value});
                });
                //console.log("response.data.content.last5Days.length is :",response.data.content.last5Days.length);
                ctrl.tdpDetailsNew.ageing.push(
                    {"name":"last5Days","value":response.data.result[0].defectAnalysis.last5Days.length},
                    {"name":"last10Days","value":response.data.result[0].defectAnalysis.last10Days.length}
                );
            }else{
                console.log("response.data.result[0] is undefined");
            }
            if (window.location.href.indexOf("showperformance") > -1) {
                ctrl.tdpDetailsNew.status = false;
            }else{
                ctrl.tdpDetailsNew.status = true;
            }
            console.log("ctrl.tdpDetailsNew is : ",ctrl.tdpDetailsNew);
            });
            
            return deferred.promise;
        };

        ctrl.tdpDetailsNew = {
            categories:[],
            severities:[],
            priorities:[],
            ageing:[],
            status:''
        };  
    }
})();
