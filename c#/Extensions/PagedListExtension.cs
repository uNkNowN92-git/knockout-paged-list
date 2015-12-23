using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic;

namespace PagedList
{
    public static class PagedListExtension
    {
        public static PagedListResult<object> ToPagedListResult(this IEnumerable<object> data, PagedListOptions pagedListOptions)
        {
            // sort the data
            if (!string.IsNullOrEmpty(pagedListOptions.OrderBy))
            {
                data = data.OrderBy(pagedListOptions.OrderBy); // using LINQ Dynamic
            }

            // get the entries of the specified page
            var pagedList = data
                .Skip(pagedListOptions.Start)
                .Take(pagedListOptions.Entries);

            // get details of the data
            var details = new PagedListDetails()
            {
                TotalEntries = data.Count()
            };

            return new PagedListResult<object>(pagedList, details);
        }
    }
}