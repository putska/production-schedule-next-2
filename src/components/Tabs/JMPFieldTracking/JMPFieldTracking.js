import React, { useState, useEffect } from "react";
import DataGrid, {
    Column,
    Grouping,
    GroupPanel,
    LoadPanel,
    SearchPanel,
    Summary,
    TotalItem,
    GroupItem,
    Sorting,
    SortByGroupSummaryInfo,
    Pager,
    Export,
    Paging,
    Editing,
    Form,
    RequiredRule,
    Popup,
    Lookup,
    Toolbar,
    Item,
    Scrolling
} from "devextreme-react/data-grid";
import { TagBox, ColorBox } from "devextreme-react";
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";

import {
    month,
    convertToDate,
    convertDates,
    toOffset,
    toMondayDate,
    addDays,
    toWeeks,
    getMondays,
    getEmployees
} from "@/lib/helper-functions";

import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';

const COMPLETE_COLOR = "green";
const PROBLEM_COLOR = "red";
const IN_PROCESS_COLOR = "yellow";
const NOT_APPLICABLE_COLOR = "gray";

const JMPFieldTracking = (props) => {
    const {
        jobs,
        shops,
        columns,
        handleAdd,
        handleDelete,
        handleUpdate
    } = props;
    const [expanded, setExpanded] = useState(true);
    const [jobData, setJobData] = useState([]);
    const [canEdit, setCanEdit] = useState(true);

    useEffect(() => {
        let newJobs = convertDates(jobs).map(job => ({
            ...job,
        }));
        setJobData(newJobs)
    }, [jobs]);

    const onExporting = (e) => {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Main sheet');

        exportDataGrid({
            component: e.component,
            worksheet,
            autoFilterEnabled: true,
        }).then(() => {
            workbook.xlsx.writeBuffer().then((buffer) => {
                saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'DataGrid.xlsx');
            });
        });
        e.cancel = true;
    }

    const updateHandler = async (e, type) => {
        try {
            e.component.beginCustomLoading();
            await handleUpdate(e.data, type);
            e.component.endCustomLoading();
        } catch (error) {
            console.error(error);
            e.component.endCustomLoading();
        }
    };

    const addHandler = async (e, type) => {
        try {
            e.component.beginCustomLoading();
            await handleAdd(e.data, type);
            e.component.endCustomLoading();
        } catch (error) {
            console.error(error);
            e.component.endCustomLoading();
        }
    };

    const deleteHandler = async (e, type) => {
        try {
            e.component.beginCustomLoading();
            await handleDelete(e.data, type);
            e.component.endCustomLoading();
        } catch (error) {
            console.error(error);
            e.component.endCustomLoading();
        }
    };

    const cellPrepared = (cell) => {
        if (cell.data && cell.rowType === "data") {
            // Update the background color based on the selected status
            cell.cellElement.style.backgroundColor = "";
        }
    };

    return (
        <div style={{ margin: "3vw" }}>
            <DataGrid
                dataSource={jobData}
                showRowLines
                columnAutoWidth
                autoExpandAll
                highlightChanges={expanded}
                repaintChangesOnly
                wordWrapEnabled
                showColumnLines
                // onCellPrepared={cellPrepared}
                // onRowPrepared={renderRow}
                onExporting={onExporting}
                height={1000}
                // onEditingStart={startEditingJob}
                // onInitNewRow={onInitNewJob}
                // onRowUpdated={(e) => updateHandler(e, "job")}
                // onRowInserted={(e) => addHandler(e, "job")}
                // onRowRemoved={(e) => deleteHandler(e, "job")}
                columns={columns}
            >
                <GroupPanel visible />
                <SearchPanel visible highlightCaseSensitive={false} />
                <Grouping autoExpandAll={expanded} />
                <Sorting mode='multiple' />
                <Scrolling mode="virtual" />
                <Export enabled={true} allowExportSelectedData={true} />
                <LoadPanel enabled showIndicator />
                <Pager
                    visible={true}
                    displayMode='compact'
                    showPageSizeSelector={true}
                    allowedPageSizes={[20, 50, 100, 150, 200]}
                />
                <Paging defaultPageSize={20} />
                <Editing
                    mode="cell"
                    allowUpdating
                />

                <Toolbar>
                    <Item location="after" name="searchPanel" />
                </Toolbar>

            </DataGrid>

        </div >
    );
};

export default JMPFieldTracking;
