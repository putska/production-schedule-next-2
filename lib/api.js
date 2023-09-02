import axios from 'axios';

const baseURL = 'http://wwweb/portal/desktopmodules/ww_Global/API/PSDev';

const fetcher = async (url) => await axios.get(baseURL + url).then((res) => res.data);

// const fetcher = (url) => {

//     fetch(baseURL + url)
//         .then(response => {
//             const data = response.json();
//             return data;
//         })
//         .catch(error => {
//             console.log("Failed for " + url, error.message);
//         })
// }

const handleUpdate = async (url, row) => {
    // try {
    //     await axios.put(baseURL + url, row);
    // } catch (error) {
    //     console.error(error);
    // }

    alert("HANDLE UPDATE IS RUNNING! Putting " + row + " with url " + url)
};

//   const handleAdd = async (type, row) => {
//     switch (type) {
//       case "shop":
//         try {
//           const res = await axios.post(
//             baseURL + `/PostShop`,
//             row
//           );
//           setShops((prev) => {
//             let items = prev.filter(
//               (item) => res.data.__KEY__ !== item.__KEY__
//             );

//             return [...items, res.data];
//           });
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "job":
//         try {
//           const res = await axios.post(
//             baseURL + `/PostJob`,
//             row
//           );
//           setJobs((prev) => {
//             let items = prev.filter(
//               (item) => res.data.__KEY__ !== item.__KEY__
//             );

//             return [...items, res.data];
//           });
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "shopDrawing":
//         try {
//           const res = await axios.post(
//             baseURL + `/PostShopDrawing`,
//             row
//           );
//           setShopDrawings((prev) => {
//             let items = prev.filter(
//               (item) => res.data.__KEY__ !== item.__KEY__
//             );

//             return [...items, res.data];
//           });
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "takeoffMatrix":
//         try {
//           const res = await axios.post(
//             baseURL + `/PostTakeoffMatrix`,
//             row
//           );
//           setTakeoffMatrixs((prev) => {
//             let items = prev.filter(
//               (item) => res.data.__KEY__ !== item.__KEY__
//             );

//             return [...items, res.data];
//           });
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "fabMatrix":
//         try {
//           const res = await axios.post(
//             baseURL + `/PostFabMatrix`,
//             row
//           );
//           setFabMatrixs((prev) => {
//             let items = prev.filter(
//               (item) => res.data.__KEY__ !== item.__KEY__
//             );

//             return [...items, res.data];
//           });
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "metal":
//         try {
//           const res = await axios.post(
//             baseURL + `/PostMetal`,
//             row
//           );
//           setMetals((prev) => {
//             let items = prev.filter(
//               (item) => res.data.__KEY__ !== item.__KEY__
//             );

//             return [...items, res.data];
//           });
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "field":
//         try {
//           const res = await axios.post(
//             baseURL + `/PostField`,
//             row
//           );
//           setFields((prev) => {
//             let items = prev.filter(
//               (item) => res.data.__KEY__ !== item.__KEY__
//             );

//             return [...items, res.data];
//           });
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "packaging":
//           try {
//             const res = await axios.post(
//               baseURL + `/PostPackaging`,
//               row
//             );
//             setFields((prev) => {
//               let items = prev.filter(
//                 (item) => res.data.__KEY__ !== item.__KEY__
//               );

//               return [...items, res.data];
//             });
//           } catch (error) {
//             console.error(error);
//           }
//           break;
//       case "jobsite":
//         try {
//           const res = await axios.post(
//             baseURL + `/PostJobsite`,
//             row
//           );
//           setJobsites((prev) => {
//             let items = prev.filter(
//               (item) => res.data.__KEY__ !== item.__KEY__
//             );

//             return [...items, res.data];
//           });
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       default:
//         return 0;
//     }
//   };

//   const handleDelete = async (type, row) => {
//     switch (type) {
//       case "shop":
//         try {
//           await axios.delete(
//             baseURL + `/DeleteShop?id=${row.ID}`
//           );
//           setShops((prev) => prev.filter((item) => item.ID !== row.ID));
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "job":
//         try {
//           await axios.delete(
//             baseURL + `/DeleteJob?id=${row.ID}`
//           );

//           setJobs((prev) => prev.filter((item) => item.ID !== row.ID));
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "shopDrawing":
//         try {
//           await axios.delete(
//             baseURL + `/DeleteShopDrawing?id=${row.ID}`
//           );

//           setShopDrawings((prev) => prev.filter((item) => item.ID !== row.ID));
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "takeoffMatrix":
//         try {
//           await axios.delete(
//             baseURL + `/DeleteTakeoffMatrix?id=${row.ID}`
//           );

//           setTakeoffMatrixs((prev) =>
//             prev.filter((item) => item.ID !== row.ID)
//           );
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "fabMatrix":
//         try {
//           await axios.delete(
//             baseURL + `/DeleteFabMatrix?id=${row.ID}`
//           );

//           setFabMatrixs((prev) => prev.filter((item) => item.ID !== row.ID));
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "metal":
//         try {
//           await axios.delete(
//             baseURL + `/DeleteMetal?id=${row.ID}`
//           );

//           setMetals((prev) => prev.filter((item) => item.ID !== row.ID));
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "field":
//         try {
//           await axios.delete(
//             baseURL + `/DeleteField?id=${row.ID}`
//           );

//           setFields((prev) => prev.filter((item) => item.ID !== row.ID));
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "jobsite":
//         try {
//           await axios.delete(
//             baseURL + `/DeleteJobsite?id=${row.ID}`
//           );

//           setJobsites((prev) => prev.filter((item) => item.ID !== row.ID));
//         } catch (error) {
//           console.error(error);
//         }
//         break;
//       case "packaging":
//           try {
//             await axios.delete(
//               baseURL + `/DeletePackaging?id=${row.ID}`
//             );

//             setJobsites((prev) => prev.filter((item) => item.ID !== row.ID));
//           } catch (error) {
//             console.error(error);
//           }
//           break;
//       default:
//         return 0;
//     }
//   };

export { fetcher, handleUpdate }