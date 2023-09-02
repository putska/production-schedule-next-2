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
    getTask,
    getJob,
    getJobColor,
    getHighlight,
    parseJSON,

    getDataByCategory,
} from "@/lib/helper-functions";
// import DailyView from "@/src/components/Tabs/ShopDrawings/DailyView";
// import WeeklyView from "@/src/components/Tabs/ShopDrawings/WeeklyView";
// import TasksView from "@/src/components/Tabs/ShopDrawings/TasksView";
import DailyView from "@/src/components/Views/DailyView";
import WeeklyView from "@/src/components/Views/WeeklyView";
import TasksView from "@/src/components/Views/TasksView";

import MyMetrics from "@/src/components/Tabs/ShopDrawings/MyMetrics";
import { Tabs, Tab, Box, ButtonGroup } from "@mui/material";

// VERY IMPORTANTE
const categoryKey = "shop-drawings";

const tasksViewCustomColumns = [
    {
        visibleIndex: 1,
        dataField: "includeOnMetrics",
        caption: "Metrics",
        dataType: "boolean",
        alignment: "center",
        width: 100
    },
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
    { name: "Fab Matrix", value: "fab-matrix" },
    { name: "Glass and Gasket", value: "glass-and-gasket" }
]

function ShopDrawingsPage(props: any) {
    const {
        jobs,
        loadedEmployees,
        loadedEmployeeNotes,
        loadedTasks,
        loadedSettings,

        aiResult,

        dateRows,
        weeks
    } = props;

    const [tabs, setTabs] = useState([]);
    const [canEdit, setCanEdit] = useState(true);
    const [updatedJobs, setUpdatedJobs] = useState(jobs);

    const [selectedMonday, setSelectedMonday] = useState(new Date());
    const [week, setWeek] = useState([])

    const [employees, setEmployees] = useState(loadedEmployees);
    const [employeeNotes, setEmployeeNotes] = useState(loadedEmployeeNotes);
    const [tasks, setTasks] = useState(loadedTasks);
    const [settings, setSettings] = useState(loadedSettings);

    const [tasksData, setTasksData] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(2);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedValue = localStorage.getItem("shop-drawings_selectedIndex");
            setSelectedIndex(storedValue ? parseInt(storedValue, 10) : 0); // Convert the value to the desired data type
        }
        const today = new Date();
        updateWeek(today);
    }, [])

    useEffect(() => {
        localStorage.setItem("shop-drawings_selectedIndex", selectedIndex.toString());
    }, [selectedIndex]);

    useEffect(() => {
        const updatedTasksData = tasks
            .filter((task: any) => task.category === categoryKey)
            .map((task: any) => {
                const color = getJobColor(task.jobNumber, settings);
                const job = getJob(task.jobNumber, jobs);
                const highlightJob = getHighlight(job.weeksToGoBackUpdated) || getHighlight(job.startUpdated);

                return {
                    ...task,
                    assignedPeople: JSON.parse(task.assignedPeople),
                    color: color,
                    highlightJob: highlightJob
                }
            })
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
                    const resData = await putData("/UpdateTask", data);
                    setTasks((prev: any) => {
                        let items = prev.filter((item: any) => data.ID !== item.ID);
                        console.log([...items, data])
                        return [...items, data];
                    })
                } catch (error) { console.log(error) }
                break;
            case "settings":
                try {
                    const resData = await putData("/UpdateSettings", data);
                    const updatedSettings = settings.map((item: any) => {
                        if (item.jobNumber === data.jobNumber) {
                            return { ...item, color: data.color };
                        }
                        return item;
                    });
                    setSettings(updatedSettings);
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
                    await handleUpdate(newTaskData, "tasks");
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
                    const resData = await postData("/PostTask", data);
                    setTasks((prev: any) => {
                        let items = prev.filter((item: any) => resData.ID !== item.ID && item.ID);
                        return [...items, data];
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
                        settings={settings}

                        selectedMonday={selectedMonday}
                        week={week}
                        updateWeek={updateWeek}
                        statusOptions={statusOptions}
                        showPCs={false}

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
                        settings={settings}

                        customColumns={tasksViewCustomColumns}
                        linkToShopStart={false}

                        handleUpdate={handleUpdate}
                        handleAdd={handleAdd}
                        handleDelete={handleDelete}
                        statusOptions={statusOptions}
                        buttonOptions={buttonOptions}
                        showPCs={false}

                        rows={dateRows}
                        weeks={weeks}
                        canEdit={canEdit}
                    />
                )
            },
            {
                ID: 3,
                name: "Metrics 2.0",
                component: (
                    <MyMetrics
                        categoryKey={categoryKey}
                        jobs={updatedJobs}
                        tasks={tasksData}
                        settings={settings}
                        aiMetrics={aiResult}
                    />
                )
            }
        ])
    }, [employees, employeeNotes, settings, tasksData, selectedMonday, week])

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
                    <Tab value={3} label='Metrics' />
                </Tabs>
            </Box>
        )
    };

    return (
        <div style={{ alignItems: "center", justifyContent: "center" }}>
            <TabMenu />
            <div> {tabs[selectedIndex] && tabs[selectedIndex].component} </div>
        </div>
    )
}
export const getStaticProps: GetStaticProps = async (context) => {

    const loadedJobs = await loadData("/GetJobs");
    const loadedTasks = await loadData("/GetTasks");

    const {
        loadedEmployees,
        loadedEmployeeNotes,
        loadedSettings
    } = await getDataByCategory(categoryKey);

    // for the metrics tab planned dates baseline
    const jobs = [];
    for (let job of loadedJobs) {
        const dates = await loadData(`/GetShopDrawingDates?jobNum=${job.jobNumber}`);
        if (dates.length > 0) {
            jobs.push({ ...job, startDate: dates[0].startDate, endDate: dates[0].endDate })
        }
    }

    const weeks = calculateWeeks(jobs);
    const dateRows = createBasicRows(new Date(), weeks);

    // for metrics ai statement
    let aiResult = "";
    try {
        const res = await fetch(`http://localhost:3000/api/generate-answer`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: loadedTasks
            }),
        });

        const GPTdata = await res.json();
        aiResult = GPTdata.text;

    } catch (error) { console.log(error) }

    return {
        props: {
            jobs,

            loadedTasks,
            loadedEmployees,
            loadedEmployeeNotes,
            loadedSettings,

            aiResult,

            dateRows,
            weeks
        }
    }
}

export default ShopDrawingsPage;