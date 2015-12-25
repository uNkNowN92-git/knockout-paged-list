/*
 * knockout-paged-list v1.0.5
 * A KnockoutJS Plugin for Paged List/Grid
 * @repository https://github.com/uNkNowN92-git/knockout-paged-list.git
 * @license ISC
 */
var PagedList = function (option) {
    return function (option) {
        var self = this;


        /* PROTOTYPES */

        Array.prototype.updateItems = function (index, newItems) {
            if (newItems === undefined) return;

            Array.prototype.splice.apply(this, [index, newItems.length].concat(newItems));
        };


        /* VARIABLES */

        /* Settings/Options variables */

        self.defaultUrl = undefined;
        self.queryOnLoad = true;
        self.defaultEntriesPerPage = 5;
        self.clearLoadedDataOnError = false;
        self.queryOnFilterChangeOnly = true;

        /* Server-related variables */

        self.request = undefined;


        /* CONFIGURE OPTIONS */

        function ConfigureOptions() {

            if (option) {
                self.defaultUrl = option.url !== undefined ? option.url : self.defaultUrl;
                self.queryOnLoad = option.queryOnLoad !== undefined ? option.queryOnLoad : self.queryOnLoad;
                self.defaultEntriesPerPage = option.entriesPerPage !== undefined ? option.entriesPerPage : self.defaultEntriesPerPage;
                self.clearLoadedDataOnError = option.clearLoadedDataOnError !== undefined ? option.clearLoadedDataOnError : self.clearLoadedDataOnError;
                self.queryOnFilterChangeOnly = option.queryOnFilterChangeOnly !== undefined ? option.queryOnFilterChangeOnly : self.queryOnFilterChangeOnly;
            }
        }

        ConfigureOptions();


        /* OBSERVABLES */

        /* Paging observables */

        self.url = ko.observable();
        self.data = ko.observableArray();
        self.currentPage = ko.observable(1);
        self.requestedPage = ko.observable(1);
        self.entriesPerPage = ko.observable(self.defaultEntriesPerPage);
        self.totalEntries = ko.observable(0);

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

        // Entries to display
        self.entries = ko.computed(function () {
            var first = GetCurrentPageStartIndex();
            return self.data.slice(first, first + self.entriesPerPage());
        });

        self.hasEntries = ko.computed(function () {
            return self.totalEntries() > 0;
        });

        self.totalPages = ko.computed(function () {
            var pages = Math.ceil(self.totalEntries() / self.entriesPerPage());
            return pages > 0 ? pages : 1;
        });

        self.previousEnabled = ko.computed(function () {
            return self.currentPage() !== 1 && self.loading() === false;
        });

        self.nextEnabled = ko.computed(function () {
            return self.currentPage() !== self.totalPages() && self.loading() === false;
        });

        self.showFirstEntriesEnabled = ko.computed(function () {
            return self.hasEntries() && self.totalEntries() > self.defaultEntriesPerPage && self.loading() === false;
        });

        self.firstEntriesCount = ko.computed(function () {
            return self.totalEntries() < self.entriesPerPage() ? self.totalEntries() : self.defaultEntriesPerPage;
        });

        self.previousItemsCount = ko.computed(function () {
            return self.defaultEntriesPerPage;
        });

        self.nextItemsCount = ko.computed(function () {
            return self.totalPages() - self.currentPage() == 1 ?
                self.totalEntries() - (self.entriesPerPage() * (self.totalPages() - 1)) :
                self.defaultEntriesPerPage;
        });

        self.loadedEntriesCount = ko.computed(function () {
            return NotEmptyItemsCount(self.data());
        });

        self.shownAll = ko.computed(function () {
            return self.entriesPerPage() >= self.totalEntries();
        });

        self.totalEntriesOnNextPage = function () {
            return self.requestedPage() * self.entriesPerPage();
        };

        /* Server-related helpers */

        self.hasError = ko.computed(function () {
            return self.error().length !== 0;
        });

        self.errorCode = ko.computed(function () {
            return self.error().jqXHR !== undefined ? self.error().jqXHR.status : null;
        });

        self.parserError = ko.computed(function () {
            return self.error().status !== undefined ? self.error().status === "parsererror" : false;
        });

        /* FUNCTIONS */

        /* Paging functions */

        self.firstPage = function () {
            self.requestedPage(1);
            UpdateDisplayedEntries();
        };

        self.lastPage = function () {
            // Not yet implemented
            // self.currentPage(self.totalPages());
        };

        self.next = function () {
            if (self.currentPage() < self.totalPages()) {
                self.requestedPage(self.currentPage() + 1);

                UpdateDisplayedEntries();
            }
        };

        self.previous = function () {
            if (self.currentPage() > 1) {
                self.requestedPage(self.currentPage() - 1);

                UpdateDisplayedEntries();
            }
        };

        self.showFirstEntries = function () {
            self.requestedPage(1);
            self.entriesPerPage(self.defaultEntriesPerPage);

            UpdateDisplayedEntries();
        };

        self.showAll = function () {
            self.requestedPage(1);
            self.entriesPerPage(self.totalEntries());

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
            self.url(url !== undefined ? url : self.defaultUrl);
        };

        self.getList = function (data, event) {
            self.requestedPage(1);
            GetDataUrl(event);

            UpdateDisplayedEntries();
        };


        /* METHODS */

        /* Paging methods */

        function ShowAll() {
            return self.requestedPage() === 1 && self.entriesPerPage() === self.totalEntries();
        }

        function UpdateDisplayedEntries() {
            // Order by priority
            if (FiltersHasChanged()) {
                // Request fresh data
                self.requestedPage(1);
                self.entriesPerPage(self.defaultEntriesPerPage);
                ExecuteQuery();

            } else if (self.queryOnFilterChangeOnly === false) {
                // Request on filter change only
                ExecuteQuery();

            } else if (self.sortOnly()) {
                // Request sorted data
                ExecuteQuery();

            } else if (UpdateNeeded()) {
                // Request additional data
                ExecuteQuery();

            } else {
                // Update paging only
                self.currentPage(self.requestedPage());

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
            return self.loadedEntriesCount() < self.totalEntriesOnNextPage() &&
                self.loadedEntriesCount() != self.totalEntries();
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
            if (self.url() !== undefined) {
                CancelPreviousRequest();
                self.loading(true);
                self.error([]);

                var queryOptions = BuildQueryOptions();

                self.request = $.ajax({
                    url: self.url(),
                    method: 'get',
                    dataType: 'json',
                    data: queryOptions,
                    success: ProcessResponse,
                    error: ProcessError,
                    beforeSend: SetHeader
                }).always(function () {
                    self.loading(false);
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
                page: self.requestedPage(),
                perPage: self.entriesPerPage(),
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
            if (response.data.length > 0) {
                ProcessResponseData(response);

                // Update current page to requested page
                self.currentPage(self.requestedPage());
            }

            ProcessResponseDetails(response.details);
            self.error([]);
        }

        function ProcessResponseData(response) {
            var data = CreateEmptyObjectArray(response.details.totalEntries);

            // update items from existing data
            var existingData = self.data();
            existingData.splice(response.details.totalEntries, existingData.length - response.details.totalEntries); // trim excess
            data.updateItems(0, existingData);

            // update items from response data
            if (self.sortOnly()) {
                data.updateItems(0, response.data);
                self.sortOnly(false);
            } else {
                data.updateItems(GetRequestedPageStartIndex(), response.data);
            }

            // update ko data
            self.data(data);

            // extract columns
            ExtractColumns(data[0]);
        }

        // Used in determining whether column to be sort is valid
        // or existing in the columns array
        function ExtractColumns(data) {
            if (self.columns().length === 0 || self.queryOnFilterChangeOnly === false) {
                var columns = $.map(data, function (v, i) { return i; });
                self.columns(columns);
            }
        }

        function ProcessResponseDetails(details) {
            if (details.totalEntries === 0) {
                self.data([]);
            }
            self.totalEntries(details.totalEntries);
        }

        function ProcessError(jqXHR, status, error) {
            self.error({
                jqXHR: jqXHR,
                status: status,
                error: error
            });

            // Clear applied filters
            self.appliedFilter([]);

            if (self.clearLoadedDataOnError) {
                // Clear previous laoded data
                self.data([]);
            }
        }

        function GetCurrentPageStartIndex() {
            return (self.currentPage() - 1) * self.entriesPerPage();
        }

        function GetRequestedPageStartIndex() {
            return (self.requestedPage() - 1) * self.entriesPerPage();
        }

        function CreateEmptyObjectArray(size) {
            return $.map(Array.apply(null, Array(size)), function () { return {}; });
        }

        function NotEmptyItemsCount(array) {
            return $.map(array, function (item, index) {
                if (!$.isEmptyObject(item)) {
                    return index;
                }
            }).length;
        }


        /* INITIALIZATION */

        function Init() {

            if (self.defaultUrl !== undefined) {
                self.setUrl(self.defaultUrl);

                // Load initial data
                if (self.queryOnLoad)
                    self.getList();
            }
        }

        Init();

    };
}();