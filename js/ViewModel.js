(function () {
    var ViewModel = function (options) {
        var self = this;
        PagedList.call(self, options);

        /* Additional bindings */

        // This will contain the checked radio button
        // using 'data-bind="checked: $root.selectedItem"' attribute in an element 
        self.selectedItem = ko.observable(null);

        // Sample logic to enable submit button
        self.validInput = ko.computed(function () {
            return self.selectedItem() !== null;
        });

        self.ready = ko.observable(true);
    }

    var viewModel = new ViewModel({
        url: "data/values.json",            // url to request data from (can also be set using the 'data-url' attribute of an element)
        entriesPerPage: 2,             // entries to show per page (default = 5)
        queryOnLoad: false,            // defines whether to query on page load (default = true)
        clearLoadedDataOnError: true,   // previous data loaded will be cleared when an error occurs  (default = true)
        queryOnFilterChangeOnly: false
    });

    // Apply knockout bindings
    ko.applyBindings(viewModel, $("#demo")[0]); // Use this, if applying multiple bindings in one page
})();