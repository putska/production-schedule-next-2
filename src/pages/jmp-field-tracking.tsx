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

const categoryKey = "jmp-field-tracking";

export default function PanelMatrixPage(props: any) {
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
            visibleIndex: 0,
            dataField: 'jobName',
            minWidth: '300px',
            caption: 'Job Name',
            canEdit: true
        },
        {
            visibleIndex: 1,
            dataField: 'jobNumber',
            dataType: 'string',
            caption: 'Job Number',
            alignment: 'center',
            allowSorting: true,
            canEdit: true
        },
        {
            visibleIndex: 2,
            dataField: 'pm',
            caption: 'Project Manager',
            alignment: 'center',
            datatype: 'string',
            canEdit: true
        },
        {
            visibleIndex: 3,
            dataField: 'superintendent',
            caption: 'Superintendent',
            alignment: 'center',
            datatype: 'string',
            canEdit: true
        },
        {
            visibleIndex: 4,
            dataField: 'templateAdded',
            caption: 'Template Added',
            alignment: 'center',
            datatype: 'string',
            canEdit: true
        },
        {
            visibleIndex: 5,
            dataField: 'preliminaryJPS',
            caption: 'Preliminary JPS',
            alignment: 'center',
            datatype: 'string',
            canEdit: true
        },
        {
            visibleIndex: 6,
            dataField: 'jobBookedReview',
            caption: 'Job Booked review prelim JMP add field dates - Read the waterfall to determine what jobs. Update the field start date - Sen',
            alignment: 'center',
            datatype: 'string',
            canEdit: true
        },
        {
            visibleIndex: 7,
            dataField: 'prelimSent',
            caption: 'Preliminary JMP Sent to Watts',
            alignment: 'center',
            datatype: 'string',
            canEdit: true
        },
        {
            visibleIndex: 8,
            dataField: 'safetyHandOff',
            caption: 'Safety hand off - link to pallet schedule',
            alignment: 'center',
            datatype: 'string',
            canEdit: true
        },
        {
            visibleIndex: 9,
            dataField: 'fieldMonitorMeetingDate',
            caption: 'Field Monitor Meeting Date - Fill out JPS 2nd half of monitor meeting',
            alignment: 'center',
            datatype: 'date',
            canEdit: true
        },
        {
            visibleIndex: 10,
            dataField: 'warRoom',
            caption: 'War Room - 1 wk after field monitor meeting',
            alignment: 'center',
            datatype: 'boolean',
            canEdit: true
        },
        {
            visibleIndex: 11,
            dataField: 'fieldStart',
            dataType: "date",
            caption: 'Field Start',
            alignment: 'center',
            defaultSortOrder: 'asc',
            allowSorting: true,
            canEdit: true
        },
        {
            visibleIndex: 12,
            dataField: 'linkUnitInstallStart',
            caption: 'Weekly boots on the ground - link Unit install start',
            alignment: 'center',
            datatype: 'string',
            canEdit: true
        },
        {
            visibleIndex: 13,
            dataField: 'afterActionWeekly',
            caption: 'After Action - weekly',
            alignment: 'center',
            datatype: 'string',
            canEdit: true
        },
        {
            visibleIndex: 14,
            dataField: 'toGoList',
            caption: 'ToGo List',
            alignment: 'center',
            datatype: 'string',
            canEdit: true
        },
        {
            visibleIndex: 15,
            dataField: 'wolfpackJobs',
            caption: 'Wolf Pack Jobs',
            alignment: 'center',
            datatype: 'string',
            minWidth: 300,
            canEdit: true,
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