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
    getJob
} from "@/lib/helper-functions";

import CustomView from "@/src/components/Views/CustomView";

const categoryKey = "glass-and-gasket";

export default function PurchasingPage(props: any) {
    const {
        loadedJobs,
        loadedShops,
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
            dataField: "orderLinkToShop",
            caption: "Link To Shop Start?",
            dataType: "boolean",
            canEdit: false,
        },
        {
            dataField: "orderWeekOf",
            dataType: "date",
            caption: "Order Week Of",
            alignment: "center",
            minWidth: 160,
            canEdit: true,
            // cellRender: orderWeekRender,
            // editCellRender: orderWeekEdit,
        },
        {
            dataField: "glassRequired",
            dataType: "date",
            caption: "Glass Required",
            alignment: "center",
            canEdit: false,
            // cellRender: (row: any) => {
            //     let date = new Date(row.data.start.value);
            //     date.setDate(date.getDate() - 14);
            //     return date;
            // },
        },
        {
            dataField: "numberOfLites",
            caption: "# Of Lites",
            alignment: "center",
            canEdit: true,
        },
        {
            dataField: "sqft",
            caption: "Square Footage",
            alignment: "center",
            canEdit: true,
        },
        {
            dataField: "vendor",
            dataType: "string",
            caption: "Vendor",
            alignment: "center",
            canEdit: true,
        },
        {
            dataField: "lbs",
            dataType: "number",
            caption: "Lbs, K",
            alignment: "center",
            canEdit: true,
        },
        {
            dataField: "gasket",
            caption: "Gasket",
            alignment: "center",
            canEdit: false,
        },
        {
            dataField: "coating",
            dataType: "string",
            caption: "Coating",
            alignment: "center",
            canEdit: true,
        },
        {
            dataField: "pgtTransferred",
            dataType: "boolean",
            caption: "PGT Transferred",
            alignment: "center",
            canEdit: false
        },
        {
            dataField: "bookingPO",
            dataType: "string",
            caption: "Booking PO",
            alignment: "center",
            canEdit: true,
        },
        {
            dataField: "pgtComplete",
            dataType: "string",
            caption: "PGT Complete",
            alignment: "center",
            canEdit: true,
        },
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