using System;
using System.Collections.Generic;
using System.Linq;
// using System.Linq.Dynamic;
using System.Threading.Tasks;
using Microsoft.AspNet.Mvc;
using MVCTest.Models;
using MVCTest.Services;

namespace MVCTest.Controllers

{
    [Route("api/[controller]")]
    public class ValuesController : Controller
    {
        // GET: api/values
        [HttpGet]
        //public PagedListQueryOptions Get(CarShareQueryOptions carShareQuery, PagedListQueryOptions queryOptions)
        public PagedListResult<object> Get(CarShareQueryOptions carShareQuery, PagedListQueryOptions queryOptions)
        {
            var data = new List<BookVehicleModel>();
            data.Add(
              new Models.BookVehicleModel()
              {
                  VehicleID = 1,
                  DistanceLocation = 12,
                  AvailableVehicle = 5,
                  CarbonDioxide = "5",
                  MonoNitrogen = "10",
                  ContactNumber = "753124123"
              }
            );
            data.Add(
              new Models.BookVehicleModel()
              {
                  VehicleID = 2,
                  DistanceLocation = 101,
                  AvailableVehicle = 96,
                  CarbonDioxide = "8",
                  MonoNitrogen = "120",
                  ContactNumber = "9123664123"
              }
            );
            data.Add(
              new Models.BookVehicleModel()
              {
                  VehicleID = 3,
                  DistanceLocation = 102,
                  AvailableVehicle = 6,
                  CarbonDioxide = "2",
                  MonoNitrogen = "1120",
                  ContactNumber = "093242312"
              }
            );
            data.Add(
              new Models.BookVehicleModel()
              {
                  VehicleID = 4,
                  DistanceLocation = 200,
                  AvailableVehicle = 42,
                  CarbonDioxide = "42",
                  MonoNitrogen = "4120",
                  ContactNumber = "553242312"
              }
            );

            // end data

            var result = data.AsQueryable();

            // filter the result
            if (carShareQuery.Miles > 0)
                result = result.Where(x => x.DistanceLocation <= carShareQuery.Miles);

            // define default field to sort
            pagedListOptions.SortBy = pagedListOptions.SortBy ?? "VehicleID";

            // convert IQueryable to PagedListResult
            var pagedList = result.ToPagedListResult(pagedListOptions);
            
            return pagedList;
        }
    }
}
