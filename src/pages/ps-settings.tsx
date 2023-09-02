import React, { useState, useEffect } from "react";
import PS_Settings from "@/src/components/Tabs/PS_Settings/PS_Settings";
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
    parseJSON
} from "@/lib/helper-functions";

export default function PS_SettingsPage(props: any) {
    const { 
        loadedColumns 
    } = props;

    const [canEdit, setCanEdit] = useState(true);
    const [tabColumns, setTabColumns] = useState(loadedColumns);

    useEffect(() => {
        const newColumns = parseJSON(loadedColumns, "columns");
        console.log(newColumns)
        setTabColumns(newColumns);
    }, [])

    async function handleUpdate(data: any, endpoint: any) {
        switch (endpoint) {
            case "column":
                try {
                    const resData = await putData("/PutColumns", data);
                    setTabColumns((prev: any) => {
                        let items = prev.filter((item: any) => data.ID !== item.ID);
                        const newItems = parseJSON(items, "columns")
                        return newItems;
                    })
                } catch (error) { console.log(error) }
                break;
            default:
                break;
        }
    }

    async function handleAdd(data: any, endpoint: any) {
        switch (endpoint) {
            case "column":
                try {
                    const resData = await postData("/PostColumns", data);
                    console.log(resData)
                    setTabColumns((prev: any) => {
                        let items = prev.filter((item: any) => resData.ID !== item.ID && item.ID);
                        const newItems = parseJSON(items, "columns")
                        return newItems;
                    })
                } catch (error) { console.log(error) }
                break;
            default:
                break;
        }
    }

    async function handleDelete(data: any, endpoint: any) {
        switch (endpoint) {
            case "column":
                try {
                    const resData = await deleteData("/DeleteColumns", data);
                    setTabColumns((prev: any) => prev.filter((item: any) => item.ID !== data.ID))
                } catch (error) { console.log(error) }
                break;
            default:
                break;
        }
    }

    return (
        <PS_Settings
            tabColumns={tabColumns}

            handleUpdate={handleUpdate}
            handleAdd={handleAdd}
            handleDelete={handleDelete}
        />
    )
}

export async function getStaticProps() {
    const loadedColumns = await loadData("/GetColumns");

    return {
        props: {
            loadedColumns
        },
    }
}