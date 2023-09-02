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

import Checkbox from '@mui/material/Checkbox';

import CustomView from "@/src/components/Views/CustomView";

const categoryKey = "panel-matrix";

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
            dataField: 'linkToField',
            caption: 'Link to Field Start',
            dataType: 'boolean',
            canEdit: true
        },
        {
            dataField: 'jobNumber',
            dataType: 'string',
            caption: 'Job Number',
            alignment: 'center',
            canEdit: true,
        },
        {
            dataField: 'jobName',
            dataType: 'string',
            caption: 'Job Name',
            alignment: 'left',
            canEdit: true,
        },
        {
            dataField: 'start',
            dataType: 'date',
            caption: 'Shop Start',
            alignment: 'center',
            canEdit: true,
        },
        {
            dataField: 'fieldStart',
            dataType: 'date',
            caption: 'Field Start',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'panelFabs',
            dataType: 'date',
            caption: 'Panel Fabs',
            minWidth: 160,
            alignment: 'center',
            canEdit: true
            //   cellRender: panelFabsRender,
            //   editCellRender: panelFabsEdit,
        },
        {
            dataField: 'panelRelease',
            dataType: 'date',
            caption: 'Panel Release',
            alignment: 'center',
            minWidth: 160,
            canEdit: true
            //   cellRender: panelReleaseRender,
            //   editCellRender: panelReleaseEdit,
        },
        {
            dataField: 'dollarAmount',
            dataType: 'number',
            caption: 'Dollar Amount',
            alignment: 'center',
            canEdit: true,
            cellRender: (cell: any) => (cell.data.dollarAmount?.value ? `$ ${cell.data.dollarAmount.value}` : ""),
        },
        {
            dataField: 'sqft',
            dataType: 'number',
            caption: 'Sq. Ft.',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'pnl_vendor',
            dataType: 'string',
            caption: 'Vendor',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'costPerSqft',
            dataType: 'number',
            caption: '$ per Sq. Ft.',
            alignment: 'center',
            canEdit: true,
            cellRender: (row: any) => {
                return (row.data.dollarAmount?.value && row.data.sqft?.value) ? `$ ${(row.data.dollarAmount?.value / row.data.sqft?.value).toFixed(2)}` : "";
            }
        },
        {
            dataField: 'panelRFQ',
            caption: 'Panel RFQ',
            dataType: 'boolean',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'proposedPanelReleases',
            dataType: 'number',
            caption: 'Proposed Panel Releases (from Sherwin)',
            alignment: 'center',
            headerColor: " #1976d2",
            canEdit: true
        },
        {
            dataField: 'panelScope',
            caption: 'Panel Scope',
            alignment: 'center',
            headerColor: " #1976d2",
            canEdit: true
        },
        {
            dataField: 'vendorKickOffLetter',
            dataType: 'string',
            caption: 'Vendor Kick-Off Letter',
            alignment: 'center',
            headerColor: " #1976d2",
            canEdit: true
        },
        {
            dataField: 'kickOffMeeting',
            dataType: 'string',
            caption: 'PM/Vendor Kick-Off Meeting',
            alignment: 'center',
            headerColor: " #1976d2",
            canEdit: true
        },
        {
            dataField: 'finalPanelReleases',
            dataType: 'number',
            caption: 'Final Panel Releases',
            alignment: 'center',
            headerColor: " #1976d2",
            canEdit: true
        },
        {
            dataField: 'keyNotes',
            dataType: 'string',
            caption: 'Key Notes for Scope',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'finish',
            dataType: 'string',
            caption: 'Finish',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'certifiedMatchApproved',
            dataType: 'boolean',
            caption: 'Certified Match Approved',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'warranty',
            dataType: 'string',
            caption: 'Warranty',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'deliveryStartDateShop',
            dataType: 'date',
            caption: 'Delivery Start Date Shop',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'deliveryStartDateField',
            dataType: 'date',
            caption: 'Delivery Start Date Field',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'shopUseBrakes',
            dataType: 'date',
            caption: 'Shop Use Brakes Shape Release',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'shopUseSteel',
            dataType: 'date',
            caption: 'Shop Use Steel Release',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'glazeInPanelRelease',
            dataType: 'date',
            caption: 'Glaze-In Panel Release',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'fieldUsePanelRelease',
            dataType: 'date',
            caption: 'Field Use Panel Release',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'QC',
            caption: 'QC',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'doorLeafs',
            dataType: 'number',
            caption: '# of Door Leafs',
            alignment: 'center',
            canEdit: true
        },
        {
            dataField: 'notes',
            dataType: 'string',
            caption: 'Notes',
            alignment: 'left',
            canEdit: true
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