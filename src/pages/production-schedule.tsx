import React, { useState, useEffect } from "react";

import Graph from "../components/Tabs/ProductionSchedule/PS_Graph";
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

const categoryKey = "production-schedule"

const customColumns = [
    {
        visibleIndex: 6,
        dataField: "units",
        caption: "Units",
        dataType: "number",
        alignment: "center",
        calculateCellValue: (cell: any) => cell.units
    },
    {
        visibleIndex: 7,
        dataField: "actualUnits",
        caption: "Actual Units",
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
    },
    {
        visibleIndex: 8,
        dataField: "unitsPerWeek",
        caption: "Units/Week",
        dataType: "number",
        alignment: "center",
        calculateCellValue: (cell: any) => cell.stickwall ? 0 : cell.unitsPerWeek
    },
]

export default function ProductionSchedulePage(props: any) {
    const { loadedJobs, loadedShops, newCols, newColsX } = props;

    const [tabs, setTabs] = useState([]);
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

    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        let newJobs = parseJSON(convertDates(jobs), "JSON");

        const {
            newCols,
            newColsX
        } = calculateForOffSetsNew(newJobs, startDate, endDate);

        newJobs.forEach((job: any, index: any) => {
            const startOffset = toWeeks(toMondayDate(newJobs[0].start), toMondayDate(job.start))
            job.JSON[categoryKey] = job.JSON[categoryKey] ? job.JSON[categoryKey] : {};

            newCols.forEach((innerCol: any) => {
                let isDate =
                    parseInt(innerCol.offset) >= startOffset &&
                    parseInt(innerCol.offset) < startOffset + job.weeks;

                let displayUnits: any = {
                    cellColor: "",
                    actual: job.JSON[categoryKey][innerCol.offset]
                        ? job.JSON[categoryKey][innerCol.offset].actual
                        : 0
                }

                if (isDate) {
                    const shopColor = shops.find((shop:any) => shop.__KEY__ === job.groupKey);
                    displayUnits.cellColor = shopColor ? shopColor.colorkey : "#1976d2";

                    const thisWeek = innerCol.offset - startOffset + 1;
                    displayUnits.planned = job.unitsPerWeek;

                    if (thisWeek == job.weeks) {
                        const remainderUnits = job.unitsPerWeek > 0 ? job.units % job.unitsPerWeek : 0;
                        displayUnits.planned = remainderUnits != 0 ? remainderUnits : job.unitsPerWeek;
                    }
                }

                newJobs[index][innerCol.offset.toString()] = displayUnits;
            })
        })

        setCols(newCols);
        setColsX(newColsX);
        setJobsData(newJobs);
    }, [startDate, endDate, jobs]);

    useEffect(() => {
        setTabs([
            {
                ID: 0,
                name: "Gantt",
                component: (
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
                        showEditButtons={true}
                        sortByShop={false}
                        defaultColor="#1976d2"
                        showShopButtons={true}
                        linkToFieldStart={false}

                        handleUpdate={handleUpdate}
                        handleAdd={handleAdd}
                        handleDelete={handleDelete}
                    />
                )
            },
            {
                ID: 1,
                name: "Units Graph",
                component: (
                    <Graph
                        jobs={jobsData}
                        shops={shops}
                        toMondayDate={toMondayDate}
                        addDays={addDays}
                        toWeeks={toWeeks}
                    />
                )
            }
        ])
    }, [jobsData, shops, cols, colsX, startDate, endDate]);

    const handleDateChange = (key: any, value: any) => {
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
        alert("Are you sure you want to delete this record?");
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

    const TabMenu = () => (
        <Box sx={{ width: "100%", marginBottom: "20px", display: "flex", justifyContent: "center" }}>
            <Tabs
                value={selectedIndex}
                onChange={(e, value) => setSelectedIndex(value)}
                variant="scrollable"
                scrollButtons="auto"
            >
                <Tab value={0} label='Gantt' />
                <Tab value={1} label='Graph' />
                <Button
                    variant='text'
                    color='secondary'
                    href='http://wwweb/portal/desktopmodules/wwPMDashboard/PTSchedChart_extra.htm'
                >
                    PT Tracker
                </Button>
            </Tabs>
        </Box>
    );

    return (
        <div style={{ alignItems: "center", justifyContent: "center" }}>
            <TabMenu />
            <div style={{ marginTop: "20px" }}> {tabs[selectedIndex] && tabs[selectedIndex].component} </div>
        </div>
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