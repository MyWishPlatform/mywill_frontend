var module = angular.module('Directives');
module.directive('ngSelect', function() {
    return {
        'restrict': 'A',
        'templateUrl': '/templates/directives/ngSelect.html',
        'replace': true,
        'scope': {
            ngModel: '=ngModel',
            ngOptionsList: '=?ngModelList',
            ngSelectOptions: '=ngSelectOptions',
            dataTestElement: '@?ngTestElement',
            ngSelectChange: '=?',
            ngSelectChangeData: '=?',
            ngAutocompleteField: '=?',
            ngUseSelected: '@'
        },
        'controller': function ($scope, $window) {
            $scope.ngSelectOptions = $scope.ngSelectOptions || {};
            $scope.focusSelect = function () {
                $scope.focusedSelect = true;
            };
            $scope.blurSelect = function () {
                $scope.focusedSelect = false;
                $scope.ngSelectOptions.showed = false;
            };
            $scope.selectOption = function (option, $event) {
                $event.preventDefault();
                if (option.information) return;
                $scope.ngSelectOptions.showed = false;
                $scope.ngModel = $scope.ngSelectOptions.value ? option[$scope.ngSelectOptions.value] : option;
                $scope.inputBlur();
            };
            $scope.toggleList = function($event) {
                $event.preventDefault();
                $scope.ngSelectOptions.showed = !$scope.ngSelectOptions.showed;
            };

            if (!$scope.ngSelectOptions.ignoreToggleList) {
                angular.element($window).on({
                    mousedown: function(e) {
                        var target = angular.element(e.target);
                        if (!target.is('input') && (target.is($scope.selectElement) || $scope.selectElement.find(target).length)) {
                            $scope.selectElement.focus();
                            e.preventDefault();
                        } else if (!target.is('input')) {
                            $scope.ngSelectOptions.showed = false;
                            $scope.$apply();
                        }
                    }
                });
            }
            $scope.selectKeyDown = function(event) {
                switch (event.which) {
                    case 13:
                        event.preventDefault();
                        $scope.toggleList(event);
                        break;
                    case 27:
                        $scope.ngSelectOptions.showed = false;
                        break;
                }
            };

            $scope.filterOptionsList = function(val) {
                var regExp = new RegExp('^' + val + '[\s\S]*', 'i');

                $scope.showedList = $scope.ngOptionsList.filter(function(item) {
                    return regExp.test($scope.ngSelectOptions.label ? $scope.getLabelModel(item, $scope.ngSelectOptions.label) : item);
                });

                $scope.ngSelectOptions.showed = true;
                chooseModel($scope.showedList);
            };

            $scope.inputKeyDown = function($event) {
                var selectedIndex = $scope.showedList.indexOf($scope.selectedOption);
                switch ($event.keyCode) {
                    case 38:
                        if (selectedIndex === -1) return;
                        selectedIndex--;
                        selectedIndex = selectedIndex < 0 ? $scope.showedList.length - 1 : selectedIndex;
                        $scope.ngModel = $scope.ngSelectOptions.value ? $scope.showedList[selectedIndex][$scope.ngSelectOptions.value] : $scope.showedList[selectedIndex];
                        break;
                    case 40:
                        if (selectedIndex === -1) return;
                        selectedIndex++;
                        selectedIndex = (selectedIndex > ($scope.showedList.length - 1)) ? 0 : selectedIndex;
                        $scope.ngModel = $scope.ngSelectOptions.value ? $scope.showedList[selectedIndex][$scope.ngSelectOptions.value] : $scope.showedList[selectedIndex];
                        break;
                }
            };

            $scope.inputBlur = function() {
                $scope.ngSelectOptions.showed = false;
                autoFocused = false;
                $scope.ngAutocompleteField = $scope.ngModel ?
                    $scope.ngSelectOptions.label ? $scope.getLabelModel($scope.selectedOption, $scope.ngSelectOptions.label) : $scope.selectedOption : $scope.ngAutocompleteField;
            };
            $scope.ngAutocompleteField = $scope.ngAutocompleteField || '';
            var autoFocused = false;
            $scope.inputFocus = function() {
                autoFocused = true;
                $scope.ngSelectOptions.showed = true;
            };


            var chooseModel = function(newList) {
                if (!$scope.ngSelectOptions.autocomplete || !$scope.ngAutocompleteField) {
                    if (newList && newList.length) {
                        if (newList.length == 1 && newList[0]['information']) {
                            $scope.ngSelectOptions.showed = true;
                        } else {
                            var model = false;
                            for (var index = 0; index < newList.length; index++) {
                                var item = newList[index];
                                var i = $scope.ngSelectOptions.value ? item[$scope.ngSelectOptions.value] : item;
                                if (i == $scope.ngModel) {
                                    model = item;
                                    break;
                                }
                            }
                            model = model || newList[0];

                            $scope.ngModel = $scope.ngSelectOptions.value ? model[$scope.ngSelectOptions.value] : model;
                        }
                    } else {
                        $scope.ngModel = false;
                        $scope.selectedOption = undefined;
                    }
                }
            };

            $scope.$watch('ngOptionsList', function (newList) {
                $scope.ngOptionsList = $scope.ngOptionsList || [];
                $scope.showedList = $scope.ngOptionsList;
                chooseModel(newList);
            });

            $scope.getLabelModel = function(option, label) {
                var labelSplit = label.split('.');
                var returnObj = option;

                labelSplit.map(function(prop) {
                    returnObj = returnObj ? returnObj[prop] || false : false;
                });
                return returnObj;
            };

            $scope.$watch('ngModel', function(n, o) {
                for (var index = 0; index < $scope.ngOptionsList.length; index++) {
                    var item = $scope.ngOptionsList[index];
                    var i = $scope.ngSelectOptions.value ? item[$scope.ngSelectOptions.value] : item;
                    if (i == $scope.ngModel) {
                        $scope.selectedOption = item;
                        break;
                    }
                }
                $scope.ngSelectChange && (o != n) ?
                    $scope.ngSelectChange($scope.ngUseSelected? $scope.selectedOption: $scope.ngModel, $scope.ngOptionsList, $scope.ngSelectChangeData, o) :
                    false;
                if ($scope.selectedOption && !autoFocused) {
                    $scope.ngAutocompleteField = $scope.ngSelectOptions.label ?
                        $scope.getLabelModel($scope.selectedOption, $scope.ngSelectOptions.label) : $scope.selectedOption;
                }
            });
        },
        'link': function ($scope, element) {
            $scope.selectElement = element;
        }
    }
});
