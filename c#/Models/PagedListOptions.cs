using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNet.Mvc;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;
using System.Collections.Specialized;
using System.Reflection;

namespace PagedList
{
    public class PagedListOptions
    {

        public PagedListOptions()
        {
            Page = 1;
            PerPage = 5;
            SortAsc = true;
        }

        [JsonProperty(PropertyName = "start")]
        public int Start
        {
            get { return SortOnly ? 0 : PerPage * (Page - 1); }
        }

        [JsonProperty(PropertyName = "entries")]
        public int Entries
        {
            get { return SortOnly && CurrentEntries > 0 ? CurrentEntries : PerPage; }
        }

        [JsonProperty(PropertyName = "currentEntries")]
        public int CurrentEntries { get; set; }

        [JsonProperty(PropertyName = "page")]
        public int Page { get; set; }

        [JsonProperty(PropertyName = "perPage")]
        public int PerPage { get; set; }

        [JsonProperty(PropertyName = "sortOnly")]
        public bool SortOnly { get; set; }

        [JsonProperty(PropertyName = "showAll")]
        public bool ShowAll { get; set; }

        [JsonProperty(PropertyName = "sortAsc")]
        public bool SortAsc { get; set; }

        [JsonProperty(PropertyName = "sortBy")]
        public string SortBy { get; set; }
        
        [JsonIgnore]
        public string OrderBy
        {
            get
            {
                return string.IsNullOrEmpty(SortBy) ? null : string.Format("{0} {1}", 
                    SortBy, SortAsc ? "ASC" : "DESC");
            }
        }
    }
}