var PagedList = (function ($, ko) {
    'use strict';
    
    return function (option) {
        var self = this;


        /* PROTOTYPES */

        Array.prototype.updateItems = function (index, newItems) {
            if (newItems === undefined) return;

            Array.prototype.splice.apply(this, [index, newItems.length].concat(newItems));
        };


        /* VARIABLES */

        /* Mapping variables */

        var _mapping;
        var _dataPropertyCount = 0;

        /* Data variables */

        var _currentData = [];

        /* Paging variables */

        var _url = ko.observable();
        var _queryOptions = ko.observable();
        var _requestedPage = ko.observable(1);
        var _requestedEntriesPerPage = ko.observable(1);
        var _isPreserveCurrentPage = false;
        var _pageNumber = ko.observable();

        /* Settings/Options variables */

        var _defaultUrl = "/";
        var _dataAsObservable;
        var _queryOnLoad = true;
        var _defaultEntriesPerPage = 5;
        var _clearLoadedDataOnError = false;
        var _queryOnFilterChangeOnly = true;

        /* Server-related variables */
        var responseData;
        var responseTotalEntries;
        var responseDetails;
        self.request = undefined;


        /* CONFIGURE OPTIONS */

        ConfigureOptions();


        /* OBSERVABLES */

        /* Paging observables */

        self.data = ko.observableArray([]);
        self.currentPage = ko.observable(1);
        self.entriesPerPage = ko.observable(_defaultEntriesPerPage);
        self.totalEntries = ko.observable(0);
        self.isPageReloadRequired = ko.observable(false);

        /* Server-related observables */

        self.headers = ko.observableArray();
        self.error = ko.observableArray();
        self.loading = ko.observable(false);

        /* Filtering observables */

        self.filter = ko.observableArray();
        self.appliedFilter = ko.observableArray();

        /* Sorting observables */

        self.columns = ko.observableArray();
        self.sortOnly = ko.observable(false);
        self.activeSort = ko.observableArray();


        /* HELPERS */

        /* Paging helpers */

        self.pageNumber = ko.pureComputed({
            write: function (value) {
                _pageNumber(value);
            },
            read: function () {
                return self.currentPage();
            }
        });

        self.pageNumbers = ko.pureComputed(function () {
            var _pageNumbers = [];

            for (var i = 1; i <= self.totalPages() ; i++) {
                _pageNumbers.push(i);
            }

            return _pageNumbers;
        });

        // Entries to display
        self.entries = ko.pureComputed(function () {
            var first = GetCurrentPageStartIndex();
            return self.data.slice(first, first + self.entriesPerPage());
        });

        self.hasEntries = ko.pureComputed(function () {
            return self.totalEntries() > 0;
        });

        self.totalPages = ko.pureComputed(function () {
            var pages = Math.ceil(self.totalEntries() / self.entriesPerPage());
            return pages > 0 ? pages : 1;
        });

        self.previousEnabled = ko.pureComputed(function () {
            return self.currentPage() !== 1 && self.loading() === false && !self.hasError();
        });

        self.nextEnabled = ko.pureComputed(function () {

            return self.currentPage() !== self.totalPages() && self.loading() === false && !self.hasError();
        });

        self.showAllEntriesEnabled = ko.pureComputed(function () {
            return self.totalEntries() > _defaultEntriesPerPage && self.loading() === false && !self.hasError();
        });

        self.showFirstEntriesEnabled = ko.pureComputed(function () {
            return self.hasEntries() && self.totalEntries() > _defaultEntriesPerPage && self.loading() === false && !self.hasError();
        });

        self.firstEntriesCount = ko.pureComputed(function () {
            return self.totalEntries() < self.entriesPerPage() ? self.totalEntries() : _defaultEntriesPerPage;
        });

        self.previousItemsCount = ko.pureComputed(function () {
            return _defaultEntriesPerPage;
        });

        self.nextItemsCount = ko.pureComputed(function () {
            return self.totalPages() - self.currentPage() === 1 ?
                self.totalEntries() - (self.entriesPerPage() * (self.totalPages() - 1)) :
                _defaultEntriesPerPage;
        });

        self.loadedEntriesCount = ko.pureComputed(function () {
            var data = self.data();
            var _data = typeof (data) === "function" ? data() : data;

            return NotEmptyItemsCount(_data);
        });

        self.shownAll = ko.pureComputed(function () {
            return self.totalEntries() <= _defaultEntriesPerPage ? false : self.entriesPerPage() >= self.totalEntries();
        });

        self.totalEntriesOnNextPage = function () {
            return _requestedPage() * _requestedEntriesPerPage();
        };

        /* Server-related helpers */

        self.url = ko.pureComputed(function () {
            return _url();
        });

        self.queryOptions = ko.pureComputed(function () {
            return _queryOptions();
        });

        self.hasError = ko.pureComputed(function () {
            return self.error().length !== 0;
        });

        self.errorCode = ko.pureComputed(function () {
            return self.error().jqXHR !== undefined ? self.error().jqXHR.status : null;
        });

        self.parserError = ko.pureComputed(function () {
            return self.error().status !== undefined ? self.error().status === "parsererror" : false;
        });


        /* FUNCTIONS */

        /* Paging functions */

        self.preserveCurrentPage = function (isPreserve) {
            _isPreserveCurrentPage = isPreserve !== undefined ? isPreserve : false;
        };

        self.goToPage = function () {
            var pageNumber = _pageNumber();
            if (pageNumber < 1) return;

            _requestedPage(pageNumber);
            UpdateDisplayedEntries();
        };

        self.firstPage = function () {
            _requestedPage(1);
            UpdateDisplayedEntries();
        };

        self.lastPage = function () {
            _requestedPage(self.totalPages());
            UpdateDisplayedEntries();
        };

        self.next = function () {
            if (self.currentPage() < self.totalPages()) {
                _requestedPage(self.currentPage() + 1);

                UpdateDisplayedEntries();
            }
        };

        self.previous = function () {
            if (self.currentPage() > 1) {
                _requestedPage(self.currentPage() - 1);

                UpdateDisplayedEntries();
            }
        };

        self.showFirstEntries = function () {
            _requestedPage(1);
            _requestedEntriesPerPage(_defaultEntriesPerPage);

            UpdateDisplayedEntries();
        };

        self.showAll = function () {
            _requestedPage(1);
            _requestedEntriesPerPage(self.totalEntries());

            UpdateDisplayedEntries();
        };

        /* Sort functions */

        self.sort = function (column, data, event) {
            if (self.columns() === undefined) return;
            if (self.totalEntries() <= 1) return;

            if (event !== undefined) {
                GetDataUrl(event);
            } else {
                GetDataUrl(data);
                column = GetDataSortField(data);
            }

            if ($.inArray(column, self.columns()) !== -1) {
                var sort = {
                    column: column,
                    asc: true
                };

                if (self.activeSort().column === column) {
                    sort.asc = !self.activeSort().asc;
                }

                self.activeSort(sort);
                self.sortOnly(true);

                UpdateDisplayedEntries();
            }
        };

        /* Server-related functions */

        self.setUrl = function (url) {
            _url(url !== undefined ? url : _defaultUrl);
        };

        self.getList = function (data, event) {
            if (_isPreserveCurrentPage === true) _requestedPage(self.currentPage());
            else _requestedPage(1);

            GetDataUrl(event);

            UpdateDisplayedEntries();
        };


        /* *** PRIVATE *** */

        /* METHODS */

        /* Mapping methods */

        function MapData() {
            var mappedData;

            if (_dataAsObservable === false) {
                // dont make all data observable
                mappedData = _currentData;

            } else if (_mapping === undefined) {
                // make all data observable
                mappedData = ko.mapping.fromJS(_currentData);

            } else {
                // make all data observable
                mappedData = ko.mapping.fromJS(_currentData, _mapping);

            }

            // update data from mappedData
            self.data(mappedData);
        }

        function isEmptyObject(obj) {
            var property = [],
                name;

            for (name in obj) {
                property.push(name);

                if (property.length > _dataPropertyCount)
                    return false;
            }
            return true;
        }

        function GetPropertiesCount(obj) {
            var property = [],
                name;

            for (name in obj) {
                property.push(name);
            }

            return property.length;
        }

        /* Paging methods */

        function ShowAll() {
            return _requestedPage() === 1 && self.entriesPerPage() === self.totalEntries();
        }

        function UpdateDisplayedEntries() {
            // Order by priority
            if (FiltersHasChanged()) {
                // Request fresh data
                _requestedPage(1);
                _requestedEntriesPerPage(_defaultEntriesPerPage);
                ExecuteQuery();

            } else if (_queryOnFilterChangeOnly === false) {
                // Request on filter change only
                ExecuteQuery();

            } else if (self.sortOnly()) {
                // Request sorted data
                ExecuteQuery();

            } else if (UpdateNeeded()) {
                // Request additional data
                ExecuteQuery();

            } else if (PageReloadIsRequired()) {
                // Request updated data due to deletion or update
                ExecuteQuery();

            } else {
                // Update paging only
                self.currentPage(_requestedPage());
                self.entriesPerPage(_requestedEntriesPerPage());

            }
        }

        function FiltersHasChanged() {
            var currentFilter = {};
            $.extend(currentFilter, [self.filter()][0]);

            // Use simple comparison to remove dependency on underscore.js
            if (ko.toJSON(currentFilter) != ko.toJSON(self.appliedFilter())) {
                // if (!_.isEqual(currentFilter, self.appliedFilter())) {
                self.appliedFilter(currentFilter);
                return true;
            }

            return false;
        }

        function UpdateNeeded() {
            return (self.loadedEntriesCount() < self.totalEntriesOnNextPage() &&
                self.loadedEntriesCount() !== self.totalEntries()) ||
                !EntriesOnPageIsLoaded();
        }

        function EntriesOnPageIsLoaded() {
            var result = true;
            var startIndex = (_requestedPage() - 1) * _requestedEntriesPerPage();
            var entriesOnPage = self.data.slice(startIndex, startIndex + _requestedEntriesPerPage());
            $.each(entriesOnPage, function (index, value) {
                if (isEmptyObject(value)) result = false;
            });
            return result;
        }

        function PageReloadIsRequired() {
            var result = self.isPageReloadRequired() === true;

            // Reset after use
            self.isPageReloadRequired(false);

            return result;
        }

        /* Server-related methods */

        // Get value from 'data-url' attribute
        // i.e. <span data-url="sample/url"></span>
        function GetDataUrl(event) {
            var url = event !== undefined ? $(event.target).data("url") : undefined;
            self.setUrl(url);
        }

        // Get value from 'data-sort-field' attribute
        // i.e. <button data-sort-field="columnName" data-bind="click: sort"></button>
        function GetDataSortField(event) {
            return event !== undefined ? $(event.target).data("sort-field") : undefined;
        }

        function ExecuteQuery() {
            if (_url() !== undefined) {
                CancelPreviousRequest();
                self.loading(true);
                self.error([]);

                _queryOptions(BuildQueryOptions());

                self.request = $.ajax({
                    url: _url().toString(),
                    method: 'get',
                    dataType: 'json',
                    data: _queryOptions(),
                    success: ProcessResponse,
                    error: ProcessError,
                    beforeSend: SetHeader
                }).always(function () {
                    self.loading(false);
                    self.entriesPerPage(_requestedEntriesPerPage());
                });
            }
        }

        function CancelPreviousRequest() {
            if (self.request && self.request.readyState !== 4) {
                self.request.abort();
            }
        }

        function SetHeader(xhr) {
            $.each(self.headers(), function (key, value) {
                xhr.setRequestHeader(key, value);
            });
        }

        function BuildQueryOptions() {
            // Paging options
            var queryOptions = {
                page: _requestedPage(),
                perPage: _requestedEntriesPerPage(),
                currentEntries: self.loadedEntriesCount(),
                showAll: ShowAll()
            };

            // Sorting options
            if (self.activeSort()) {
                $.extend(queryOptions, {
                    sortBy: self.activeSort().column,
                    sortAsc: self.activeSort().asc,
                    sortOnly: self.sortOnly()
                });
            }

            // Filtering options
            $.extend(queryOptions, self.filter());

            delete queryOptions.updateItems;
            return queryOptions;
        }

        function ProcessResponse(response) {
            responseData = ValueOrDefault(response.data, response.Data);
            responseDetails = ValueOrDefault(response.details, response.Details);
            responseTotalEntries = ValueOrDefault(responseDetails.totalEntries, responseDetails.TotalEntries);

            if (responseData.length > 0) {
                ProcessResponseData();

                // Update current page to requested page
                self.currentPage(_requestedPage());
            }

            ProcessResponseDetails();
            self.error([]);
        }

        function ProcessResponseData() {
            var objectLength = _requestedPage() * _requestedEntriesPerPage() <= responseTotalEntries ?
                _requestedPage() * _requestedEntriesPerPage() : responseTotalEntries;

            var data = CreateEmptyObjectArray(objectLength);

            // retrieve existing data
            var existingData = self.data();

            if (typeof (existingData) === "function") {
                // trim excess
                existingData.splice(responseTotalEntries, existingData().length - responseTotalEntries);

                // update items from existing data
                data.updateItems(0, existingData());
            } else {
                existingData.splice(responseTotalEntries, existingData.length - responseTotalEntries);

                // update items from existing data
                data.updateItems(0, existingData);
            }

            // update items from response data
            if (self.sortOnly()) {
                data.updateItems(0, responseData);
                self.sortOnly(false);
            } else {
                data.updateItems(GetRequestedPageStartIndex(), responseData);
            }

            // extract columns
            ExtractColumns(data[0]);

            // store to global variable currentData
            _currentData = data;

            // map current data to observble data
            MapData();
        }

        // Used in determining whether column to be sort is valid
        // or existing in the columns array
        function ExtractColumns(data) {
            if (self.columns().length === 0 || _queryOnFilterChangeOnly === false) {
                var columns = $.map(data, function (v, i) { return i; });
                self.columns(columns);
            }
        }

        function ProcessResponseDetails() {
            if (responseTotalEntries === 0) {
                self.data([]);
            }

            self.totalEntries(responseTotalEntries);
        }

        function ProcessError(jqXHR, status, error) {
            self.error({
                jqXHR: jqXHR,
                status: status,
                error: error
            });

            $.extend(self.appliedFilter(), { error: true });

            if (_clearLoadedDataOnError) {
                // Clear previous laoded data
                self.data([]);
            }
        }

        function GetCurrentPageStartIndex() {
            return (self.currentPage() - 1) * self.entriesPerPage();
        }

        function GetRequestedPageStartIndex() {
            return (_requestedPage() - 1) * self.entriesPerPage();
        }

        function CreateEmptyObjectArray(size) {
            return $.map(Array.apply(null, Array(size)), function () { return {}; });
        }

        function NotEmptyItemsCount(array) {
            return $.map(array, function (item, index) {
                if (!isEmptyObject(item)) {
                    return index;
                }
            }).length;
        }

        /* Helpers */

        function ValueOrDefault(value, defaultValue) {
            return value !== undefined ? value : defaultValue;
        }

        /* Initialization */

        function ConfigureOptions() {

            if (option) {
                _defaultUrl = ValueOrDefault(option.url, _defaultUrl);
                _queryOnLoad = ValueOrDefault(option.queryOnLoad, _queryOnLoad);
                _defaultEntriesPerPage = ValueOrDefault(option.entriesPerPage, _defaultEntriesPerPage);
                _clearLoadedDataOnError = ValueOrDefault(option.clearLoadedDataOnError, _clearLoadedDataOnError);
                _queryOnFilterChangeOnly = ValueOrDefault(option.queryOnFilterChangeOnly, _queryOnFilterChangeOnly);
                _mapping = ValueOrDefault(option.mapping, _mapping);
                // setting dataAsObservable to false will make the mapping option to be useless
                _dataAsObservable = ValueOrDefault(option.dataAsObservable,
                    _dataAsObservable === undefined && _mapping !== undefined ? true : false);

                if (_dataAsObservable === true && _mapping !== undefined) {
                    _dataPropertyCount = GetPropertiesCount(_mapping.create({ data: {} }));
                } else {
                    _dataPropertyCount = 0;
                }
            }
        }

        function Init() {

            if (_defaultUrl !== undefined) {
                self.setUrl(_defaultUrl);

                // Load initial data
                if (_queryOnLoad)
                    self.getList();
            }
        }

        Init();

    };
})(jQuery, ko);