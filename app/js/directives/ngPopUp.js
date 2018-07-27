var module = angular.module('Directives');
module.directive('ngPopUp', function($sce, $templateRequest, $compile, $rootScope, $timeout) {

    var body = angular.element('body:first');
    var popupHolder = angular.element('<div>').addClass('popup-window-holder').appendTo(body);
    var popupWindowWrapper = angular.element('<div>').addClass('popup-window-wrapper');
    var popupWindow = angular.element('<div>').addClass('popup-window');
    var popupWindowCloser = angular.element('<div>').addClass('popup-window-closer');
    var popupCloser = angular.element('<div>').addClass('popup-window-closer-global with-popup ng-popup-closer');

    var popupContent = angular.element('<div>').addClass('popup-content');

    var showedPopups = 0;


    return {
        restrict: 'A',
        scope: {
            ngPopUp: '='
        },
        link: function($scope, element) {

            $scope.getTemplate = $rootScope.getTemplate;
            $scope.avatarPlaceholder = $rootScope.avatarPlaceholder;
            $scope.ngPopUp.params = $scope.ngPopUp.params || {};

            $scope.$parent.popupScope = $scope;

            var currentWindow, currentWindowWrapper;
            var isShowed = false;

            var createPopup = function() {
                element.focus();
                currentWindowWrapper = popupWindowWrapper.clone().appendTo(popupHolder).addClass($scope.ngPopUp.class + '-wrapper');
                currentWindow = popupWindow.clone().appendTo(currentWindowWrapper).addClass($scope.ngPopUp.class);
                var currentCloser = popupCloser.clone().appendTo(currentWindowWrapper);
                var currentPopupContent = popupContent.clone();

                if ($scope.ngPopUp.newPopupContent) {
                    currentPopupContent.removeClass('popup-content').addClass('new-popup-content')
                }
                currentPopupContent.appendTo(currentWindow);

                if ($scope.ngPopUp.noShadow) {
                    currentCloser.removeClass('ng-popup-closer');
                }
                popupHolder.appendTo(body);

                if (!showedPopups) {
                    body.addClass('popup-showed');
                }
                showedPopups++;
                isShowed = true;
                if ($scope.ngPopUp.closer) {
                    var closeLine = angular.element('<div>').addClass('map-closer-line').
                    appendTo(popupHolder);
                } else if (!$scope.ngPopUp.noBackgroundCloser) {
                    currentCloser.on('click', function() {
                        $scope.closeCurrentPopup();
                        $scope.$apply();
                    });
                }

                var templateUrl = $sce.getTrustedResourceUrl($scope.ngPopUp.template);

                var compileTemplate = function(cloned) {
                        cloned.appendTo(currentPopupContent);
                        currentWindow.css({
                            visibility: 'hidden'
                        });
                        $timeout(function() {
                            var margin = (angular.element(window).height() - currentWindow.outerHeight()) / 2;
                            margin = Math.max(margin, 10);
                            currentWindow.css({
                                'margin-top': Math.max(30, margin),
                                'margin-bottom': 50,
                                'visibility': ''
                            });
                            $timeout(function() {
                                currentPopupContent.addClass('popup-normalize');
                            });
                        });
                };

                $templateRequest(templateUrl).then(function(template) {
                    $compile(template)($scope, function(cloned, scope) {
                        var images = cloned.find('img');
                        if (images.length) {
                            var imagesCount = images.length;
                            images.each(function () {
                                this.onload = function () {
                                    imagesCount--;
                                    if (!imagesCount) {
                                        compileTemplate(cloned);
                                    }
                                };
                            });
                        } else {
                            compileTemplate(cloned);
                        }
                    })
                }, function() {
                });
                // $scope.$apply();
            };


            var changeContentHandler = $scope.$on('changeContent', function(event) {
                if ($scope !== event.targetScope) return;
                var margin = (angular.element(window).height() - currentWindow.outerHeight()) / 2;
                margin = Math.max(margin, 10);
                currentWindow.css({
                    'margin-top': Math.max(30, margin),
                    'margin-bottom': 50,
                    'visibility': ''
                });
            });

            var closePopUpsHandler = $scope.$on('$closePopUps', function(func) {
                $scope.closeCurrentPopup();
            });

            var destroyHandler = $scope.$on('$destroy', function() {
                changeContentHandler();
                closePopUpsHandler();
                destroyHandler();
                $scope.closeCurrentPopup();
            });

            $scope.closeCurrentPopup = function(noCallAction) {
                if (isShowed) {
                    showedPopups--;
                    if (!showedPopups) {
                        body.removeClass('popup-showed');
                    }
                    isShowed = false;
                    currentWindowWrapper ? currentWindowWrapper.empty().remove() : false;

                    if ((noCallAction !== true) && $scope.ngPopUp.onClose) {
                        $scope.ngPopUp.onClose();
                    }
                    $scope.$broadcast('$closePopUp');
                }
            };

            $scope.$parent.$on('$closePopUp', function() {
                // $scope.$broadcast('$destroy');
            });

            $scope.$watch('ngPopUp.template', function(newTpl, oldTpl) {
                if (isShowed && (newTpl !== oldTpl)) {
                    currentWindowWrapper ? currentWindowWrapper.empty().remove() : false;
                    showedPopups--;
                    createPopup();
                }
            });

            !$scope.ngPopUp.noClickShow  ? element.on('click', createPopup) : false;
            $scope.ngPopUp.opened ? createPopup() : false;

        }
    }
});
