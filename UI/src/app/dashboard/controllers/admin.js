/**
 * Controller for administrative functionality
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('AdminController', AdminController);


    AdminController.$inject = ['$scope', 'dashboardData', '$location', '$uibModal', 'userService', 'authService', 'userData', 'dashboardService', 'templateMangerData', 'gamificationMetricData', 'paginationWrapperService'];
    function AdminController($scope, dashboardData, $location, $uibModal, userService, authService, userData, dashboardService, templateMangerData, gamificationMetricData, paginationWrapperService) {
        var ctrl = this;
        if (userService.isAuthenticated() && userService.isAdmin()) {
            $location.path('/admin');
        }
        else {
            console.log("Not authenticated redirecting");
            $location.path('#');
        }

        ctrl.storageAvailable = localStorageSupported;
        ctrl.showAuthentication = userService.isAuthenticated();
        ctrl.templateUrl = "app/dashboard/views/navheader.html";
        ctrl.username = userService.getUsername();
        ctrl.authType = userService.getAuthType();
        ctrl.login = login;
        ctrl.logout = logout;
        ctrl.editDashboard = editDashboard;
        ctrl.generateToken = generateToken;
        ctrl.goToManager = goToManager;
        ctrl.deleteTemplate = deleteTemplate;
        ctrl.viewTemplateDetails = viewTemplateDetails;
        ctrl.editTemplate = editTemplate;
        ctrl.deleteToken = deleteToken;
        ctrl.editToken = editToken;
        ctrl.deleteMetricRange = deleteMetricRange;
        ctrl.addMetricRange = addMetricRange;
        ctrl.saveMetricData = saveMetrics;
        ctrl.validateScoringRanges = validateScoringRanges;
        ctrl.isInteger = isInteger;
        ctrl.saveStatusData = saveStatusData;

        ctrl.pageChangeHandler = pageChangeHandler;
        ctrl.totalItems = totalItems;
        ctrl.currentPage = currentPage;
        ctrl.pageSize = pageSize;

        $scope.tab = "dashboards";
        $scope.metricAlert = null;
        ctrl.metricData = [];
        $scope.selectedMetric = null;
        $scope.editMode = {};
        $scope.changesMade = {};

        ctrl.metricList = [
            {
                metricName: "codeCoverage",
                formattedName: "Code Coverage",
                gamificationScoringRanges: [],
                enabled: false,
                description: "",
                symbol: ""
            },
            {
                metricName: "unitTests",
                formattedName: "Unit Test Success",
                gamificationScoringRanges: [],
                enabled: false,
                description: "",
                symbol: ""
            },
            {
                metricName: "buildSuccess",
                formattedName: "Build Success",
                gamificationScoringRanges: [],
                enabled: false,
                description: "",
                symbol: ""
            },
            {
                metricName: "codeViolations",
                formattedName: "Code Violations",
                gamificationScoringRanges: [],
                enabled: false,
                description: "",
                symbol: ""
            }
        ];

        // list of available themes. Must be updated manually
        ctrl.themes = [
            {
                name: 'Dash',
                filename: 'dash'
            },
            {
                name: 'Dash for display',
                filename: 'dash-display'
            },
            {
                name: 'Bootstrap',
                filename: 'default'
            },
            {
                name: 'BS Slate',
                filename: 'slate'
            }];

        // used to only show themes option if local storage is available
        if (localStorageSupported) {
            ctrl.theme = localStorage.getItem('theme');
        }

        // ctrl.dashboards = []; don't default since it's used to determine loading

        // public methods
        ctrl.deleteDashboard = deleteDashboard;
        ctrl.applyTheme = applyTheme;

        // request dashboards
        dashboardData.search().then(processResponse);
        userData.getAllUsers().then(processUserResponse);
        userData.apitokens().then(processTokenResponse);
        templateMangerData.getAllTemplates().then(processTemplateResponse);
        gamificationMetricData.getMetricData().then(processMetricResponse);

        function pageChangeHandler(pageNumber) {
            paginationWrapperService.pageChangeHandler(pageNumber)
                .then(function() {
                    ctrl.dashboards = paginationWrapperService.getDashboards();
                });
        }

        function totalItems() {
            return paginationWrapperService.getTotalItems();
        }

        function currentPage() {
            return paginationWrapperService.getCurrentPage();
        }

        function pageSize() {
            return paginationWrapperService.getPageSize();
        }

        //implementation of logout
        function logout() {
            authService.logout();
            $location.path("/login");
        }

        function login() {
            $location.path("/login")
        }

        // method implementations
        function applyTheme(filename) {
            if (localStorageSupported) {
                localStorage.setItem('theme', filename);
                location.reload();
            }
        }

        function deleteDashboard(id) {
            dashboardData.delete(id).then(function () {
                _.remove(ctrl.dashboards, {id: id});
            });
            paginationWrapperService.calculateTotalItems();
        }

        function editDashboard(item) {
            console.log("Edit Dashboard in Admin");

            var mymodalInstance = $uibModal.open({
                templateUrl: 'app/dashboard/views/editDashboard.html',
                controller: 'EditDashboardController',
                controllerAs: 'ctrl',
                resolve: {
                    dashboardItem: function () {
                        return item;
                    }
                }
            });

            mymodalInstance.result.then(function success() {
                dashboardData.search().then(processResponse);
                userData.getAllUsers().then(processUserResponse);
                userData.apitokens().then(processTokenResponse);
                templateMangerData.getAllTemplates().then(processTemplateResponse);
            });
        }

        function editToken(item) {
            console.log("Edit token in Admin");

            var mymodalInstance=$uibModal.open({
                templateUrl: 'app/dashboard/views/editApiToken.html',
                controller: 'EditApiTokenController',
                controllerAs: 'ctrl',
                resolve: {
                    tokenItem: function() {
                        return item;
                    }
                }
            });

            mymodalInstance.result.then(function() {
                userData.apitokens().then(processTokenResponse);
            });
        }

        function deleteToken(id) {
            userData.deleteToken(id).then(function() {
                _.remove( $scope.apitokens , {id: id});
            });
        }

        function generateToken() {
            console.log("Generate token in Admin");

            var mymodalInstance = $uibModal.open({
                templateUrl: 'app/dashboard/views/generateApiToken.html',
                controller: 'GenerateApiTokenController',
                controllerAs: 'ctrl',
                resolve: {}
            });

            mymodalInstance.result.then(function (condition) {
                window.location.reload(false);
            });
        }

        function processResponse(data) {
            ctrl.dashboards = paginationWrapperService.processDashboardResponse(data);
        }

        function processUserResponse(response) {
            $scope.users = response.data;
        }

        function processTokenResponse(response) {
            $scope.apitokens = response.data;
        }

        function processTemplateResponse(data) {
            ctrl.templates = data;
        }

        function processMetricResponse(response) {
            var data = response.data;

            ctrl.metricList.forEach(function(metric) {
                // Check if metric exists in db already
                data.forEach(function(entry) {
                   if (metric.metricName === entry.metricName) {
                       metric.enabled = entry.enabled;
                       metric.gamificationScoringRanges = entry.gamificationScoringRanges;
                   }
                });

                ctrl.metricData.push(metric);
            });
        }

        // navigate to create template modal
        function goToManager() {
            var modalInstance = $uibModal.open({
                templateUrl: 'app/dashboard/views/templateManager.html',
                controller: 'TemplateController',
                controllerAs: 'ctrl',
                size: 'lg',
                resolve: {}
            }).result.then(function (config) {
                window.location.reload(true);
            });
        }

        // Edit template
        function editTemplate(item) {
            console.log("Edit Template in Admin");
            var mymodalInstance = $uibModal.open({
                templateUrl: 'app/dashboard/views/editTemplate.html',
                controller: 'EditTemplateController',
                controllerAs: 'ctrl',
                size: 'md',
                resolve: {
                    templateObject: function () {
                        return item;
                    }
                }
            });

            mymodalInstance.result.then(function success() {
                dashboardData.search().then(processResponse);
                userData.getAllUsers().then(processUserResponse);
                userData.apitokens().then(processTokenResponse);
                templateMangerData.getAllTemplates().then(processTemplateResponse);
            });
        }

        //Delete template
        function deleteTemplate(item) {
            var id = item.id;
            var dashboardsList = [];
            dashboardData.search().then(function (response) {
                _(response).forEach(function (dashboard) {
                    if (dashboard.template == item.template) {
                        dashboardsList.push(dashboard.title);
                    }
                });
                if (dashboardsList.length > 0) {
                    var dash = '';
                    for (var dashboardTitle in dashboardsList) {
                        dash = dash + '\n' + dashboardsList[dashboardTitle];
                    }
                    swal({
                        title: 'Template used in existing dashboards',
                        text: dash,
                        html: true,
                        type: "warning",
                        showConfirmButton: true,
                        closeOnConfirm: true
                    });
                } else {
                    templateMangerData.deleteTemplate(id).then(function () {
                        _.remove(ctrl.templates, {id: id});
                    }, function (response) {
                        var msg = 'An error occurred while deleting the Template';
                        swal(msg);
                    });
                }
            });
        }

        //View template details
        function viewTemplateDetails(myitem) {
            ctrl.templateName = myitem.template;
            templateMangerData.search(myitem.template).then(function (response) {
                ctrl.templateDetails = response;
                $uibModal.open({
                    templateUrl: 'app/dashboard/views/templateDetails.html',
                    controller: 'TemplateDetailsController',
                    controllerAs: 'ctrl',
                    size: 'lg',
                    resolve: {
                        modalData: function () {
                            return {
                                templateDetails: ctrl.templateDetails
                            }
                        }
                    }
                });
            });
        }

        function deleteMetricRange(sel) {
            var idx = -1;
            $scope.selectedMetric.gamificationScoringRanges.forEach(function(range, i) {
                if (sel.min === range.min && sel.max == range.max && sel.score === range.score)
                    idx = i;
            });

            $scope.selectedMetric.gamificationScoringRanges.splice(idx, 1);
        }

        function addMetricRange() {
            $scope.selectedMetric.gamificationScoringRanges.push({min: 0, max: 0, score: 0});
        }

        function saveMetrics() {
            if($scope.selectedMetric != undefined) {
                var isValidationSuccessful = ctrl.validateScoringRanges($scope.selectedMetric.gamificationScoringRanges);
                if(isValidationSuccessful) {
                    gamificationMetricData.storeMetricData($scope.selectedMetric).then(validatePost);
                    $scope.exitEditMode();
                } else {
                    $scope.enterEditMode();
                }
            }

        }

        function isInteger(number) {
            return (number == parseInt(number,10))  && !isNaN(parseInt(number));
        }

        function validateScoringRanges(gamificationScoringRanges) {
            var prevMax = null;
            var prevMin = null;
            if(gamificationScoringRanges.length == 0) {
                $scope.createAlert("At least one range needs to be added to save.", "error");
                return false;
            }
            var isValidationSuccessful = true;
            var ValidationException = {};
            try {
                gamificationScoringRanges.forEach(function(range, i) {
                    if(!isInteger(range.min) || !isInteger(range.max) || !isInteger(range.score)) {
                        $scope.createAlert("Non numeric range provided. Only integers accepted for the ranges and score", "error");
                        throw ValidationException;
                    }
                    if(i > 0) {
                        if(prevMin == range.min && prevMax == range.max) {
                            $scope.createAlert("Duplicates detected in the scoring ranges.", "error");
                            throw ValidationException;
                        }
                        if(range.min <= prevMax || range.min - prevMax > 1) {
                            $scope.createAlert("Overlap and/or gaps detected in the scoring ranges.", "error");
                            throw ValidationException;
                        }
                    }
                    if(range.min > range.max) {
                        $scope.createAlert("Min should be less than the max in a scoring range.", "error");
                        throw ValidationException;
                    }
                    prevMin = range.min;
                    prevMax = range.max;
                });
            } catch (e) {
                isValidationSuccessful = false;
                if(e != ValidationException) throw e;
            }
            return isValidationSuccessful;
        }

        function saveStatusData(metric) {
            gamificationMetricData.storeMetricData(metric).then(validatePostStatus);
        }

        function validatePost(response) {
            console.log(response);
            if (response.status === 200 || response.status === 201) {
                $scope.createAlert("Changes have been saved successfully!", "success");
            } else {
                $scope.createAlert("There was an error and your changes have not been saved", "error");
            }
        }

        function validatePostStatus(response) {
            console.log(response);
        }

        $scope.navigateToTab = function (tab) {
            $scope.tab = tab;
        }

        $scope.isActiveUser = function (user) {
            if (user.authType === ctrl.authType && user.username === ctrl.username) {
                return true;
            }
            return false;
        }

        $scope.promoteUserToAdmin = function (user) {
            userData.promoteUserToAdmin(user).then(
                function (response) {
                    var index = $scope.users.indexOf(user);
                    $scope.users[index] = response.data;
                },
                function (error) {
                    $scope.error = error;
                }
            );
        }

        $scope.demoteUserFromAdmin = function (user) {
            userData.demoteUserFromAdmin(user).then(
                function (response) {
                    var index = $scope.users.indexOf(user);
                    $scope.users[index] = response.data;
                },
                function (error) {
                    $scope.error = error;
                }
            );
        }

        $scope.switchMetric = function(metricName) {
            ctrl.metricData.forEach(function(obj, idx) {
                if (obj.metricName === metricName)
                    $scope.selectedMetric = ctrl.metricData[idx];
            });
        }

        $scope.createAlert = function(message, type) {
            $scope.metricAlert = {msg: message, type: type};
        }

        $scope.removeAlert = function() {
            $scope.metricAlert = null;
        }

        $scope.rangeLabel = "<= VALUE <=";

        $scope.enterEditMode = function() {
            $scope.editMode[$scope.selectedMetric.metricName] = true;
        }

        $scope.exitEditMode = function() {
            $scope.editMode[$scope.selectedMetric.metricName] = false;
        }
    }
})();
