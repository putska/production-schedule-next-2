import React, { useState, useEffect } from "react";

import TakeoffMatrix from "@/src/components/Tabs/TakeoffMatrix/TakeoffMatrix"
import {
    toMondayDate,
    addDays,
    toWeeks,
    createBasicRows,
    calculateWeeks,
    getHighlight,
    createRows,
    convertDates,
    loadData,
    putData,
    postData,
    deleteData
} from "@/lib/helper-functions";

export default function TakeoffMatrixPage(props:any) {
    const { loadedJobs, loadedTakeoffMatrixs, dateRows, weeks } = props;

    const [canEdit, setCanEdit] = useState(true)
    const [takeoffData, setTakeoffData] = useState([]);
    const [hJobs, sethJobs] = useState([]);
    const [jobs, setJobs] = useState(loadedJobs);
    const [takeoffMatrixs, setTakeoffMatrixs] = useState(loadedTakeoffMatrixs);

    useEffect(() => {
        const createdRows = createRows(takeoffMatrixs, dateRows, jobs, weeks);
        setTakeoffData(createdRows);

        const tempJobs = convertDates(jobs);

        sethJobs(tempJobs.filter((job: any) => {
            return getHighlight(job.weeksToGoBackUpdated) || getHighlight(job.startUpdated);
        }))

    }, [jobs, takeoffMatrixs])

    async function handleUpdate(data: any, endpoint: any) {
        switch (endpoint) {
            case "takeoffMatrix":
                try {
                    const resData = await putData("/PutTakeoffMatrix", data);
                    setTakeoffMatrixs((prev: any) => {
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
            case "takeoffMatrix":
                try {
                    const resData = await postData("/PostTakeoffMatrix", data);
                    setTakeoffMatrixs((prev: any) => {
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
            case "takeoffMatrixs":
                try {
                    const resData = await deleteData("/DeleteTakeoffMatrix", data);
                    setTakeoffMatrixs((prev: any) => prev.filter((item: any) => item.ID !== data.ID));
                } catch (error) { console.log(error) }
                break;
            default:
                break;
        }
    }

    return (
        <TakeoffMatrix
            takeoffMatrixs={takeoffMatrixs}
            takeoffData={takeoffData}
            handleUpdate={handleUpdate}
            handleAdd={handleAdd}
            handleDelete={handleDelete}
            rows={dateRows}
            weeks={weeks}
            createRows={createRows}
            toWeeks={toWeeks}
            toMondayDate={toMondayDate}
            addDays={addDays}
            canEdit={canEdit}
            highlightJobs={hJobs}
        />
    )
}

export async function getStaticProps() {
    const loadedJobs = await loadData("/GetJobs");
    const loadedTakeoffMatrixs = await loadData("/GetTakeoffMatrixs")

    const weeks = calculateWeeks(loadedJobs);
    const dateRows = createBasicRows(new Date(), weeks);

    return {
        props: {
            loadedJobs, 
            loadedTakeoffMatrixs,
            dateRows,
            weeks
        },
    }
}