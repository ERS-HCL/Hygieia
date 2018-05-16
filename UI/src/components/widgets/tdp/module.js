(function () {
    'use strict';

    var widget_state,
        config = {
        view: {
            defaults: {
                title: 'Code Tdp' // widget title
            },
            controller: 'TdpViewController',
            controllerAs: 'tdpView',
            templateUrl: 'components/widgets/tdp/view.html'
        },
        config: {
            controller: 'TdpConfigController',
            controllerAs: 'tdpConfig',
            templateUrl: 'components/widgets/tdp/config.html'
        },
        getState: getState
    };

    angular
        .module(HygieiaConfig.module)
        .config(register);

    register.$inject = ['widgetManagerProvider', 'WidgetState'];
    function register(widgetManagerProvider, WidgetState) {
        widget_state = WidgetState;
        widgetManagerProvider.register('tdp', config);
    }

    function getState(widgetConfig) {
        return HygieiaConfig.local || (widgetConfig.id) ? widget_state.READY : widget_state.CONFIGURE;
    }
})();
