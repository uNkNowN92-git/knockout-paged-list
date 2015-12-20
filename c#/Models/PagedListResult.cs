using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNet.Mvc;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace MVCTest.Models
{
   public partial class PagedListResult<T>
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
}