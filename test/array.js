Array.prototype.updateItems = function(index, newItems) {
    Array.prototype.splice.apply(this, [index, newItems.length].concat(newItems));
}

var arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
var anotherArr = [1, 2, 3];

//Array.prototype.splice.apply(arr, [0, anotherArr.length].concat(anotherArr));

// arr.updateItems(0, anotherArr);
// console.log(arr);

// arr.updateItems(3, anotherArr);
// console.log(arr);

// arr.updateItems(6, anotherArr);
// console.log(arr);

var response = {
    "data": [
        { "columnId": 1, "column1": "value1", "column2": "value2", "column3": "value3" },
        { "columnId": 2, "column1": "value1", "column2": "value2", "column3": "value3" },
        { "columnId": 3, "column1": "value1", "column2": "value2", "column3": "value3" },
        { "columnId": 4, "column1": "value1", "column2": "value2", "column3": "value3" },
    ],
    "details": {
        "totalEntries": 8,
        "start": 4
    }
};

// console.log("response: ", response);

// var data = Array.apply(null, Array(response.details.totalEntries)).map(function () { return {}; });

// console.log("data: ", data);

// data.updateItems(response.details.start, response.data);

// console.log("updated data: ", data);


function CreateEmptyObjectArray(size) {
    return Array.apply(null, Array(size)).map(function () { return {}; });
}

var data = CreateEmptyObjectArray(response.details.totalEntries);

console.log(data[7]);

// data.updateItems(response.details.start, response.data);

// console.log("updated data: ", data);
console.log(data[7]);

function NotEmptyItemsCount(array) {
    var result = $.map(array, function(item, index) {
        if (!$.isEmptyObject(item)) {
            return index;
        }
    }).length;
    
    return result;
}

console.log(NotEmptyItemsCount(data));


