using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNet.Mvc;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace PagedList
{
    public class PagedListDetails
    {
        [JsonProperty(PropertyName = "totalEntries")]
        public int TotalEntries { get; set; }
    }
}