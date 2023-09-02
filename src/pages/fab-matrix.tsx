import React, { useState, useEffect } from "react";
import { GetStaticProps, GetStaticPaths, GetServerSideProps, NextPageContext } from 'next'
import {
    createBasicRows,
    calculateWeeks,
    loadData,
    postData,
    putData,
    deleteData,

    toMondayDate,
    createCalendarData,

    getJobName,
    getJobColor,
    getTask,

    getDataByCategory,
    columnsData,
    getJob,
    getHighlight,
    parseJSON
} from "@/lib/helper-functions";
import DailyView from "@/src/components/Views/DailyView";
import WeeklyView from "@/src/components/Views/WeeklyView";
import TasksView from "@/src/components/Views/TasksView";

import { Tabs, Tab, Box } from "@mui/material";

// VERY IMPORTANTE
const categoryKey = "fab-matrix"

const tasksViewCustomColumns: any = [

]

const statusOptions = [
    { status: "In Queue", color: "gray" },
    { status: "Scheduled", color: "#e8b64a" },
    { status: "In Progress", color: "blue" },
    { status: "Parking Lot", color: "red" },
    { status: "Done", color: "green" },
    { status: "Archived", color: "black" },
]

const buttonOptions = [
    { name: "Shop Drawings", value: "shop-drawings" },
]

interface Task {
    ID: number;
    // Add other properties as needed, for example:
    jobNumber: string;
    // ...
    weeksAfterStartDate?: number; // Define this property with the appropriate type
    weeksAfterShopStart?: number;
}

function FabMatrixPage(props: any) {
    const {
        loadedJobs,
        loadedEmployees,
        loadedEmployeeNotes,
        loadedTasks,
        loadedSettings,

        dateRows,
        weeks
    } = props;

    const [tabs, setTabs] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(2);
    const [canEdit, setCanEdit] = useState(true);

    const [selectedMonday, setSelectedMonday] = useState(new Date());
    const [week, setWeek] = useState([])

    const [jobs, setJobs] = useState(loadedJobs);
    const [employees, setEmployees] = useState([]);
    const [employeeNotes, setEmployeeNotes] = useState(loadedEmployeeNotes);
    const [tasks, setTasks] = useState(loadedTasks);
    const [settings, setSettings] = useState(loadedSettings);

    const [tasksData, setTasksData] = useState([]);
    const [settingsData, setSettingsData] = useState(settings);

    useEffect(() => {
        const filteredEmployees = loadedEmployees
            .filter((emp: any) => emp.category === categoryKey || emp.category === "project-coordinator");

        setEmployees(filteredEmployees);
        const today = new Date();
        updateWeek(today);
    }, [])

    useEffect(() => {
        const updatedJobs = parseJSON(jobs, "JSON");
        const newSettings = settings.map((setting: any) => {
            const job = getJob(setting.jobNumber, updatedJobs);
            return ({
                ...setting,
                pc: job.JSON[categoryKey]?.pc
            })
        })
        setSettingsData(newSettings);


        const updatedTasksData = parseJSON(tasks, "JSON")
            .filter((task: any) => task.category === categoryKey)
            .map((task: any) => {
                const color = getJobColor(task.jobNumber, newSettings);
                const job = getJob(task.jobNumber, jobs);
                const highlightJob = getHighlight(job.weeksToGoBackUpdated) || getHighlight(job.startUpdated);

                const weeksAfterShopStart = task.json ? task.json.weeksBeforeShopStart : 0;
                const weeksAfterStartDate = task.json ? task.json.weeksBeforeStartDate : 0;


                return {
                    ...task,
                    shopStart: job.start,
                    weeksBeforeShopStart: weeksAfterShopStart,
                    weeksAfterStartDate: weeksAfterStartDate,
                    assignedPeople: JSON.parse(task.assignedPeople),
                    color: color,
                    highlightJob: highlightJob
                }
            });
        setTasksData(updatedTasksData);
    }, [jobs, employees, tasks, settings])

    const updateWeek = (d: any) => {
        const mon = toMondayDate(d);
        const weekdays = [];
        for (let i = 0; i < 5; i++) {
            const date = new Date(mon);
            date.setDate(mon.getDate() + i);
            const dateString = date.toLocaleDateString();
            weekdays.push(dateString);
        }
        setSelectedMonday(mon);
        setWeek(weekdays);
    }

    async function handleUpdate(data: any, endpoint: any) {
        switch (endpoint) {
            case "employeeNotes":
                try {
                    const taskData = getTask(data.taskID, tasks);
                    const newTaskData = {
                        ...taskData,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        status: data.status
                    };
                    await handleUpdate(newTaskData, "tasks")
                    const resData = await putData("/UpdateEmployeeNotes", data);
                    setEmployeeNotes((prev: any) => {
                        let items = prev.filter((item: any) => data.ID !== item.ID);
                        return [...items, data];
                    })
                } catch (error) { console.log(error) }
                break;
            case "employeeNames":
                try {
                    const resData = await putData("/UpdateEmployeeName", data);
                    setEmployees((prev: any) => {
                        let items = prev.filter((item: any) => data.ID !== item.ID);
                        return [...items, data];
                    })
                } catch (error) { console.log(error) }
                break;
            case "tasks":
                try {
                    const newData = {
                        ...data,
                        assignedPeople: JSON.stringify(data.assignedPeople)
                    }
                    const resData = await putData("/UpdateTask", newData);
                    setTasks((prev: any) => {
                        let items = prev.filter((item: any) => newData.ID !== item.ID);
                        return [...items, newData];
                    })
                } catch (error) { console.log(error) }
                break;
            case "settings":
                try {
                    const resData = await putData("/UpdateSettings", data);
                    const updatedSettings = settings.map((item: any) => {
                        if (item.jobNumber === data.jobNumber) {
                            return { ...item, color: data.color, pc: data.pc };
                        }
                        return item;
                    });
                    setSettings(updatedSettings);

                    const job = getJob(data.jobNumber, parseJSON(jobs, "JSON"));
                    const newJobData = { ...job, JSON: { ...job.JSON } }
                    newJobData.JSON[categoryKey] = { ...newJobData.JSON[categoryKey], pc: data.pc }
                    newJobData.JSON = JSON.stringify(newJobData.JSON);

                    try {
                        const resData = await putData("/PutJob", newJobData);
                        setJobs((prev: any) => {
                            let items = prev.filter((item: any) => newJobData.ID !== item.ID);
                            return [...items, newJobData];
                        })
                    } catch (error) { console.log(error) }
                    break;

                } catch (error) { console.log(error) }
                break;
            default:
                break;
        }
    }

    async function handleAdd(data: any, endpoint: any) {
        switch (endpoint) {
            case "employeeNotes":
                try {
                    const taskData = getTask(data.taskID, tasks);
                    const newTaskData = {
                        ...taskData,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        status: data.status
                    };
                    await handleUpdate(newTaskData, "tasks")
                    const resData = await postData("/AddEmployeeNotes", data);
                    setEmployeeNotes((prev: any) => {
                        let items = prev.filter((item: any) => resData.ID !== item.ID && item.ID);
                        return [...items, resData];
                    })
                } catch (error) { console.log(error) }
                break;
            case "employeeNames":
                try {
                    const resData = await postData("/AddEmployeeName", data);
                    setEmployees((prev: any) => {
                        let items = prev.filter((item: any) => resData.ID !== item.ID && item.ID);
                        return [...items, resData];
                    })
                } catch (error) { console.log(error) }
                break;
            case "tasks":
                try {
                    const newData = {
                        ...data,
                        assignedPeople: JSON.stringify(data.assignedPeople)
                    }
                    const resData = await postData("/PostTask", newData);
                    setTasks((prev: any) => {
                        let items = prev.filter((item: any) => resData.ID !== item.ID && item.ID);
                        return [...items, resData];
                    })
                } catch (error) { console.log(error) }
                break;
            case "settings":
                try {
                    const resData = await postData("/AddSettings", data);
                    setSettings((prev: any) => {
                        let items = prev.filter((item: any) => resData.ID !== item.ID && item.ID);
                        return [...items, resData];
                    })
                } catch (error) { console.log(error) }

                const job = getJob(data.jobNumber, parseJSON(jobs, "JSON"));
                const newJobData = { ...job, JSON: { ...job.JSON } }
                newJobData.JSON[categoryKey] = { ...newJobData.JSON[categoryKey], pc: data.pc }
                newJobData.JSON = JSON.stringify(newJobData.JSON);

                try {
                    const resData = await putData("/PutJob", newJobData);
                    setJobs((prev: any) => {
                        let items = prev.filter((item: any) => newJobData.ID !== item.ID);
                        return [...items, newJobData];
                    })
                } catch (error) { console.log(error) }
                break;
            default:
                break;
        }
    }

    async function handleDelete(data: any, endpoint: any) {
        switch (endpoint) {
            case "employeeNotes":
                try {
                    const resData = await deleteData("/DeleteEmployeeNotes", data);
                    setEmployeeNotes((prev: any) => prev.filter((item: any) => item.ID !== data.ID));
                } catch (error) { console.log(error) }
                break;
            case "employeeNames":
                try {
                    const resData = await deleteData("/DeleteEmployees", data);
                    const newEmployeeNames = employees.filter((item: any) => item.ID !== data.ID);
                    for (let task of tasks) {
                        if (task.assignedPeople.includes(data.ID.toString())) {
                            // Split assignedPeople into an array of numbers
                            const assignedPeopleArray = task.assignedPeople.split(',').map((e: any) => parseInt(e, 0));

                            // Filter out the data.ID from the array
                            const filteredAssignedPeople = assignedPeopleArray.filter((id: any) => id !== data.ID);

                            // Join the array back into a string
                            const assignedPeople = filteredAssignedPeople.join(', ');
                            const newTask = { ...task, assignedPeople: assignedPeople };
                            await handleUpdate(newTask, "tasks");
                        }
                    }

                    for (let note of employeeNotes) {
                        if (note.empID === data.ID.toString()) {
                            await handleDelete(note, "employeeNotes");
                        }
                    }
                    setEmployees(newEmployeeNames);
                } catch (error) { console.log(error) }
                break;
            case "tasks":
                try {
                    const resData = await deleteData("/DeleteTask", data);
                    setTasks((prev: any) => prev.filter((item: any) => item.ID !== data.ID));
                } catch (error) { console.log(error) }
                break;
            case "settings":
                try {
                    const resData = await deleteData("/DeleteSettings", data);
                    setSettings((prev: any) => prev.filter((item: any) => item.ID !== data.ID));
                } catch (error) { console.log(error) }
                break;
            default:
                break;
        }
    }

    useEffect(() => {
        setTabs([
            {
                ID: 0,
                name: "Daily View",
                component: (
                    <DailyView
                        categoryKey={categoryKey}

                        jobs={jobs}

                        employees={employees}
                        employeeNotes={employeeNotes}
                        tasks={tasksData}
                        settings={settingsData}

                        selectedMonday={selectedMonday}
                        week={week}
                        updateWeek={updateWeek}
                        statusOptions={statusOptions}
                        showPCs={true}

                        handleUpdate={handleUpdate}
                        handleAdd={handleAdd}
                        handleDelete={handleDelete}

                        rows={dateRows}
                        weeks={weeks}
                        canEdit={canEdit}
                    />
                )
            },
            {
                ID: 1,
                name: "Weekly View",
                component: (
                    <WeeklyView
                        categoryKey={categoryKey}

                        jobs={jobs}

                        employees={employees}
                        employeeNotes={employeeNotes}
                        tasks={tasksData}
                        settings={settings}

                        handleUpdate={handleUpdate}
                        handleAdd={handleAdd}
                        handleDelete={handleDelete}

                        rows={dateRows}
                        weeks={weeks}
                        canEdit={canEdit}
                    />
                )
            },
            {
                ID: 2,
                name: "Tasks View",
                component: (
                    <TasksView
                        categoryKey={categoryKey}
                        jobs={jobs}

                        employees={employees}
                        employeeNotes={employeeNotes}
                        tasks={tasksData}
                        settings={settingsData}

                        customColumns={tasksViewCustomColumns}
                        linkToShopStart={true}
                        statusOptions={statusOptions}
                        buttonOptions={buttonOptions}
                        showPCs={true}

                        handleUpdate={handleUpdate}
                        handleAdd={handleAdd}
                        handleDelete={handleDelete}

                        rows={dateRows}
                        weeks={weeks}
                        canEdit={canEdit}
                    />
                )
            }
        ])
    }, [employees, employeeNotes, settings, tasks, tasksData, selectedMonday, week])

    const TabMenu = () => {

        return (
            <Box sx={{ width: "100%", marginBottom: "20px", display: "flex", justifyContent: "center" }}>
                <Tabs
                    value={selectedIndex}
                    onChange={(e, value) => setSelectedIndex(value)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab value={0} label='Daily Plan' />
                    <Tab value={1} label='Weekly Plan' />
                    <Tab value={2} label='Tasks' />
                </Tabs>
            </Box>
        )
    };

    return (
        <div style={{ margin: "2vw", alignItems: "center", justifyContent: "center" }}>
            <TabMenu />
            <div> {tabs[selectedIndex] && tabs[selectedIndex].component} </div>
        </div>
    )
}
export const getStaticProps: GetStaticProps = async (context) => {

    const jobs = await loadData("/GetJobs");
    const loadedEmployees = await loadData("/GetEmployeeNames");

    const {
        loadedTasks,
        loadedEmployeeNotes,
        loadedSettings
    } = await getDataByCategory(categoryKey);

    // for the metrics tab planned dates baseline
    const loadedJobs = [];
    for (let job of jobs) {
        const dates = await loadData(`/GetShopDrawingDates?jobNum=${job.jobNumber}`);
        if (dates.length > 0) {
            loadedJobs.push({ ...job, startDate: dates[0].startDate, endDate: dates[0].endDate })
        }
    }

    const weeks = calculateWeeks(jobs);
    const dateRows = createBasicRows(weeks);

    return {
        props: {
            loadedJobs,

            loadedTasks,
            loadedEmployees,
            loadedEmployeeNotes,
            loadedSettings,

            dateRows,
            weeks
        }
    }
}

export default FabMatrixPage;