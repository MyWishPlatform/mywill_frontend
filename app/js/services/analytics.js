var module = angular.module('Services');
module.service('AnalyticsService', function($window, $location, $rootScope) {
    return {
        initGA: function() {
            // (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            //         (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            //     m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            // })($window,document,'script','https://www.google-analytics.com/analytics.js','ga');
            if (!$window.ga) return;
            $window.ga('create', 'UA-103787362-1', 'auto');
        },
        sendEvent: function(CATEGORY, ACTION) {
            if (!$window.ga) return;
            $window.ga('send', {
                hitType: 'event',
                eventCategory: CATEGORY,
                eventAction: ACTION,
                eventLabel: $rootScope.isProduction ? 'PRODUCTION' : 'TEST'
            });
        },
        sendModulePassed: function (MODULE_NAME) {
            if (!$window.ga) return;
            $window.ga(
                'send',
                'event',
                'MODULE',
                'PASSED',
                'PRODUCTION',
                {
                    'dimension1': MODULE_NAME,
                    'dimension2': $rootScope.currentUser.email
                }
            )
        }
    }
});
