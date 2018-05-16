/**
 * Build widget configuration
 */
(function() {
	'use strict';

	angular.module(HygieiaConfig.module).controller('TdpConfigController',
			TdpConfigController);

	TdpConfigController.$inject = [ 'modalData', '$uibModalInstance',
			'collectorData' ];
	function TdpConfigController(modalData, $uibModalInstance, collectorData) {
        var ctrl = this,
        widgetConfig = modalData.widgetConfig,
        component = modalData.dashboard.application.components[0];

        ctrl.saToolsDropdownPlaceholder = 'Loading TDP Defects';
        // public methods
        ctrl.caLoading = true;
        ctrl.submit = submitForm;




		// Request collectors
		collectorData.collectorsByType('TDP').then(processCollectorsResponse);

		function processCollectorsResponse(data) {
			ctrl.collectors = data;

			ctrl.tdpOptions =[];
			_(data).forEach(function (collector) {
				ctrl.tdpOptions.push({name:collector.name,value:collector.name});
			});
			var collector = modalData.dashboard.application.components[0].collectorItems.TDP;
			var scmType = 	collector!=null? collector[0].options.TDP: null;
			var myIndex;
			if(scmType!=null){
				for (var v = 0; v < ctrl.tdpOptions.length; v++) {
					if (ctrl.tdpOptions[v].name.toUpperCase() === scmType.toUpperCase()) {
						myIndex = v;
					}
				}
				ctrl.tdpOption=ctrl.tdpOptions[myIndex];
			}

		}

		ctrl.tdpUrl = widgetConfig.options.queryURL;
		ctrl.tdpQueryName = widgetConfig.options.queryName;
		ctrl.tdpuser = widgetConfig.options.userName;
		ctrl.tdppass = widgetConfig.options.password;

		// public variables
		ctrl.submitted = false;
		ctrl.collectors = [];

		// public methods
		ctrl.submit = submitForm;



		/*
		 * function submitForm(valid, url) { ctrl.submitted = true; if (valid &&
		 * ctrl.collectors.length) {
		 * createCollectorItem(url).then(processCollectorItemResponse); } }
		 */
		function submitForm(form) {
			ctrl.submitted = true;
			// if (form.$valid && ctrl.collectors.length) {
            if (form.$valid ) {
				//there is an existing tdp and nothing was changed
				if (widgetConfig.options.tdp) {

					if (ctrl.tdpOption.name === widgetConfig.options.tdp.name &&
						ctrl.tdpUrl === widgetConfig.options.queryURL &&
						ctrl.tdpuser === widgetConfig.options.userName &&
						ctrl.tdppass === widgetConfig.options.password &&
						ctrl.tdpQueryName === widgetConfig.options.queryName) {
						$uibModalInstance.close();
						return;
					}
				}

                createCollectorItem().then(processCollectorItemResponse, handleError);
                /*
				if (ctrl.tdppass) {
					if (ctrl.tdppass === widgetConfig.options.password) {
						//password is unchanged in the form so don't encrypt it again
						try {
							createCollectorItem().then(processCollectorItemResponse, handleError);
						} catch (e) {
							console.log(e);
						}
					} else {
						collectorData.encrypt(ctrl.tdppass).then(function (response) {
							if (response === 'ERROR') {
								form.tdppass.$setValidity('errorEncryptingPassword', false);
								return;
							}
							ctrl.tdppass = response;
							try {
								createCollectorItem().then(processCollectorItemResponse, handleError);
							} catch (e) {
								console.log(e);
							}
						});
					}
				} else {
					createCollectorItem().then(processCollectorItemResponse, handleError);
				}
				*/
			}
		}

		/*
		 * function createCollectorItem(url) { var item = { // TODO - Remove
		 * hard-coded subversion reference when mulitple // scm collectors
		 * become available collectorId : _.find(ctrl.collectors, { name :
		 * 'Subversion' }).id, options : { url : url } }; return
		 * collectorData.createCollectorItem(item); }
		 */

		function getNonNullString(value) {
			return _.isEmpty(value)||_.isUndefined(value)?"":value
		}

		function removeGit(url){
			if (!angular.isUndefined(url) && url.endsWith(".git")) {
				url = url.substring(0, url.lastIndexOf(".git"));
			}
			return url;
		}
		function getOptions(tdp) {
			return {
				tdp: tdp,
				queryURL: ctrl.tdpUrl,
                userName: getNonNullString(ctrl.tdpuser),
                password: getNonNullString(ctrl.tdppass),
                queryName: getNonNullString(ctrl.tdpQueryName)
			}
		}

		function getUniqueOptions (tdp) {
			return {
                tdp: tdp,
                queryURL: ctrl.tdpUrl,
                userName: getNonNullString(ctrl.tdpuser),
                queryName: getNonNullString(ctrl.tdpQueryName)
            }
		}

		function createCollectorItem() {
			var item = {};



				item = {
					collectorId: _.find(ctrl.collectors, {name: 'Defect'}).id,
					options: getOptions('TDP'),
					uniqueOptions: getUniqueOptions('TDP')
				};

			return collectorData.createCollectorItem(item);
		}

		function handleError(response) {
			if(response.status === 401) {
				$modalInstance.close();
			}
		}

		function processCollectorItemResponse(response) {
			var postObj = {
				name : "TDP",
				options : {
					id : widgetConfig.options.id,
					queryURL : ctrl.tdpUrl,
					userName : getNonNullString(ctrl.tdpuser),
					password: getNonNullString(ctrl.tdppass),
					queryName: getNonNullString(ctrl.tdpQueryName)
				},
				componentId : modalData.dashboard.application.components[0].id,
				collectorItemId : response.data.id
			};
			// pass this new config to the modal closing so it's saved
			$uibModalInstance.close(postObj);
		}
	}
})();
