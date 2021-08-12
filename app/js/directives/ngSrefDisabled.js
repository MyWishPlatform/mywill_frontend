module.directive('uiSrefDisabled', ['$parse', '$rootScope',
    function($parse, $rootScope) {
        return {
            // this ensure eatClickIf be compiled before ngClick
            priority: 100,
            restrict: 'A',
            compile: function($element, attr) {
                var fn = $parse(attr.uiSrefDisabled);
                return {
                    pre: function link(scope, element) {
                        var eventName = 'click';
                        element.on(eventName, function(event) {
                            var callback = function() {
                                if (fn(scope, {$event: event})) {
                                    // prevents ng-click to be executed
                                    event.stopImmediatePropagation();
                                    // prevents href
                                    event.preventDefault();
                                    return false;
                                }
                            };
                            if ($rootScope.$$phase) {
                                scope.$evalAsync(callback);
                            } else {
                                scope.$apply(callback);
                            }
                        });
                    },
                    post: function() {}
                }
            }
        }
    }
]);
