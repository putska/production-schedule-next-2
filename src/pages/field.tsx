import React, { useState, useEffect } from "react";
import GanttView from "@/src/components/Views/GanttView";

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
    parseJSON
} from "@/lib/helper-functions";

const categoryKey = "field";

const customColumns: any = [
    {
        visibleIndex: 6,
        dataField: "employees",
        caption: "Avg # of Employees",
        dataType: "number",
        alignment: "center",
        calculateCellValue: (cell: any) => {
            let sum = 0;
            for (const key in cell) {
                if (!isNaN(parseInt(key)) && typeof cell[key].actual === "number") {
                    sum += cell[key].actual;
                }
            }
            return sum;
        }
    }
]

export default function FieldPage(props: any) {
    const { loadedJobs, loadedShops, newCols, newColsX } = props;

    const [tabs, setTabs] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [canEdit, setCanEdit] = useState(true);

    const convertedJobs = convertDates(loadedJobs);
    const [jobs, setJobs] = useState(convertedJobs);
    const [shops, setShops] = useState(loadedShops);

    const [jobsData, setJobsData] = useState(convertedJobs);
    const [cols, setCols] = useState(newCols);
    const [colsX, setColsX] = useState(newColsX);
    const [startDate, setStartDate] = useState(new Date());

    const lastJob = convertedJobs[convertedJobs.length - 1];
    const newEndDate = toMondayDate(addDays(lastJob.start, lastJob.weeks * 7));
    const [endDate, setEndDate] = useState(newEndDate);

    useEffect(() => {
        let newJobs = parseJSON(convertDates(jobs), "JSON");

        const { 
            newCols, 
            newColsX 
        } = calculateForOffSetsNew(newJobs, startDate, endDate);

        newJobs.forEach((job: any, index: any) => {
            job.JSON[categoryKey] = (job.JSON && job.JSON[categoryKey]) ? job.JSON[categoryKey] : {};
            
            const fieldStartOffset = toWeeks(newJobs[0].start, job.fieldStart);
            
            newCols.forEach((innerCol: any) => {
                let dataField = innerCol.offset;

                //link to field start
                dataField = innerCol.offset - fieldStartOffset;
                
                const hasActual = job.JSON[categoryKey][dataField]
                let displayUnits = {
                    cellColor: "",
                    actual: hasActual ? hasActual.actual : 0
                }
                displayUnits.cellColor = displayUnits.actual > 0 ? "#1976d2" : "";
                newJobs[index][innerCol.offset] = displayUnits;
            })
        })
        setJobsData(newJobs);
        setCols(newCols);
        setColsX(newColsX);
    }, [startDate, endDate, jobs]);

    const handleDateChange = (key:any, value:any) => {
        if (key === "startDate") {
            setStartDate(value);
        } else if (key === "endDate") {
            setEndDate(value);
        }
    }

    async function handleUpdate(data: any, endpoint: any) {
        switch (endpoint) {
            case "shop":
                try {
                    const resData = await putData("/PutShop", data);
                    setShops((prev: any) => {
                        let items = prev.filter((item: any) => data.ID !== item.ID);
                        return [...items, data];
                    })
                } catch (error) { console.log(error) }
                break;
            case "job":
                try {
                    const resData = await putData("/PutJob", data);
                    setJobs((prev: any) => {
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
            case "shop":
                try {
                    const resData = await postData("/PostShop", data);
                    setShops((prev: any) => {
                        let items = prev.filter((item: any) => resData.ID !== item.ID && item.ID);
                        return [...items, resData];
                    })
                } catch (error) { console.log(error) }
                break;
            case "job":
                try {
                    const resData = await postData("/PostJob", data);
                    setJobs((prev: any) => {
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
            case "shop":
                try {
                    const resData = await deleteData("/DeleteShop", data);
                    setShops((prev: any) => prev.filter((item: any) => item.ID !== data.ID));
                } catch (error) { console.log(error) }
                break;
            case "job":
                try {
                    const resData = await deleteData("/DeleteJob", data);
                    setJobs((prev: any) => prev.filter((item: any) => item.ID !== data.ID));
                } catch (error) { console.log(error) }
                break;
            default:
                break;
        }
    }

    return (
        <GanttView
            jobs={jobsData}
            shops={shops}

            columns={cols}
            columnsX={colsX}
            startDate={startDate}
            endDate={endDate}
            handleDateChange={handleDateChange}

            categoryKey={categoryKey}
            customColumns={customColumns}
            showEditButtons={false}
            sortByShop={false}
            linkToFieldStart={true}
            showShopButtons={true}

            handleUpdate={handleUpdate}
            handleAdd={handleAdd}
            handleDelete={handleDelete}
        />
    )
}

export async function getStaticProps() {
    const loadedJobs = await loadData("/GetJobs");
    const loadedShops = await loadData("/GetShops");

    const convertedJobs = convertDates(loadedJobs)

    const { 
        newCols, 
        newColsX 
    } = calculateForOffSetsNew(convertedJobs, convertedJobs[0].start, convertedJobs[convertedJobs.length - 1].start);

    return {
        props: {
            loadedJobs,
            loadedShops,
            newCols, newColsX
        },
    }
}