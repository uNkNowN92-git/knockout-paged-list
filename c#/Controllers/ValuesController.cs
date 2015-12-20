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
        public PagedListResult<BookVehicleModel> Get(CarShareQueryOptions carShareQuery, PagedListQueryOptions queryOptions)
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

            if (carShareQuery.Miles > 0)
                result = result.Where(x => x.DistanceLocation <= carShareQuery.Miles);

            var details = new PagedListDetails()
            {
                TotalEntries = result.Count()
            };

            // if (!string.IsNullOrEmpty(queryOptions.SortBy))
            // {
            //     var column = PagedListServices.GetNameFromJsonProperty<BookVehicleModel>(queryOptions.SortBy);

            //     if (!string.IsNullOrEmpty(column))
            //     {
            //         string orderByQuery = column + " " + (queryOptions.SortAsc == true ? "ASC" : "DESC");

            if (!string.IsNullOrEmpty(queryOptions.OrderBy))
            {
                // result = result.OrderBy(queryOptions.OrderBy); // USE LINQ DYNAMIC
                
                // TESTING
                if (queryOptions.SortAsc)
                    result = result.OrderBy(x => x.AvailableVehicle);
                else
                    result = result.OrderByDescending(x => x.AvailableVehicle);
            }
            //     }
            // }

            var queryResult = result
                .Skip(queryOptions.Offset)
                .Take(queryOptions.Entries);

            //return queryOptions;
            return new PagedListResult<BookVehicleModel>(queryResult, details);
        }

        public ActionResult Index()
        {
            return View();
        }

        // // GET api/values/5
        // [HttpGet("{id}")]
        // public string Get(int id)
        // {
        //     List<string> names = new List<string>();
        //     for (int i = 0; i < 25; i++)
        //     {
        //         names.Add(Faker.Name.FullName());
        //     }
        //     return string.Join(",", names.ToArray());
        // }

        // POST api/values
        [HttpPost]
        public void Post([FromBody]string value)
        {
        }

        // PUT api/values/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE api/values/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
