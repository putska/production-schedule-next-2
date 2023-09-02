import convert from "xml-js"
import axios from "axios"

const baseURL = 'http://wwweb/portal/desktopmodules/ww_Global/API/PSDev';
// axios.defaults.baseURL = http://wwweb/portal

const month = [];
month[1] = "Jan";
month[2] = "Feb";
month[3] = "Mar";
month[4] = "Apr";
month[5] = "May";
month[6] = "Jun";
month[7] = "Jul";
month[8] = "Aug";
month[9] = "Sep";
month[10] = "Oct";
month[11] = "Nov";
month[12] = "Dec";

// API METHODS
async function loadData(apiEndpoint) {
    try {
        const res = await axios.get(baseURL + apiEndpoint)
        return res.data;
    } catch (error) {
        console.log(error);
    }
}

async function putData(apiEndpoint, row) {
    try {
        const res = await axios.put(baseURL + apiEndpoint, row);
        return res.data;
    } catch (error) { console.log(error) }
}

async function postData(apiEndpoint, row) {
    try {
        const res = await axios.post(baseURL + apiEndpoint, row);
        return res.data;
    } catch (error) { console.log(error) }
}

async function deleteData(apiEndpoint, row) {
    try {
        const res = await axios.delete(baseURL + apiEndpoint + `?id=${row.ID}`, row);
        return res.data;

    } catch (error) { console.log(error) }
}

async function loadAllActivitiesDates() {
    const resDates = await fetch("http://wwweb/portal/WSPTSchedule.asmx/GetChartByID")
    const returnedDates = await resDates.text();

    const jsonDates = convert.xml2json(returnedDates, {
        compact: true,
        spaces: 4,
    });
    const parsedJSON = JSON.parse(jsonDates);
    const dates = JSON.parse(parsedJSON.string._text);

    return dates;
}

async function loadSettings() {
    const response = await axios.get(
        `http://wwweb/portal/DesktopModules/ww_Global/API/AppSettings/GetSettings?id=production_schedule`
        //"http://functions-ww-app.azurewebsites.net/api/function1?apiPath=AppSettings&functionPath=GetSettings&paramName=id&paramVal=production_schedule"
    );
    let item = response.data;
    item.Data = JSON.parse(item.Data);

    return item;
}

// MISC HELPER FUNCTIONS

function lightOrDark(color) {

    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {

        // If HEX --> store the red, green, blue values in separate variables
        color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

        r = color[1];
        g = color[2];
        b = color[3];
    }
    else {

        // If RGB --> Convert it to HEX: http://gist.github.com/983661
        color = +("0x" + color.slice(1).replace(
            color.length < 5 && /./g, '$&$&'
        )
        );

        r = color >> 16;
        g = color >> 8 & 255;
        b = color & 255;
    }

    // HSP equation from http://alienryderflex.com/hsp.html
    hsp = Math.sqrt(
        0.299 * (r * r) +
        0.587 * (g * g) +
        0.114 * (b * b)
    );

    // Using the HSP value, determine whether the color is light or dark
    if (hsp > 127.5) {

        return 'light';
    }
    else {

        return 'dark';
    }
}

const getHighlight = (dtchanged) => {
    if (!dtchanged) {
        return false
    }
    dtchanged = new Date(dtchanged);
    let today = new Date();
    let Difference_In_Time = today.getTime() - dtchanged.getTime();
    let Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
    return (Difference_In_Days < 13) ? true : false;
};

const toWeeks = (startDate, endDate) => {
    const oneDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
    const start = toMondayDate(startDate);
    const end = toMondayDate(endDate);

    // Calculate the difference in days
    const diffInDays = Math.round(Math.abs((start - end) / oneDay));

    // Calculate the number of weeks
    const weeks = Math.floor(diffInDays / 7);

    return weeks;

}

const toDays = (startDate, endDate) => {
    const oneDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day

    // Convert the date strings to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate the difference in days
    const diffDays = Math.ceil(Math.abs((start.getTime() - end.getTime()) / oneDay));

    return diffDays + 1;
}

const toMondayDate = (d) => {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const mon = new Date(d.setDate(diff));
    return mon;
}

const addDays = (d, days) => {
    const date = new Date(d);
    date.setDate(date.getDate() + days);
    return date;
}

const createBasicRows = (start, calculatedWeeks) => {
    let rows = [];
    //moved back 6 weeks per steve
    let today = toMondayDate(start);

    for (let i = 0; i < calculatedWeeks; i++) {
        let date = addDays(today, i * 7).toLocaleDateString();
        let obj = { date: date };
        rows.push(obj);
    }
    return rows;
}

const convertDates = (jobs) => {
    let dateFields = [
        "start",
        "fieldStart",
        "metalTakeoff",
        "orderWeekOf",
        "panelFabs",
        "panelRelease",
        "glassTakeoff",
        "shopUseBrakeShapesAndSteel",
        "doorSchedule"
    ];

    let updatedJobs = JSON.parse(JSON.stringify(jobs));
    updatedJobs.forEach((job) => {
        dateFields.forEach((field) => {
            job[field] = job[field] ? new Date(job[field]) : new Date();
        });

        if (!job.stickwall && job.unitsPerWeek > 0) {
            job.weeks = Math.ceil(job.units / job.unitsPerWeek);
        }

        job.end = addDays(job.start, job.weeks);
    });

    updatedJobs.sort(function (a, b) {
        return a.start.getTime() - b.start.getTime();
    });

    updatedJobs.forEach((job) => {
        job.offset = toWeeks(updatedJobs[0].start, job.start);
    });

    return updatedJobs;
}

const calculateWeeks = (updatedJobs) => {
    let calculatedWeeks = toWeeks(
        updatedJobs[0].start,
        updatedJobs[updatedJobs.length - 1].start
    );
    return calculatedWeeks;
}

const createRows = (cols, dateRows, jobs, weeks) => {
    const checkIfOnSameDate = (date, jobIndex) => {
        let foundOnSameDate = jobs.find((j, i) => {
            if (j.metalTakeoff && i !== jobIndex) {
                return j.metalTakeoff === date.toISOString();
            } else {
                return false;
            }
        });
        return foundOnSameDate;
    };

    let newRows = JSON.parse(JSON.stringify(dateRows));
    let columns = cols.slice(0);

    jobs.forEach((job, jobIndex) => {
        let startOffset = -job.weeksToGoBack;
        let metalTakeoffDate = addDays(toMondayDate(job.start), startOffset * 7);

        while (checkIfOnSameDate(metalTakeoffDate, jobIndex)) {
            startOffset -= 1;
            metalTakeoffDate = addDays(toMondayDate(job.start), startOffset * 7);
        }

        job.metalTakeoff = metalTakeoffDate;

        columns.forEach((col) => {
            job[col.dataField] = addDays(job.metalTakeoff, col.offset * 7);
        });
    });

    for (let i = 0; i < weeks; i++) {
        jobs.forEach((job) => {
            columns.forEach((col) => {
                const jobDate = job[col.dataField];
                const dateKey = newRows[i].date;

                if (jobDate instanceof Date && jobDate.toLocaleDateString() === dateKey) {
                    newRows[i][col.dataField] = job.jobName;
                }
            });
        });
    }

    return newRows;
}

const convertToDate = (start, offset) => {
    const date = addDays(toMondayDate(start), offset * 7);
    return date.toLocaleDateString();
}

const toOffset = (jobs, date) => {
    return toWeeks(jobs[0].start, date);
}

const getMondays = (d) => {
    let month = new Date(d).getMonth();
    let mondays = [];
    while (d.getMonth() === month) {
        mondays.push(new Date(d.getTime()));
        d.setDate(d.getDate() + 7);
    }
    return mondays;
}

const isDateInRange = (date, startDate, endDate) => {
    const dateValue = new Date(date).getTime();
    const startValue = new Date(startDate).getTime();
    const endValue = new Date(endDate).getTime();

    return dateValue >= startValue && dateValue <= endValue;
}

// const calculateForOffSetsNew = (loadedJobs) => {
//     const jobs = convertDates(loadedJobs)
//     const today = new Date();
//     today.setDate(1);

//     const start = jobs[0].start;
//     const end = jobs[jobs.length - 1];
//     const startOffset = toWeeks(toMondayDate(start), toMondayDate(today));

//     let newCols = [];
//     let newColsX = [];

//     for (let i = startOffset; i <= end.offset + end.weeks; i++) {
//         newCols.push({
//             offset: i,
//             date: convertToDate(start, i - startOffset),
//         });
//     }

//     var i = startOffset;
//     do {
//         var d = convertToDate(start, i);

//         var mondays = getMondays(new Date(d));
//         let innerColsX = [];
//         var j = 0;
//         do {
//             innerColsX.push({
//                 offset: i,
//                 date: convertToDate(start, i),
//             });
//             i++;
//             j++;
//         } while (j < mondays.length);
//         let mnth =
//             month[d.substring(0, d.indexOf("/"))] +
//             " " +
//             d.substring(d.length - 2, d.length);
//         newColsX.push({
//             month: mnth,
//             innerColsX,
//         });
//     } while (i <= end.offset + end.weeks);

//     return { cols: newCols, colsX: newColsX };
// };

const calculateForOffSetsNew = (jobs, startDate, endDate) => {

    startDate = toMondayDate(startDate);
    endDate = toMondayDate(endDate);

    const start = jobs[0]
    const end = jobs[jobs.length - 1];

    const startOffset = toWeeks(toMondayDate(jobs[0].start), startDate);
    const endOffset = toWeeks(toMondayDate(jobs[0].start), endDate);

    let newCols = [];
    let newColsX = [];

    for (let i = startOffset; i <= endOffset; i++) {
        newCols.push({
            offset: i,
            date: convertToDate(startDate, i - startOffset),
        });
    }

    var i = startOffset;
    do {
        var d = convertToDate(startDate, i - startOffset);

        var mondays = getMondays(new Date(d));
        let innerColsX = [];
        var j = 0;
        do {
            innerColsX.push({
                offset: i,
                date: convertToDate(startDate, i - startOffset),
            });
            i++;
            j++;
        } while (j < mondays.length);
        let mnth =
            month[d.substring(0, d.indexOf("/"))] +
            " " +
            d.substring(d.length - 2, d.length);
        newColsX.push({
            month: mnth,
            innerColsX,
        });
    } while (i < endOffset);

    return { newCols: newCols, newColsX: newColsX };
}

// SHOP DRAWINGS METHODS
const getJobName = (jobNumber, jobs) => {
    const job = jobs.find(job => job.jobNumber === jobNumber);
    return job ? job.jobName : "";
}

const getJob = (jobNumber, jobs) => {
    const job = jobs.find(job => job.jobNumber === jobNumber);
    return job ? job : {};
}

const getEmployeeName = (ID, employees) => {
    const emp = employees.find(emp => emp.ID === parseInt(ID));
    return emp ? emp.name : "";
}

const getTask = (taskID, tasks) => {
    const task = tasks.find(task => task.ID === parseInt(taskID));
    return task ? task : {};
}

const getJobColor = (jobNumber, settings) => {
    const setting = settings.find(s => s.jobNumber === jobNumber);
    return setting ? setting.color : "black";
}

const getEmployeeNamesFromIDs = (ids, employees) => {
    console.log(typeof ids)
    const namesArray = typeof ids === "object"
        ? ids.map(id => {
                const name = getEmployeeName(id, employees) || "";
                return name;
            })
        : []
    return namesArray.length > 0 ? namesArray.join(", ") : "";
}

const createShopDrawingDates = (shopDrawings, rows) => {

    let newDates = JSON.parse(JSON.stringify(rows));

    shopDrawings.forEach((assignedTask) => {
        let numWeeksForProject =
            assignedTask.startDate && assignedTask.endDate
                ? toWeeks(assignedTask.startDate, assignedTask.endDate)
                : 0;


        let taskDates = [];
        let start = toMondayDate(assignedTask.startDate);

        for (let i = 0; i <= numWeeksForProject; i++) {
            let date = addDays(start, i * 7);
            taskDates.push(date);
        }

        const newDatesStartIndex = newDates.findIndex(date => date.date === start.toLocaleDateString())

        if (newDatesStartIndex != -1) {
            for (let i = newDatesStartIndex; i < newDatesStartIndex + numWeeksForProject; i++) {
                Object.keys(assignedTask.assignedPeople).forEach(person => {
                    if (newDates[i].hasOwnProperty(person)) {
                        newDates[i][person].push(assignedTask.jobName);
                    } else {
                        newDates[i][person] = [assignedTask.jobName];
                    }
                })
            }
        }
    });

    return newDates;
}

const createCalendarData = (employees, tasks, employeeNotes) => {
    const calendarData = {};

    employees.forEach(emp => {

        const foundTasks = tasks.filter(task => task.assignedPeople.includes(emp.ID));
        calendarData[emp.name] = [];

        foundTasks.forEach((task) => {
            const taskStartDate = new Date(task.startDate);
            const taskEndDate = new Date(task.endDate);
            const taskDays = toDays(taskStartDate, taskEndDate);
            const date = new Date(taskStartDate);

            for (let i = 1; i <= taskDays; i++) {
                const dayOfWeek = date.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {

                    let taskData = {
                        taskID: task.ID,
                        empID: emp.ID,
                        date: new Date(date),
                        jobNumber: task.jobNumber,
                        notes: "",
                        status: task.status,
                        problems: "",
                        category: "shop drawings",
                        workFromHome: false,
                        vacation: false,
                        firstTask: (i == 1) || (dayOfWeek === 1)
                    };

                    const hasTaskData = employeeNotes && employeeNotes.find(note => {
                        const exists =
                            new Date(note.date).toLocaleDateString() === date.toLocaleDateString()
                            && note.jobNumber === task.jobNumber
                            && note.empID === emp.ID
                        return exists;
                    });

                    // Employee has already written notes
                    if (hasTaskData) {
                        taskData = { ...taskData, ID: hasTaskData.ID, notes: hasTaskData.notes, problems: hasTaskData.problems }
                    }

                    calendarData[emp.name].push(taskData);
                }
                date.setDate(date.getDate() + 1);
            }
        });
    });
    return calendarData;
}

async function getDates() {
    try {
        // const response = await fetch(
        //     "http://wwweb/portal/WSPTSchedule.asmx/GetChartByID"
        //     //"http://functions-ww-app.azurewebsites.net/api/function1?apiPath=PS&functionPath&GetChartByID"
        // );
        // // let results = convert.xml2json(response.data, {
        // //     compact: true,
        // //     spaces: 4,
        // // });
        // results = JSON.parse(results);
        // results = JSON.parse(results.string._text);

        // console.dir(results)

        // return results;

        const resDates = await fetch("http://wwweb/portal/WSPTSchedule.asmx/GetChartByID")
        let returnedDates = await resDates.text();

        let dates = convert.xml2json(returnedDates, {
            compact: true,
            spaces: 4,
        });
        dates = JSON.parse(dates);
        dates = JSON.parse(dates.string._text);
        return dates;

    } catch (error) {
        console.error(error);
    }
}

// const employees = [
//     {
//         ID: 1,
//         name: "Karla",
//         category: "shop drawings"
//     },
//     {
//         ID: 2,
//         name: "John",
//         category: "shop drawings"
//     },
//     {
//         ID: 3,
//         name: "Emily",
//         category: "shop drawings"
//     }
// ];

// const employeeNotes = [
//     {
//         ID: 1,
//         taskID: 1,
//         empID: 1,
//         date: "07/05/2023",
//         jobNumber: "10-787",
//         notes: "Some notes for Make shop drawings",
//         problems: "No problems encountered",
//         category: "shop drawings"
//     },
//     {
//         ID: 2,
//         taskID: 2,
//         empID: 1,
//         date: "07/06/2023",
//         jobNumber: "10-787",
//         notes: "Additional notes for Make shop drawings",
//         problems: "No problems encountered",
//         category: "shop drawings"
//     },
//     {
//         ID: 3,
//         taskID: 3,
//         empID: 2,
//         date: "07/07/2023",
//         jobNumber: "10-788",
//         notes: "Some notes for Task 3",
//         problems: "No problems encountered",
//         category: "shop drawings"
//     }
// ];

// const tasks = [
//     {
//         ID: 1,
//         jobNumber: "10-787",
//         task: "Task 1",
//         status: "Completed",
//         description: "This task involves creating detailed shop drawings for the 123 Industrial project.",
//         includeOnMetrics: true,
//         assignedPeople: [1, 2],
//         startDate: "07/10/2023",
//         endDate: "07/14/2023",
//         category: "shop drawings"
//     },
//     {
//         ID: 2,
//         jobNumber: "10-787",
//         task: "Task 2",
//         status: "Pending",
//         description: "This task involves coordinating with the engineering team for structural analysis.",
//         includeOnMetrics: true,
//         assignedPeople: [1, 3],
//         startDate: "07/17/2023",
//         endDate: "07/19/2023",
//         category: "shop drawings"
//     },



//     {
//         ID: 3,
//         jobNumber: "10-788",
//         task: "Task 3",
//         status: "Completed",
//         description: "This task involves creating a material takeoff for the 456 Commercial project.",
//         includeOnMetrics: true,
//         assignedPeople: [2],
//         startDate: "07/10/2023",
//         endDate: "07/17/2023",
//         category: "shop drawings"
//     },
//     {
//         ID: 4,
//         jobNumber: "10-788",
//         task: "Task 3",
//         status: "Completed",
//         description: "This task involves creating a material takeoff for the 456 Commercial project.",
//         includeOnMetrics: true,
//         assignedPeople: [2],
//         startDate: "07/17/2023",
//         endDate: "07/21/2023",
//         category: "shop drawings"
//     },
//     {
//         ID: 5,
//         jobNumber: "10-788",
//         task: "Task 3",
//         status: "Completed",
//         description: "This task involves creating a material takeoff for the 456 Commercial project.",
//         includeOnMetrics: true,
//         assignedPeople: [2],
//         startDate: "07/24/2023",
//         endDate: "07/28/2023",
//         category: "shop drawings"
//     },
//     {
//         ID: 6,
//         jobNumber: "10-788",
//         task: "Task 3",
//         status: "Pending",
//         description: "This task involves creating a material takeoff for the 456 Commercial project.",
//         includeOnMetrics: true,
//         assignedPeople: [2],
//         startDate: "07/31/2023",
//         endDate: "08/04/2023",
//         category: "shop drawings"
//     }
// ];

// const settings = [
//     {
//         ID: 1,
//         jobNumber: "10-787",
//         color: "magenta",
//         category: "shop drawings"
//     },
//     {
//         ID: 2,
//         jobNumber: "10-788",
//         color: "green",
//         category: "shop drawings"
//     }
// ];

// const tabData = [
//     {
//         ID: 0,
//         jobNumber: "VALUE: 10-744,  STATUS: Completed",
//         category: "purchasing",
//         json: {
//             hiltiEmbeds: "VALUE:  STATUS: In Process",
//             MAC: "VALUE:  STATUS: In Process",
//             metalBooking: "VALUE:  STATUS: Completed",
//             glassBooking: "VALUE:  STATUS: Completed",
//             western: "VALUE:  STATUS: Completed",
//             certified: "VALUE:  STATUS:Completed ",
//             composite: "VALUE:  STATUS: In Process",
//             review: "VALUE:  STATUS: In Process",
//             glass: "VALUE:  STATUS: Not Applicable",
//             metal: "VALUE:  STATUS: Not Applicable",
//             panel: "VALUE:  STATUS: Completed",
//             gasket: "VALUE:  STATUS: Not Applicable",
//             shopSealant: "VALUE:  STATUS: Completed",
//             boltTesting: "VALUE:  STATUS: In Process",
//             orderHardware: "VALUE:  STATUS: Completed",
//             doorPaint: "VALUE:  STATUS: Not Applicable",
//             threeWeekUpdates: "VALUE:  STATUS: Completed",
//             fieldUseReport3Updates: "VALUE:  STATUS: Not Applicable",
//             newField: {
//                 visibleIndex: 10,
//                 caption: "",
//                 dataType: "text"
//             }
//         }
//     }
// ]

const columnsData = [
    {
        // ID: 0,
        category: "purchasing",
        columns: [
            {
                visibleIndex: 5,
                dataField: "hiltiEmbeds",
                caption: "Hilti Embeds",
                dataType: "string",
            },
            {
                visibleIndex: 6,
                dataField: "MAC",
                caption: "MAC",
                dataType: "string"
            },
            {
                visibleIndex: 7,
                dataField: "metalBooking",
                caption: "Metal Booking",
                dataType: "string"
            },
            {
                visibleIndex: 8,
                dataField: "glassBooking",
                caption: "Glass Booking",
                dataType: "string"
            },
            {
                visibleIndex: 9,
                caption: "Production Line Sample Approval",
                columns: [
                    {
                        visibleIndex: 0,
                        dataField: "western",
                        caption: "Western",
                        dataType: "string",
                    },
                    {
                        visibleIndex: 1,
                        dataField: "certified",
                        caption: "Certified",
                        dataType: "string"
                    },
                    {
                        visibleIndex: 2,
                        dataField: "composite",
                        caption: "Composite",
                        dataType: "string"
                    },
                ]
            },
            {
                visibleIndex: 10,
                caption: "Dow",
                columns: [
                    {
                        visibleIndex: 0,
                        dataField: "review",
                        caption: "Review",
                        dataType: "string"
                    },
                    {
                        visibleIndex: 1,
                        dataField: "glass",
                        caption: "Glass",
                        dataType: "string"
                    },
                    {
                        visibleIndex: 2,
                        dataField: "metal",
                        caption: "Metal",
                        dataType: "string",
                    },
                    {
                        visibleIndex: 3,
                        dataField: "panel",
                        caption: "Panel",
                        dataType: "string",
                        alignment: "center"
                    },
                    {
                        visibleIndex: 4,
                        dataField: "gasket",
                        caption: "Gasket",
                        dataType: "string",
                        alignment: "center"
                    },
                ]
            },
            {
                visibleIndex: 6,
                dataField: "shopSealant",
                caption: "Shop Sealant",
                dataType: "string"
            },
            {
                visibleIndex: 7,
                dataField: "boltTesting",
                caption: "Bolt Testing",
                dataType: "string"
            },
            {
                visibleIndex: 8,
                caption: "Doors",
                columns: [
                    {
                        visibleIndex: 0,
                        dataField: "orderHardware",
                        caption: "Order Hardware",
                        dataType: "string",
                    },
                    {
                        visibleIndex: 1,
                        dataField: "doorPaint",
                        caption: "Door Paint",
                        dataType: "string"
                    },
                    {
                        visibleIndex: 3,
                        dataField: "threeWeekUpdate",
                        caption: "3 Week Update and PM/Shop Notification",
                        dataType: "string"
                    }
                ]
            },
            {
                visibleIndex: 9,
                dataField: "fieldUseReport3Updates",
                caption: "Field Use Report 3 Updates (2 weeks prior to due date.  Due 8 weeks prior to field start date.)",
                dataType: "string"
            }
        ]
    },
    {
        // ID: 0,
        category: "jmp-field-tracking",
        columns: [
            {
                visibleIndex: 0,
                dataField: 'jobName',
                minWidth: '300px',
                caption: 'Job Name',
            },
            {
                visibleIndex: 1,
                dataField: 'jobNumber',
                dataType: 'string',
                caption: 'Job Number',
                alignment: 'center',
                allowSorting: true,
            },
            {
                visibleIndex: 2,
                dataField: 'pm',
                caption: 'Project Manager',
                alignment: 'center',
                datatype: 'string',
            },
            {
                visibleIndex: 3,
                dataField: 'superintendent',
                caption: 'Superintendent',
                alignment: 'center',
                datatype: 'string',
            },
            {
                visibleIndex: 4,
                dataField: 'templateAdded',
                caption: 'Template Added',
                alignment: 'center',
                datatype: 'string',
            },
            {
                visibleIndex: 5,
                dataField: 'preliminaryJPS',
                caption: 'Preliminary JPS',
                alignment: 'center',
                datatype: 'string',
            },
            {
                visibleIndex: 6,
                dataField: 'jobBookedReview',
                caption: 'Job Booked review prelim JMP add field dates - Read the waterfall to determine what jobs. Update the field start date - Sen',
                alignment: 'center',
                datatype: 'string',
            },
            {
                visibleIndex: 7,
                dataField: 'prelimSent',
                caption: 'Preliminary JMP Sent to Watts',
                alignment: 'center',
                datatype: 'string',
            },
            {
                visibleIndex: 8,
                dataField: 'safetyHandOff',
                caption: 'Safety hand off - link to pallet schedule',
                alignment: 'center',
                datatype: 'string',
            },
            {
                visibleIndex: 9,
                dataField: 'fieldMonitorMeetingDate',
                caption: 'Field Monitor Meeting Date - Fill out JPS 2nd half of monitor meeting',
                alignment: 'center',
                datatype: 'date',
            },
            {
                visibleIndex: 10,
                dataField: 'warRoom',
                caption: 'War Room - 1 wk after field monitor meeting',
                alignment: 'center',
                datatype: 'boolean',
            },
            {
                visibleIndex: 11,
                dataField: 'fieldStart',
                caption: 'Field Start',
                alignment: 'center',
                defaultSortOrder: 'asc',
                allowSorting: true,
            },
            {
                visibleIndex: 12,
                dataField: 'linkUnitInstallStart',
                caption: 'Weekly boots on the ground - link Unit install start',
                alignment: 'center',
                datatype: 'string',
            },
            {
                visibleIndex: 13,
                dataField: 'afterActionWeekly',
                caption: 'After Action - weekly',
                alignment: 'center',
                datatype: 'string',
            },
            {
                visibleIndex: 14,
                dataField: 'toGoList',
                caption: 'ToGo List',
                alignment: 'center',
                datatype: 'string',
            },
            {
                visibleIndex: 15,
                dataField: 'wolfpackJobs',
                caption: 'Wolf Pack Jobs',
                alignment: 'center',
                datatype: 'string',
                minWidth: 300,
                lookup: {
                    dataSource: ['No', 'Yes', 'Need to Discuss with Superintendent', 'Have Notes'],
                },
            },
            {
                visibleIndex: 16,
                dataField: 'comments',
                caption: 'Comments',
                alignment: 'center',
                datatype: 'string',
            }
        ]
    },
    // {
    //     ID: 2,
    //     category: "shop drawings",
    //     columns: [
    //         {
    //             visibleIndex: 0,
    //             dataField: "jobNumber",
    //             caption: "Job Name",
    //             // groupCellRender: (cell) => {
    //             //   if (cell.value) {
    //             //     const groupColor = getJobColor(cell.value, settings);
    //             //     const jobName = getJobName(cell.value, jobs);

    //             //     return <div style={{ color: `${groupColor}` }}>{`${jobName} | ${cell.value}`}</div>;
    //             //   }
    //             // },
    //             groupIndex: jobIndex,
    //             lookup: {
    //               dataSource: jobs,
    //               displayExpr: "jobName",
    //               valueExpr: "jobNumber",
    //             },
    //           },
    //           {
    //             visibleIndex: 1,
    //             dataField: "includeOnMetrics",
    //             caption: "Include on Metrics",
    //             dataType: "boolean",
    //           },
    //           {
    //             visibleIndex: 2,
    //             dataField: "task",
    //             caption: "Task",
    //           },
    //           {
    //             visibleIndex: 3,
    //             dataField: "description",
    //             caption: "Description",
    //           },
    //           {
    //             visibleIndex: 4,
    //             dataField: "assignedPeople",
    //             caption: "Assigned People",
    //             // calculateDisplayValue: (cell) => {
    //             //   const assignedPeopleString = getEmployeeNamesFromIDs(cell.assignedPeople, employees).join(", ");
    //             //   return assignedPeopleString;
    //             // },
    //             editCellRender: EmployeeTagBox,
    //           },
    //           {
    //             visibleIndex: 5,
    //             dataField: "status",
    //             caption: "Status",
    //             cellRender: CustomStatusCell,
    //             groupIndex: statusIndex,
    //             groupCellRender: CustomStatusCell,
    //           },
    //           {
    //             visibleIndex: 6,
    //             dataField: "startDate",
    //             caption: "Start Date",
    //             dataType: "date",
    //           },
    //           {
    //             visibleIndex: 7,
    //             dataField: "endDate",
    //             caption: "End Date",
    //             dataType: "date",
    //             validationRules: [
    //               {
    //                 type: "async",
    //                 validationCallback: validateEndDate,
    //               },
    //             ],
    //           },
    //           {
    //             visibleIndex: 8,
    //             dataField: "createdDate",
    //             caption: "Created Date",
    //             dataType: "date",
    //             allowEditing: false,
    //           },
    //     ]
    // },
    // {
    //     ID: 2,
    //     category: "fab-matrixs",
    //     columns: [

    //         {
    //             visibleIndex: ,
    //             dataField: "startDate",
    //             caption: "Start Date",
    //             dataType: "date",
    //         },
    //         {
    //             visibleIndex: 7,
    //             dataField: "endDate",
    //             caption: "End Date",
    //             dataType: "date",
    //             validationRules: [
    //                 {
    //                     type: "async",
    //                     validationCallback: validateEndDate,
    //                 },
    //             ],
    //         },
    //     ]
    // }

]

const tabData = [
    {
        ID: 0,
        category: "purchasing",
        JSON: {
            jobNumber: {
                value: "10-744",
                status: "Completed"
            },
            hiltiEmbeds: {
                value: "hiltiii",
                status: "Completed"
            },
            MAC: {
                value: "mac 1",
                status: "In Process"
            },
            review: {
                value: "review",
                status: "Problem"
            },
        },
    },
    {
        ID: 1,
        category: "purchasing",
        JSON: {
            jobNumber: {
                value: "10-754",
                status: "Completed"
            },
            hiltiEmbeds: {
                value: "hiltiii 2",
                status: "Completed"
            },
            MAC: {
                value: "mac 2",
                status: "In Process"
            },
            boltTesting: {
                value: "bolt testing",
                status: "Not Applicable"
            }
        },
    },
]

const getDataByCategory = async (category) => {

    const tasks = await loadData("/GetTasks");
    const employees = await loadData("/GetEmployeeNames");
    const employeeNotes = await loadData("/GetEmployeeNotes");
    const settings = await loadData("/GetSettings")

    const newTasks = tasks.filter(task => task.category === category);
    const newEmployees = employees.filter(emp => emp.category === category);
    const newEmployeeNotes = employeeNotes.filter(empNote => empNote.category === category);
    const newSettings = settings.filter(s => s.category === category);

    return {
        loadedTasks: newTasks,
        loadedEmployees: newEmployees,
        loadedEmployeeNotes: newEmployeeNotes,
        loadedSettings: newSettings
    }
}

const getData = async (apiEndpoint, category) => {
    const loadedData = await loadData(apiEndpoint);
    const filteredData = loadedData.filter(item => item.category === category);
    return filteredData;
}

const parseJSON = (data, jsonKey) => {
    const newData = data != null && Array.isArray(data)
        ? data.map((item) => {
            try {
                const parsedJSON = item[jsonKey] ? JSON.parse(item[jsonKey]) : {};
                return { ...item, [jsonKey]: parsedJSON };
            } catch (error) { return { ...item, [jsonKey]: [] } }
        })
        : data
    return newData;
}

const updateDataWithJSON = (data, jsonKey) => {
    const newData = parseJSON(data, jsonKey);
    const updatedData = newData.map(item => {
        const newItem = { ...item }
        if (item[jsonKey]) {
            for (let key of Object.keys(item[jsonKey])) {
                newItem[key] = item[jsonKey][key];
            }
        }
        return newItem;
    })


    return updatedData;
}

const convertJsonToFields = (data, jsonKey) => {
    return data.map((item) => {
        const newItem = {
            ...item
        }
        if (data[jsonKey]) {
            for (const [key, value] of Object.entries(data[jsonKey])) {
                console.log(`${key}: ${value}`);
            }
        }
        return newItem;
    });
}

const convertColumns = (columnData) => {
    console.log(columnData)
    return columnData.map((item) => {
        const newItem = {
            ID: item.ID,
            category: item.category
        }
        // console.log(item.columns)
        // if (item.columns) {
        //     item.columns.forEach((col) => {
        //         newItem[col.dataField] = col.dataField;
        //     })
        // }
        return newItem;
    });
}

export {
    month,
    lightOrDark,
    getHighlight,
    toWeeks,
    toDays,
    toMondayDate,
    addDays,
    createBasicRows,
    convertDates,
    calculateWeeks,
    createRows,
    convertToDate,
    toOffset,
    getMondays,
    isDateInRange,
    getDates,
    calculateForOffSetsNew,

    loadData,
    loadAllActivitiesDates,
    loadSettings,
    postData,
    putData,
    deleteData,

    createShopDrawingDates,
    createCalendarData,

    getJobName,
    getJob,
    getEmployeeName,
    getTask,
    getJobColor,
    getEmployeeNamesFromIDs,

    getDataByCategory,
    getData,
    parseJSON,
    convertColumns,
    convertJsonToFields,
    updateDataWithJSON,
    tabData,
    columnsData,

    // employees,
    // employeeNotes,
    // tasks,
    // settings
}