var module = angular.module('Directives');
module.directive('ngPopUp', function($sce, $templateRequest, $compile, $rootScope, $timeout) {

    var body = angular.element('body:first');
    var popupHolder = angular.element('<div>').addClass('popup-window-holder');
    var popupWindowWrapper = angular.element('<div>').addClass('popup-window-wrapper');
    var popupWindow = angular.element('<div>').addClass('popup-window');
    var popupWindowCloser = angular.element('<div>').addClass('popup-window-closer');
    var popupCloser = angular.element('<div>').addClass('popup-window-closer-global with-popup ng-popup-closer');

    var showedPopups = 0;


    return {
        restrict: 'A',
        scope: {
            ngPopUp: '='
        },
        link: function($scope, element) {

            $scope.getTemplate = $rootScope.getTemplate;
            $scope.avatarPlaceholder = $rootScope.avatarPlaceholder;

            $scope.$parent.popupScope = $scope;

            var currentHolder;
            var currentWindow;
            var isShowed = false;
            var createPopup = function() {
                element.focus();
                currentHolder = popupHolder.clone();
                var currentWindowWrapper = popupWindowWrapper.clone().appendTo(currentHolder).addClass($scope.ngPopUp.class + '-wrapper');
                currentWindow = popupWindow.clone().appendTo(currentWindowWrapper).addClass($scope.ngPopUp.class);
                var currentCloser = popupCloser.clone().appendTo(currentWindowWrapper);

                if (!($scope.ngPopUp.params && $scope.ngPopUp.params.withoutCloser)) {
                    var currentPopupWindowCloser = popupWindowCloser.clone().appendTo(currentWindow).on('click', function() {
                        $scope.closeCurrentPopup();
                        $scope.$apply();
                    });
                }

                if ($scope.ngPopUp.noShadow) {
                    currentCloser.removeClass('ng-popup-closer');
                }

                currentHolder.appendTo(body);

                if (!showedPopups) {
                    body.addClass('popup-showed');
                }
                showedPopups++;
                isShowed = true;
                if ($scope.ngPopUp.closer) {
                    var closeLine = angular.element('<div>').addClass('map-closer-line').
                    appendTo(currentHolder);
                } else {
                    currentCloser.on('click', function() {
                        $scope.closeCurrentPopup();
                        $scope.$apply();
                    });
                }

                var templateUrl = $sce.getTrustedResourceUrl($scope.ngPopUp.template);
                $templateRequest(templateUrl).then(function(template) {
                    $compile(template)($scope, function(cloned, scope) {
                        cloned.appendTo(currentWindow);
                        currentWindow.css({
                            visibility: 'hidden'
                        });
                        $timeout(function() {
                            var margin = (angular.element(window).height() - currentWindow.outerHeight()) / 2;
                            margin = Math.max(margin, 10);
                            currentWindow.css({
                                'margin-top': margin,
                                'margin-bottom': margin,
                                'visibility': ''
                            });
                        });
                    });
                }, function() {
                });
                // $scope.$apply();
            };
            $scope.closeCurrentPopup = function(noCallAction) {
                if (isShowed) {
                    showedPopups--;
                    if (!showedPopups) {
                        body.removeClass('popup-showed');
                    }
                    isShowed = false;
                    currentHolder ? currentHolder.empty().remove() : false;

                    if ((noCallAction !== true) && $scope.ngPopUp.onClose) {
                        $scope.ngPopUp.onClose();
                    }
                }
            };

            $scope.$on('$destroy', function() {
                $scope.closeCurrentPopup();
            });
            !$scope.ngPopUp.noClickShow  ? element.on('click', createPopup) : false;
            $scope.ngPopUp.opened ? createPopup() : false;
        }
    }
});
