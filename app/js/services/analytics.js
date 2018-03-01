var module = angular.module('Services');
module.service('AnalyticsService', function($window, $location, $rootScope) {
    return {
        sendEvent: function(CATEGORY, ACTION) {
            $window.ga('send', {
                hitType: 'event',
                eventCategory: CATEGORY,
                eventAction: ACTION,
                eventLabel: $rootScope.isProduction ? 'PRODUCTION' : 'TEST'
            });
            $window.ga(
                'send',
                'event',
                CATEGORY,
                ACTION,
                $rootScope.isProduction ? 'PRODUCTION' : 'TEST',
                {
                    'dimension2': $rootScope.currentProfile.email
                }
            );

            switch (ACTION) {
                case 'REGISTRATION':
                    $window.fbq('track', 'CompleteRegistration');
            }
        },
        sendModulePassed: function (MODULE_NAME) {
            $window.ga(
                'send',
                'event',
                'MODULE',
                'PASSED',
                'PRODUCTION',
                {
                    'dimension1': MODULE_NAME,
                    'dimension2': $rootScope.currentProfile.email
                }
            )
        }
    }
});
