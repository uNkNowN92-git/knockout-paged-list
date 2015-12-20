var PagedList = function (params) {
    return function (params) {
        var self = this;


        /* VARIABLES */

        // Settings/Options variables
        
        self.queryOnLoad = params.queryOnLoad !== undefined ? params.queryOnLoad : true;
        self.defaultEntriesPerPage = params.entriesPerPage || 5;
        self.defaultUrl = params.url;
               
        // Paging variables
        
        self.url = ko.observable();
        self.data = ko.observableArray();
        self.pageNumber = ko.observable(1);
        self.totalEntries = ko.observable(0);
        self.entriesPerPage = ko.observable(self.defaultEntriesPerPage);

        self.entries = ko.computed(function () {
            var first = (self.pageNumber() - 1) * self.entriesPerPage();
            return self.data.slice(first, first + self.entriesPerPage());
        });
        
        // Server-related variables
        
        self.error = ko.observableArray();
        self.loading = ko.observable();
        
        // Filtering variable
        
        self.filter = ko.observableArray();

        // Sorting variables
        
        self.header = ko.observableArray();
        self.sortOnly = ko.observable();
        self.activeSort = ko.observableArray();
     
     
        /* HELPERS */
        
        // Server-related helpers
        
        self.setUrl = function (url) {
            self.url(url !== undefined ? url : self.defaultUrl);
        };

        self.hasError = ko.computed(function () {
            return self.error().length !== 0;
        });

        self.errorCode = ko.computed(function () {
            return self.error().jqXHR !== undefined ? self.error().jqXHR.status : null;
        });

        self.parserError = ko.computed(function () {
            return self.error().status !== undefined ? self.error().status === "parsererror" : false;
        });
        
        // Paging helpers

        self.hasEntries = function () {
            return self.totalEntries() > 0;
        };

        self.totalPages = ko.computed(function () {
            return Math.ceil(self.totalEntries() / self.entriesPerPage());
        });

        self.onFirstPage = ko.computed(function () {
            return self.pageNumber() === 1;
        });

        self.onLastPage = ko.computed(function () {
            return self.pageNumber() >= self.totalPages();
        });

        self.showFirstEntriesEnabled = function () {
            return self.hasEntries() && self.totalEntries() > self.defaultEntriesPerPage;
        };

        self.firstEntriesCount = ko.computed(function () {
            return self.totalEntries() < self.entriesPerPage() ? self.totalEntries() : self.defaultEntriesPerPage;
        });

        self.previousItemsCount = ko.computed(function () {
            return self.defaultEntriesPerPage;
        });

        self.nextItemsCount = ko.computed(function () {
            return self.totalPages() - self.pageNumber() == 1 ?
                self.totalEntries() - (self.entriesPerPage() * (self.totalPages() - 1)) :
                self.defaultEntriesPerPage;
        });

        self.shownAll = function () {
            return self.entriesPerPage() >= self.totalEntries();
        };

        self.loadedEntries = function () {
            return self.data().length;
        };

        self.totalEntriesOnNextPage = function () {
            return (self.pageNumber() + 2) * self.entriesPerPage();
        };
        
        /* FUNCTIONS */
        
        // Paging functions
        
        self.firstPage = function () {
            self.pageNumber(1);
        };

        self.lastPage = function () {
            self.pageNumber(self.totalPages());
        };

        self.next = function () {
            if (self.pageNumber() < self.totalPages()) {
                if (self.loadedEntries() < self.totalEntriesOnNextPage() &&
                    self.loadedEntries() != self.totalEntries()) {
                        
                    ExecuteQuery(true);
                } else {
                    self.pageNumber(self.pageNumber() + 1);
                }
            }
        };

        self.previous = function () {
            if (self.pageNumber() !== 0) {
                self.pageNumber(self.pageNumber() - 1);
            }
        };

        self.showFirstEntries = function () {
            self.pageNumber(1);
            self.entriesPerPage(self.defaultEntriesPerPage);
        };

        self.showAll = function () {
            self.pageNumber(1);
            self.entriesPerPage(self.totalEntries());

            if (self.loadedEntries() < self.totalEntries())
                ExecuteQuery();
        };
        
        // Sort functions

        self.sort = function (column, data, event) {
            GetDataUrl(event);
            
            if ($.inArray(column, self.header()) !== -1) {
                var sort = {
                    column: column,
                    asc: true
                };

                if (self.activeSort().column === column) {
                    sort.asc = !self.activeSort().asc;
                }

                self.activeSort(sort);
                self.sortOnly(true);
                ExecuteQuery();
            }
        };
        
        // Server-related functions 

        self.getList = function (data, event) {
            GetDataUrl(event);
            
            self.pageNumber(1);
            self.entriesPerPage(self.defaultEntriesPerPage);
            ExecuteQuery();
        };


        /* METHODS */
        
        // Get value from 'data-url' attribute
        // i.e. <span data-url="sample/url"></span>
        function GetDataUrl(event) {
            var url = $(event.target).data("url");
            self.setUrl(url);
        }

        function ExecuteQuery(appendData) {
            if (self.url() !== undefined) {
                self.loading(true);

                var queryOptions = BuildQueryOptions(appendData);

                $.getJSON(self.url(), queryOptions, function (response) {

                    ProcessResponse(response, appendData);

                }).fail(ExtractError).always(function () {
                    self.loading(false);
                });
            }
        }

        function BuildQueryOptions(appendData) {
            // Paging options
            var queryOptions = {
                page: self.pageNumber() + (appendData ? 1 : 0),
                perPage: self.entriesPerPage(),
                currentEntries: self.loadedEntries(),
            };

            // Sorting options
            if (self.activeSort()) {
                $.extend(queryOptions, {
                    sortBy: self.activeSort().column,
                    sortAsc: self.activeSort().asc,
                    sortOnly: self.sortOnly()
                });
                // Reset sortOnly to false (default) after using
                self.sortOnly(false);
            }
            
            // Query or Filters
            $.extend(queryOptions, self.filter());

            return queryOptions;
        }

        function ProcessResponse(response, appendData) {
            if (response.data.length > 0) {
                if (appendData) {
                    ko.utils.arrayPushAll(self.data(), response.data);
                    
                    // Increment page number after loading data so that the
                    // display will not be empty while waiting for the response
                    if (self.pageNumber() < self.totalPages())
                        self.pageNumber(self.pageNumber() + 1);
                } else {
                    ExtractHeader(response);
                    self.data(response.data);
                }
            }

            self.totalEntries(response.details.totalEntries);
        }

        // Used in determining whether column to be sort is valid
        // or existing in the header array
        function ExtractHeader(response) {
            if (self.header().length === 0) {
                var header = $.map(response.data[0], function (v, i) { return i; });
                self.header(header);
            }
        }

        function ExtractError(jqXHR, status, error) {
            self.error({
                jqXHR: jqXHR,
                status: status,
                error: error
            });
        }
        
        
        /* INITIALIZATION */

        function init() {
            if (self.defaultUrl !== undefined) {
                self.setUrl(self.defaultUrl);

                if (self.queryOnLoad)
                    self.getList();
            }
        }

        init();
    };
} ();