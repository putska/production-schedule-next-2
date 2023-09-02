import React, { useState, useEffect } from "react";
import Purchasing from "@/src/components/Tabs/Purchasing/Purchasing";

import { Button, Tabs, Tab, Box } from "@mui/material";
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
    getJob
} from "@/lib/helper-functions";

import CustomView from "@/src/components/Views/CustomView";

const categoryKey = "purchasing";

export default function PurchasingPage(props: any) {
    const {
        loadedJobs,
        loadedShops,
        loadedColorOptions,
        loadedSettings
    } = props;

    const [canEdit, setCanEdit] = useState(true);

    const convertedJobs = convertDates(loadedJobs);

    const [jobs, setJobs] = useState(convertedJobs);
    const [shops, setShops] = useState(loadedShops);
    const [settings, setSettings] = useState(loadedSettings);

    const [currCategoryData, setCurrCategoryData] = useState([]);
    const [colorOptions, setColorOptions] = useState([]);

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
        let newJobs = convertDates(parseJSON(jobs, "JSON"));
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
        setCurrCategoryData(newCategoryData);
    }, [jobs])

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

    const jobWallCell = (row: any) => {
        const job = getJob(row.data.jobNumber.value, jobs);
        return (
            <div style={{ textAlign: "left" }}>
                <span>{job.jobName}</span>
                <br></br>
                <span style={{ color: "#5a87d1" }}>{job.wallType}</span>
            </div>
        );
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

    const tabColumns = [
        {
            dataField: "jobNumber",
            dataType: "string",
            caption: "Job Number",
            visibleIndex: 0,
            alignment: "center",
            allowSorting: true,
            canEdit: false,
        },
        {
            dataField: "jobName",
            caption: "Job Name & Wall Type",
            visibleIndex: 1,
            alignment: "left",
            canEdit: false,
            minWidth: 200,
            cellRender: jobWallCell
        },
        {
            dataField: "start",
            caption: "Shop Start Date",
            visibleIndex: 2,
            alignment: "center",
            defaultSortOrder: "asc",
            allowSorting: true,
            canEdit: false,
            dataType: "date"
        },
        {
            dataField: "fieldStart",
            caption: "Field Start",
            visibleIndex: 3,
            dataType: "date",
            canEdit: false,
            alignment: "center",
        },
        {
            dataField: "shop",
            caption: "Shop",
            visibleIndex: 4,
            alignment: "center",
            canEdit: false,
            cellRender: (cell: any) => {
                const jobData = jobs.find((job: any) => job.ID === cell.data.ID);
                const foundShop = shops.find((shop: any) => shop.__KEY__ === jobData?.groupKey);
                return foundShop ? foundShop.shop : "";
            }
        },
        {
            visibleIndex: 5,
            dataField: "hiltiEmbeds",
            caption: "Hilti Embeds",
            dataType: "string",
            canEdit: true
        },
        {
            visibleIndex: 6,
            dataField: "MAC",
            caption: "MAC",
            dataType: "string",
            canEdit: true
        },
        {
            visibleIndex: 7,
            dataField: "metalBooking",
            caption: "Metal Booking",
            dataType: "string",
            canEdit: true
        },
        {
            visibleIndex: 8,
            dataField: "glassBooking",
            caption: "Glass Booking",
            dataType: "string",
            canEdit: true
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
                    canEdit: true
                },
                {
                    visibleIndex: 1,
                    dataField: "certified",
                    caption: "Certified",
                    dataType: "string",
                    canEdit: true
                },
                {
                    visibleIndex: 2,
                    dataField: "composite",
                    caption: "Composite",
                    dataType: "string",
                    canEdit: true
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
                    dataType: "string",
                    canEdit: true
                },
                {
                    visibleIndex: 1,
                    dataField: "glass",
                    caption: "Glass",
                    dataType: "string",
                    canEdit: true
                },
                {
                    visibleIndex: 2,
                    dataField: "metal",
                    caption: "Metal",
                    dataType: "string",
                    canEdit: true
                },
                {
                    visibleIndex: 3,
                    dataField: "panel",
                    caption: "Panel",
                    dataType: "string",
                    alignment: "center",
                    canEdit: true
                },
                {
                    visibleIndex: 4,
                    dataField: "gasket",
                    caption: "Gasket",
                    dataType: "string",
                    alignment: "center",
                    canEdit: true
                },
            ]
        },
        {
            visibleIndex: 6,
            dataField: "shopSealant",
            caption: "Shop Sealant",
            dataType: "string",
            canEdit: true
        },
        {
            visibleIndex: 7,
            dataField: "boltTesting",
            caption: "Bolt Testing",
            dataType: "string",
            canEdit: true
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
                    canEdit: true
                },
                {
                    visibleIndex: 1,
                    dataField: "doorPaint",
                    caption: "Door Paint",
                    dataType: "string",
                    canEdit: true
                },
                {
                    visibleIndex: 3,
                    dataField: "threeWeekUpdate",
                    caption: "3 Week Update and PM/Shop Notification",
                    dataType: "string",
                    canEdit: true
                }
            ]
        },
        {
            visibleIndex: 9,
            dataField: "fieldUseReport3Updates",
            caption: "Field Use Report 3 Updates (2 weeks prior to due date.  Due 8 weeks prior to field start date.)",
            dataType: "string",
            canEdit: true
        }
    ]

    return (
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
    )
}

export async function getStaticProps() {
    const loadedJobs = await loadData("/GetJobs");
    const loadedShops = await loadData("/GetShops");
    const loadedSettings = await loadData("/GetSettings");

    return {
        props: {
            loadedJobs,
            loadedShops,
            loadedSettings
        },
    }
}