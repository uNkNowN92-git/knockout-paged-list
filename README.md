#knockout-paged-list: A Knockout JS Plugin for Paged List/Grid

#Synopsis
This plugin uses **KnockoutJS** to create a [paged/paginated list/grid](#display).

* Data is [pulled from the server](#perform-request) by page when it is not present using $.getJSON() function. It is automatically invoked when pressing the [next](#paging) button.  
* It also has a built-in [filtering](#filtering) and [sorting](#sorting) options to filter the displayed result.

#Dependencies
> [KnockoutJS](http://knockoutjs.com/)  
 [jQuery](https://jquery.com/)

#Todo
* Write test scripts
* Create a demo page
* Include ASP.NET Web API integration snippets


#Usage

##Server-side
###Expected format of the JSON response from the server: 
```json
{
    "data":[
        {"columnId": 1, "column1": "value1", "column2": "value2", "column3": "value3"},
        {"columnId": 2, "column1": "value1", "column2": "value2", "column3": "value3"},
        {"columnId": 3, "column1": "value1", "column2": "value2", "column3": "value3"},
        {"columnId": 4, "column1": "value1", "column2": "value2", "column3": "value3"},
    ],
    "details":{
        "totalEntries": 4
    }
}
```

##Using ASP.NET Web API C♯

###Sample API Controller to handle the request
```csharp
public class ValuesController : ApiController
{
    // GET: api/values
    public PagedListResult<MyDataModel> Get([FromUri]MyFilters filters, [FromUri]PagedListOptions pagedListOptions)
    {
        var sampleData = new List<MyDataModel>();

        // TODO: Populate sample data here


        var data = sampleData.AsEnumerable(); // convert list to Enumerable

        // Filter Name
        if (!string.IsNullOrEmpty(filters.Name))
            data = data.Where(x => x.Name == filters.Name);

        // Filter Age
        if (filters.Age > 0)
            data = data.Where(x => x.Age == filters.Age);

        // define default field to sort
        pagedListOptions.SortBy = pagedListOptions.SortBy ?? "VehicleID";

        // convert to PagedListResult
        var pagedList = data.ToPagedListResult(pagedListOptions);

        return pagedList;
    }
}
```

###Sample Models to be used handle the request:
```csharp
// Model to be used for the paging and sorting of the data
public class PagedListOptions
{
    public PagedListOptions()
    {
        // Set default values
        Page = 1;
        PerPage = 5;
        SortAsc = true;
    }
    
    /* Values passed by the getJSON request */
    
    // For paging

    public int CurrentEntries { get; set; }

    public int Page { get; set; }

    public int PerPage { get; set; }

    public bool ShowAll { get; set; }
    
    // For sorting

    public bool SortOnly { get; set; }

    public bool SortAsc { get; set; }

    public string SortBy { get; set; }
    
    
    // Computed values to produce the desired output
    
    public int Start
    {
        get { return SortOnly ? 0 : PerPage * (Page - 1); }
    }

    public int Entries
    {
        get { return SortOnly && CurrentEntries > 0 ? CurrentEntries : PerPage; }
    }
    
    public string OrderBy
    {
        get
        {
            return string.IsNullOrEmpty(SortBy) ? null : string.Format("{0} {1}", 
                SortBy, SortAsc ? "ASC" : "DESC");
        }
    }
}

// Model to be used to filter the data
public class MyFilters
{
    public string Name { get; set; }
    
    public int Age { get; set; }   
}
```

###Sample Models to produce the expected response by the plugin:
```csharp
using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

// Return type of the controller method
// T is the Model of the data to be sent to the client
public class PagedListResult<T>
{
    public PagedListResult(IEnumerable<T> data, PagedListDetails details)
    {
        Data = data;
        Details = details;
    }

    [JsonProperty(PropertyName = "data")]
    public IEnumerable<T> Data { get; private set; }

    [JsonProperty(PropertyName = "details")]
    public PagedListDetails Details { get; private set; }
}

public class PagedListDetails
{
    [JsonProperty(PropertyName = "totalEntries")]
    public int TotalEntries { get; set; }
}

// Model of the data to be sent to the client
public class MyDataModel
{
    [JsonProperty(PropertyName = "columnId")]
    public int ColumnId { get; set; }
    
    [JsonProperty(PropertyName = "column1")]
    public String Column1 { get; set; }
    
    [JsonProperty(PropertyName = "column2")]
    public String Column2 { get; set; }
    
    [JsonProperty(PropertyName = "column2")]
    public String Column3 { get; set; }
}
```

###Sample Extension to convert the IEnumerable data to PagedListResult
```csharp
public static class PagedListExtension
{
    public static PagedListResult<T> ToPagedListResult<T>(this IEnumerable<T> data, PagedListOptions pagedListOptions)
    {
        // sort the data
        if (!string.IsNullOrEmpty(pagedListOptions.OrderBy))
        {
            data = data.OrderBy(pagedListOptions.OrderBy);  // using LINQ Dynamic
        }

        // get the entries of the specified page
        var pagedList = data
            .Skip(pagedListOptions.Start)
            .Take(pagedListOptions.ShowAll ? data.Count() : pagedListOptions.Entries);

        // get details of the data
        var details = new PagedListDetails()
        {
            TotalEntries = data.Count()
        };
        
        // return the result
        return new PagedListResult<T>(pagedList, details);
    }
}
```

###Sample Extension to get the JsonPropertyName
```csharp
using System;
using System.Linq;
using System.Linq.Expressions;
using System.Web.Mvc;
using System.Reflection;
using Newtonsoft.Json;

...
public static class HtmlHelpers
{
    public static string GetJsonPropertyName<TModel, TValue>(this HtmlHelper<TModel> helper, Expression<Func<TModel, TValue>> expression)
    {
        var data = ModelMetadata.FromLambdaExpression(expression, helper.ViewData);
    
        var jsonPropertyName = typeof(TModel).GetProperty(data.PropertyName)
                .GetCustomAttributes(typeof(JsonPropertyAttribute))
                .Cast<JsonPropertyAttribute>()
                .Select(p => p.PropertyName)
                .FirstOrDefault();
    
        return jsonPropertyName;
    }
}
```

###HTML Helper Usage in Razor
```razor
@using HtmlHelpers
@model MyDataModel

<td data-bind="text: @Html.GetJsonPropertyName(x => x.ColumnName)"></td>
```

##Client-side
Include scripts in page:
```html
<!-- Page.html -->

<!-- Required scripts -->
<script src="jquery.js"></script>
<script src="knockout.js"></script>
<script src="knockout-paged-list.js"></script>

<!-- Your view model -->
<script src="ViewModel.js"></script>

```
##Create a view model
Inherit **PagedList** in view model to be able to use its paging and filtering functionality:
```javascript
// ViewModel.js

// Create view model
var ViewModel = function (options) {
    var self = this;
    PagedList.call(self, options);
    
    ...
    /* Additional bindings */
    
    // This will contain the checked radio button
    // using 'data-bind="checked: $root.selectedItem"' attribute in an element 
    self.selectedItem = ko.observable();
    
    // Sample logic to enable submit button
    self.validInput = ko.computed(function () {
        return self.selectedItem() !== null;
    });
}

var viewModel = new ViewModel({
    url: "/api/values",            // url to request data from (can also be set using the 'data-url' attribute of an element)
    entriesPerPage: 2,             // entries to show per page (default = 5)
    queryOnLoad: false,            // defines whether to query on page load (default = true)
    clearLoadedDataOnError: true   // previous data loaded will be cleared when an error occurs  (default = true)
});

// Apply knockout bindings
ko.applyBindings(viewModel, $("#container-id")[0]); // Use this, if applying multiple bindings in one page
```
##Displaying the Entries <a name="display">#</a>
Sample bindings to display the paginated data in a table:
```html
<!-- Page.html -->

<table class="table">
    <thead>
        <tr>
            <th></th>
            <!-- use 'data-url' attribute to specify url to query different from the 'url' passed to the view model -->
            <th data-bind="click: sort.bind($data, 'column1')" data-url="/api/sorturl">Heading 1</th>
            <!-- use 'data-sort-field' attribute to specify the field to sort when call the 'sort' function -->
            <th data-bind="click: sort" data-sort-field="availableVehicle">AVAILABLE</th>
            <!-- another way of defining the field to sort -->
            <th data-bind="click: sort.bind($data, 'column3')">Heading 3</th>
        </tr>
    </thead>
    
    <!-- 'entries' variable contains the paginated data -->
    <tbody data-bind="foreach: entries">
        <tr>
            <td>
                <input type="radio" data-bind="value: columnId,
                                               checked: $root.selectedItem" />
            </td>
            <td data-bind="text: column1"></td>
            <td data-bind="text: column2"></td>
            <td data-bind="text: column3"></td>
        </tr>
    </tbody>
    
    <tfoot>
        <!-- use 'hasEntries' to hide or show table footer containing message -->
        <tr data-bind="visible: !hasEntries()">
            <td colspan="3">Empty Result</td>
        </tr>
        <tr data-bind="visible: hasError">
            <!-- 'errorCode' variable contains the error code -->
            <td data-bind="text: errorCode"></td>
            <!-- 'error' variable contains the error produced by $.getJSON() function -->
            <td data-bind="text: ko.toJSON(error)" colspan="2"></td>
        </tr>
    </tfoot>
</table>
```

##Paging <a name="paging">#</a>
Use the built-in paging bindings in buttons to **navigate** through the list and display **entry count**:
```html
<div class="pager">
    <button class="btn" data-bind="click: showAll, visible: !shownAll()">
        Show all <span data-bind="text: totalEntries"></span> available entries
    </button>
    <button class="btn" data-bind="click: showFirstEntries, enable: showFirstEntriesEnabled, visible: shownAll">
        Show first <span data-bind="text: firstEntriesCount"></span> available entries
    </button>
    <button class="btn" data-bind="click: previous, enable: previousEnabled">
        Previous <span data-bind="text: previousItemsCount"></span> results
    </button>
    <button class="btn" data-bind="click: next, enable: nextEnabled">
        Next <span data-bind="text: nextItemsCount"></span> results
    </button>
</div>

<div class="pager">
    <button data-bind="enable: validInput" class="btn" type="submit">Submit</button>
</div>
```

##Filtering <a name="filtering">#</a>

Use the **'filter()'** variable to define a filter:
```html
<div class="form-group">
    <label class="control-label" for="name">Name</label>
    <div class="input-group">
        <!-- will produce: 'name=somevalue' in the url query string -->
        <input data-bind="value: filter().name" type="text" class="form-control" id="name">
    </div>
</div>
<div class="form-group">
    <label class="control-label" for="age">Age</label>
    <div class="input-group">
        <!-- will produce: 'age=24' in the url query string -->
        <input data-bind="value: filter().age" type="number" min="0 "class="form-control" id="age">
    </div>
</div>
```

Sample URL generated by the plugin:
```javascript
// sample generated URL if no filter was applied
/api/values?page=1&perPage=5&currentEntries=0&showAll=false

// sample generated URL if with filters applied
/api/values?page=1&perPage=5&currentEntries=0&showAll=false&name=John&age=25

// generated using the 'filter().filterName' variable in the input 'data-bind'
// i.e.
<input data-bind="value: filter().name" type="text" />
<input data-bind="value: filter().age" type="number" />

// the following filters will be appended to the URL
&name=John&age=25
```


##Performing a Query/Request <a name="perform-request">#</a>

Sample URL generated by the plugin:
```javascript
// sample values passed to the 'data' parameter of the getJSON function when performing a request
// jQuery.getJSON( url [, data ] [, success ] )

data = { page: 1, perPage: 5, currentEntries: 0, showAll: false }

// it is converted to a string and url-encoded before it is appended to the URL and will produce something like this:
/api/values?page=1&perPage=5&currentEntries=0&showAll=false
```

###*Simple*
Use the **'getList'** function to perform request to the server: *(url must be defined in the view model)*
```html
<button data-bind="click: getList" class="btn">Search</button>
```

###*Inline URL*
Use the **'data-url'** attribute to specify the url to access:
```html
<button data-bind="click: getList" data-url="/api/values" class="btn">Search</button>
```

###*Enabling/Disabling button while loading*
Use the **'loading()'** variable to enable/disable the button while loading:
```html
<button data-bind="click: getList, disable: loading" class="btn">Search</button>

<!-- or -->

<button data-bind="click: getList, enable: !loading()" class="btn">Search</button>
```

###Additional Logic when Performing a Query/Request

Wrap the `getList` function with a custom function in order to perform additional logic when performing a query or request:
```javascript
// Include 'data' and 'event' as a parameter to your custom function
// Needed when using 'data-url' attribute on the element calling the 'getResult' function
self.getResult = function (data, event) {
     // reset the selected item variable
     self.selectedItem(null);
     
     // perform query/request
     self.getList(data, event);
};
```

Element binding:
```html
<button data-bind="click: getResult" class="btn">Search</button>

<!-- or -->

<button data-bind="click: getResult" data-url="/api/values" class="btn">Search</button>
```


##Sorting <a name="sorting">#</a>

Toggle sorting by **columnName**:

###*Option 1*
Using the `data-sort-field` attribute to define the field to sort:
```html
<td data-bind="click: sort" data-sort-field="columnName">Heading</td>
```

###*Option 2*
Passing the **name of the field to sort** directly to the function:
```html
<td data-bind="click: sort.bind($data, 'columnName')">Heading</td>
```

###*Inline URL*
Use the 'data-url' attribute to specify the url to access:
```html
<!-- use 'data-url' attribute to specify url to query different from the 'url' passed to the view model -->
<td data-bind="click: sort.bind($data, 'column1')" data-url="/api/sorturl">Heading 1</td>   
```

Sample URL generated by the plugin:
```javascript
// sample generated URL if no sorting was applied
/api/values?page=1&perPage=5&currentEntries=0&showAll=false

// sample generated URL if with sorting applied
/api/values?page=1&perPage=2&currentEntries=2&showAll=false&sortBy=columnName&sortAsc=true&sortOnly=true


// i.e.
<td data-bind="click: sort" data-sort-field="columnName">Heading</td>


// the following will be appended to the URL

// sort by: columnName, ascending
&sortBy=columnName&sortAsc=true&sortOnly=true

// or

// sort by: columnName, desscending
&sortBy=columnName&sortAsc=false&sortOnly=true

```


#Configuration Options

##Options
```javascript
/* Configuration options */
options = {}

// this will be the maximum number entries to show on the current page
options.entriesPerPage           // [default] = 5

// this will set the default url to request a query from
options.url                      // [default] = undefined

// set to true if you want to perform a query/request on page load
options.queryOnload              // [default] = true

// previous data loaded will be cleared when an error occurs when set to true
options.clearLoadedDataOnError   // [default] = true

// if set to true, it will only perform a request if the filters have changed
// useful for static data
self.queryOnFilterChangeOnly     // [default] = false


// pass options to PagedList
PagedList.call(self, options);
```


#Variables and Observables 

##Settings/Options Variables
Can be set by passing parameter to **PagedList.call** (*self*, **`options`**);
```javascript
/* Settings/Options variables */

// set using 'options.url'
self.defaultUrl                 

// set using 'options.entriesPerPage'
self.defaultEntriesPerPage      

// set using 'options.queryOnload'
self.queryOnLoad              

// set using 'options.clearLoadedDataOnError'
options.clearLoadedDataOnError

// set using 'options.queryOnFilterChangeOnly'
self.queryOnFilterChangeOnly
```

##Server-related Variables
```javascript
/* Server-related variables */

// contains the ajax request
self.request
```


##Paging Observables
```javascript
/* Paging observables */

// holds the URL to request data from 
self.url()

// array of data currently loaded
self.data()

// current page displayed
self.currentPage()

// page to be navigated/displayed
self.requestedPage()

// entries to display per page
self.entriesPerPage()

// total number of entries/result
self.totalEntries()
```

##Server-related Observables
```javascript
/* Server-related observables */

// object containing the headers of the request
self.headers()

// array containing the error after performing a request using $getJSON()
self.error()

// returns true while performing a request
self.loading()
```

##Filtering Observables
```javascript
/* Filtering observables */

// array key-value pair containing the filters
// i.e.  <input data-bind="value: filter().filterName" type="text" />
self.filter()

// array of the filters currently applied in the request
self.appliedFilter()
```

##Sorting Observables
```javascript
/* Sorting observables */

// array of the columns of loaded data
self.columns()

// set to true to perform sort retaining the current number of loaded entries/result
self.sortOnly()

// contains the value of the 'column' to sort, and 'asc' equals to true if ascending otherwise false 
self.activeSort()
```


#Helpers

##Paging Helpers
```javascript
/* Paging helpers */

// entries to display in the current page
// i.e. paginated list
self.entries()

// returns true if loaded data is present
self.hasEntries()

// total pages based on the total entries or result, and the entries per page
self.totalPages()

// returns true if 'previous button' will be enabled
self.previousEnabled()

// returns true if 'next button' will be enabled
self.nextEnabled()

// returns true if 'show first entries' will be enabled
self.showFirstEntriesEnabled()

// number of items based on current result count and entries per page
self.firstEntriesCount()

// number of items in previous page
self.previousItemsCount()

// number of items in next page
self.nextItemsCount()

// number of items currently loaded
self.loadedEntriesCount()

// returns true if all entries are shown on the list
self.shownAll()

// total number of entries to load until the next page
self.totalEntriesOnNextPage()
```

##Server-related Helpers
```javascript
/* Server-related helpers */

// returns true if request has an error after performing a request
self.hasError()

// the error code produced
self.errorCode()

// returns true if there is an error parsing the response
self.parserError()
```

#Functions

##Paging Functions
```javascript
/* Paging functions */

// Go to the first page
self.firstPage()

// Go to the last page [Not yet implemented]
self.lastPage()

// Go to the next page
self.next()

// Go to the previous page
self.previous()

// Show first entries based on the set entries per page
self.showFirstEntries()

// Show all entries/result
self.showAll()
```

##Sort Functions

```javascript
/* Sort functions */

// perform a sort based on the passed value
self.sort()

```

##Server-related Functions
```javascript
/* Server-related functions */

// sets the url to be used in performing a query/request
// the parameter passed to the function will be used otherwise, the url set during the configuration
self.setUrl()

// request data from the server
self.getList()
```
