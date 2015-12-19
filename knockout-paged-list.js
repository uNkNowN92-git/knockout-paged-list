var PagedList = function (params) {
    return function (params) {
        var self = this;

        self.defaultEntriesPerPage = params.entriesPerPage || 5;
        self.url = params.url || "";

        self.data = ko.observableArray();
        self.query = ko.observableArray();
        self.loading = ko.observable(false);
        self.pageNumber = ko.observable(1);
        self.totalEntries = ko.observable();
        self.entriesPerPage = ko.observable(self.defaultEntriesPerPage);

        self.totalPages = ko.computed(function () {
            var div = Math.floor(self.totalEntries() / self.entriesPerPage());
            div += self.totalEntries() % self.entriesPerPage() > 0 ? 1 : 0;
            return div;
        });
        self.entries = ko.computed(function () {
            var first = (self.pageNumber() - 1) * self.entriesPerPage();
            return self.data.slice(first, first + self.entriesPerPage());
        });
        self.onFirstPage = ko.computed(function () {
            return self.pageNumber() === 1 || self.totalEntries() === 0;
        });
        self.onLastPage = ko.computed(function () {
            return self.pageNumber() === self.totalPages() || self.totalEntries() === 0;
        });
        self.nextItemsCount = ko.computed(function () {
            return self.totalPages() - self.pageNumber() == 1 ? self.totalEntries() % self.entriesPerPage() : self.defaultEntriesPerPage;
        });
        self.previousItemsCount = ko.computed(function () {
            return self.defaultEntriesPerPage;
        });

        self.firstPage = function () {
            self.pageNumber(1);
        };
        self.lastPage = function () {
            self.pageNumber(self.totalPages());
        };
        self.next = function () {
            if (self.pageNumber() < self.totalPages()) {
                if (self.data().length < (self.pageNumber() + 2) * self.entriesPerPage() &&
                    self.data().length != self.totalEntries()) {
                    doQuery(true);
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

            if (self.data().length < self.totalEntries())
                doQuery();
        };
        self.shownAll = function () {
            return self.entriesPerPage() == self.totalEntries();
        };

        self.activeSort = ko.observableArray();
        self.headers = ko.observableArray();
        self.sortOnly = ko.observable(false);
        self.sort = function (column) {
            var index = self.headers().GetIndexByColumn(column);

            if (index !== undefined) {
                var header = self.headers()[index];

                if (self.activeSort().column === column) {
                    header.asc = !header.asc;
                }
                
                self.activeSort(header);
                self.sortOnly(true);
                doQuery();
            }
        };

        self.getList = function (appendData) {
            self.pageNumber(1);
            self.entriesPerPage(self.defaultEntriesPerPage);
            doQuery();
        };

        function doQuery(appendData) {
            self.loading(true);

            var options = {
                perPage: self.entriesPerPage(),
                page: self.pageNumber() + (appendData ? 1 : 0),
                currentEntries: self.data().length,
            };

            if (self.activeSort()) {
                $.extend(options, {
                    sortAsc: self.activeSort().asc,
                    sortBy: self.activeSort().column,
                    sortOnly: self.sortOnly()
                });
                self.sortOnly(false);
            }

            $.getJSON(self.url, $.extend(options, self.query()), function (response) {
                if (appendData) {
                    self.data.push.apply(self.data(), response.data);
                    self.pageNumber(self.pageNumber() + 1);
                } else {
                    self.data(response.data);
                    if (response.data[0] !== undefined && self.headers().length === 0) {
                        var headers = $.map(response.data[0], function (v, i) {
                            return { column: i, asc: true };
                        });
                        self.headers(headers);
                    }
                }
                self.totalEntries(response.details.totalEntries);
                self.loading(false);
            });
        }

        Array.prototype.GetIndexByColumn = function (column) {
            return $.map(self.headers(), function (value, index) {
                if (value.column === column) return index;
            })[0];
        };
    };
} ();
