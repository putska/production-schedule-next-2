import React, { useState, useEffect } from "react";
import {
    toMondayDate,
    addDays,
    toWeeks,
    loadData,
    putData,
    postData,
    deleteData,
    convertDates,
    calculateForOffSetsNew,
    tabData,
    columnsData,
    getData,
    updateDataWithJSON,
    parseJSON,
    getJob,
    loadAllActivitiesDates
} from "@/lib/helper-functions";

import CustomView from "@/src/components/Views/CustomView";
import { Button } from "@mui/material";

import axios from 'axios';

const categoryKey = "all-activities";
const fabDrawings_categoryKey = "fab-matrix";
const shopDrawings_categoryKey = "shop-drawings";

export default function PanelMatrixPage(props: any) {
    const {
        loadedJobs,
        loadedTasks,
        loadedSettings,
        dates
    } = props;

    const [canEdit, setCanEdit] = useState(true);

    const convertedJobs = convertDates(loadedJobs);

    const [jobs, setJobs] = useState(convertedJobs);
    const [tasks, setTasks] = useState(loadedTasks);
    const [settings, setSettings] = useState(loadedSettings)

    const [currCategoryData, setCurrCategoryData] = useState([]);
    const [colorOptions, setColorOptions] = useState([]);
    const [fabMatrixs, setFabMatrixs] = useState([]);
    const [shopDrawings, setShopDrawings] = useState([]);

    useEffect(() => {
        const newColorOptions = parseJSON(settings, "JSON")
            .filter((setting: any) => setting.category === categoryKey)
            .map((setting: any) => {
                const json = setting.JSON || {};

                return {
                    ...setting,
                    value: json.value || '',
                    color: json.color || '',
                };
            });

        setColorOptions(newColorOptions);
    }, [settings])

    useEffect(() => {
        let newJobs = parseJSON(convertDates(jobs), "JSON");
        const newCategoryData = newJobs.map((job: any) => {

            job.JSON[categoryKey] = job.JSON[categoryKey] ? job.JSON[categoryKey] : {};
            const newJobData: any = { ID: job.ID }

            tabColumns.forEach((col: any) => {
                if (col.columns) {
                    col.columns.forEach((subCol: any) => {
                        newJobData[subCol.dataField] = getDisplayUnits(job, subCol);
                    })
                } else {
                    newJobData[col.dataField] = getDisplayUnits(job, col);
                }
            })
            return newJobData;
        })

        setShopDrawings(tasks.filter((task: any) => task.category === shopDrawings_categoryKey));
        setFabMatrixs(tasks.filter((task: any) => task.category === fabDrawings_categoryKey));

        setCurrCategoryData(newCategoryData);
    }, [jobs, tasks])

    const getDisplayUnits = (job: any, col: any) => {
        const categoryData = job.JSON[categoryKey][col.dataField];
        const jobData = job[col.dataField];

        let displayUnits = { value: "", status: "" }

        if (categoryData) {
            displayUnits.value = categoryData.value;
            displayUnits.status = categoryData.status;
        }
        if (jobData) {
            displayUnits.value = jobData;
        }
        return displayUnits;
    }

    async function handleUpdate(data: any, endpoint: any) {
        switch (endpoint) {
            case "job":
                try {
                    const resData = await putData("/PutJob", data);
                    setJobs((prev: any) => {
                        let items = prev.filter((item: any) => data.ID !== item.ID);
                        return [...items, data];
                    })
                } catch (error) { console.log(error) }
                break;
            case "setting":
                try {
                    const resData = await putData("/UpdateSettings", data);
                    setSettings((prev: any) => {
                        let items = prev.filter((item: any) => data.ID !== item.ID);
                        return [...items, data];
                    })
                } catch (error) { console.log(error) }
                break;
            default:
                break;
        }
    }

    async function handleAdd(data: any, endpoint: any) {
        switch (endpoint) {
            case "job":
                try {
                    const resData = await postData("/PostJob", data);
                    setJobs((prev: any) => {
                        let items = prev.filter((item: any) => resData.ID !== item.ID && item.ID);
                        return [...items, resData];
                    })
                } catch (error) { console.log(error) }
                break;
            case "setting":
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
            case "job":
                try {
                    const resData = await deleteData("/DeleteJob", data);
                    setJobs((prev: any) => prev.filter((item: any) => item.ID !== data.ID));
                } catch (error) { console.log(error) }
                break;
            case "setting":
                try {
                    const resData = await deleteData("/DeleteSettings", data);
                    setSettings((prev: any) => prev.filter((item: any) => item.ID !== data.ID));
                } catch (error) { console.log(error) }
                break;
            default:
                break;
        }
    }

    const renderDateCell = (rowData: any, type: any) => {
        const typeMapping: any = {
            "metalTakeoff": "2",
            "fieldStart": "9",
            "shopStart": "8",
            "doorSchedule": "10",
            "glassTakeoff": "4",
            "panelFabs": "4",
            "shopUseBrakeShapesAndSteel": "3",
            "fabDrawings": "7"
        };

        const dateMapping: any = {
            "metalTakeoff": rowData.metalTakeoff,
            "fieldStart": rowData.fieldStart,
            "shopStart": rowData.start,
            "doorSchedule": rowData.doorSchedule,
            "glassTakeoff": rowData.glassTakeoff,
            "panelFabs": rowData.panelFabs,
            "shopUseBrakeShapesAndSteel": rowData.shopUseBrakeShapesAndSteel,
            "fabDrawings": rowData.fabDrawings
        };

        if (!dateMapping[type] && !dateMapping[type].value) {
            return null;
        }

        const value = dateMapping[type].value;

        let result = dates.find((item: any) => item.Job_Number === rowData.jobNumber.value);
        let color = "#009E60";

        if (result && result[typeMapping[type]]) {
            let date = result[typeMapping[type]];

            let dateArr = date.split(" ");
            if (dateArr.length > 1) {
                date = dateArr[1];
                let date1 = new Date(date);
                date1.setHours(0, 0, 0, 0);
                let date2 = new Date(value);
                date2.setHours(0, 0, 0, 0);
                if (date1.getTime() === date2.getTime()) {
                    date = null;
                } else if (date1 > date2) {
                    color = "red";
                }
            } else {
                date = null;
            }

            return (
                <div>
                    <div>{value && value.toLocaleDateString()}</div>
                    <div style={{ color: color }}>{date}</div>
                </div>
            )
        } else {
            return <div>{value && value.toLocaleDateString()}</div>;
        }
    }

    const onChangeDateButtonClicked = () => {

        currCategoryData.forEach(job => {

            const dateMapping: any = {
                "metalTakeoff": job.metalTakeoff.value,
                "fieldStart": job.fieldStart.value,
                "shopStart": job.start.value,
                "doorSchedule": job.doorSchedule.value,
                "glassTakeoff": job.glassTakeoff.value,
                "panelFabs": job.panelFabs.value,
                "shopUseBrakeShapesAndSteel": job.shopUseBrakeShapesAndSteel.value,
                "fabDrawings": job.fabDrawings.value
            };

            Object.keys(dateMapping).forEach(key => {
                let date = dateMapping[key];
                if (date) {
                    date = new Date(date).toJSON();
                    console.log(date)
                    
                    // TO DO: Uncomment when done with project
                    // axios
                    //     .put(
                    //         `http://wwweb/portal/DesktopModules/ww_Global/API/PTSchedule/PutBaseline?Job_Number=${job.jobNumber}&Activity=${key}&Date=${date}`
                    //     )
                    //     .catch((error) => console.log(error));
                }
            })
        })
    };

    const tabColumns = [
        {
            dataField: "jobNumber",
            dataType: "string",
            caption: "Job Number",
            alignment: "center",
            canEdit: false,
        },
        {
            dataField: "jobName",
            dataType: "string",
            caption: "Job Name",
            alignment: "left",
            canEdit: false,
        },
        {
            dataField: "PM",
            dataType: "string",
            caption: "PM",
            alignment: "center",
            minWidth: 200,
            canEdit: true
        },
        {
            dataField: "superindentent",
            dataType: "string",
            caption: "Superintendent",
            alignment: "center",
            minWidth: 200,
            canEdit: true
        },
        {
            dataField: "startShopDrawings",
            dataType: "date",
            caption: "Start Shop Drawings",
            alignment: "center",
            canEdit: false,
            cellRender: (row: any) => {
                let dates = shopDrawings
                    .filter((task: any) => task.jobNumber === row.data.jobNumber.value)
                    .sort((a: any, b: any) => {
                        const startA = new Date(a.startDate).getTime();
                        const startB = new Date(b.startDate).getTime();
                        return startA - startB;
                    })
                row.data.shopDrawings = {}
                row.data.shopDrawings.value = dates.length > 0 ? new Date(dates[0].startDate) : null;
                return row.data.shopDrawings.value ? row.data.shopDrawings.value.toLocaleDateString() : "";
            }
        },
        {
            dataField: "metalTakeoff",
            caption: "Start Metal and Misc Takeoff",
            alignment: "center",
            canEdit: false,
            cellRender: (e: any) => renderDateCell(e.data, "metalTakeoff"),
        },
        {
            dataField: "glassTakeoff",
            dataType: "date",
            caption: "Start Glass Takeoff",
            alignment: "center",
            canEdit: false,
            cellRender: (e: any) => renderDateCell(e.data, "glassTakeoff"),
        },
        {
            dataField: "doorSchedule",
            dataType: "date",
            caption: "Start Door Schedule",
            alignment: "center",
            canEdit: false,
            cellRender: (e: any) => renderDateCell(e.data, "doorSchedule"),
        },
        {
            dataField: "shopUseBrakeShapesAndSteel",
            dataType: "date",
            caption: "Start Shop Use Brake Shapes",
            alignment: "center",
            canEdit: false,
            cellRender: (e: any) => renderDateCell(e.data, "shopUseBrakeShapesAndSteel"),
        },
        {
            dataField: "panelFabs",
            dataType: "date",
            caption: "Panel Fabs",
            alignment: "center",
            canEdit: false,
            cellRender: (e: any) => renderDateCell(e.data, "panelFabs"),
        },
        {
            dataField: "panelRelease",
            dataType: "date",
            caption: "Panel Release",
            alignment: "center",
            canEdit: false,
        },
        {
            dataField: "fabDrawings",
            dataType: "date",
            caption: "Fab Drawings",
            alignment: "center",
            canEdit: false,
            calculateCellValue: (row: any) => {
                let dates = fabMatrixs
                    .filter((task: any) => task.jobNumber === row.jobNumber.value)
                    .sort((a: any, b: any) => {
                        const startA = new Date(a.startDate).getTime();
                        const startB = new Date(b.startDate).getTime();
                        return startA - startB;
                    })
                row.fabDrawings = {}
                row.fabDrawings.value = dates.length > 0 ? new Date(dates[0].startDate) : null;
            },
            cellRender: (e: any) => renderDateCell(e.data, "fabDrawings"),
        },
        {
            dataField: "start",
            dataType: "date",
            caption: "Shop Start",
            alignment: "center",
            canEdit: false,
            cellRender: (e: any) => renderDateCell(e.data, "shopStart"),
        },
        {
            dataField: "fieldStart",
            dataType: "date",
            caption: "Field Start",
            alignment: "center",
            canEdit: false,
            cellRender: (e: any) => renderDateCell(e.data, "fieldStart"),
        },
    ]

    return (
        <div>
            <Button
                variant="contained"
                style={{ marginBottom: "20px" }}
                onClick={onChangeDateButtonClicked}
            >
                Update Dates
            </Button>
            <CustomView
                jobs={jobs}
                data={currCategoryData}
                tabColumns={tabColumns}
                categoryKey={categoryKey}
                colorOptions={colorOptions}

                handleUpdate={handleUpdate}
                handleAdd={handleAdd}
                handleDelete={handleDelete}
                canEdit={canEdit}
            />
        </div>
    )
}

export async function getStaticProps() {
    const loadedJobs = await loadData("/GetJobs");
    const loadedTasks = await loadData("/GetTasks");
    const dates = await loadAllActivitiesDates();

    const loadedSettings = await loadData("/GetSettings");

    return {
        props: {
            loadedJobs,
            loadedTasks,
            loadedSettings,
            dates
        },
    }
}