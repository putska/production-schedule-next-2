import React, { useState, useEffect } from "react";
import DataGrid, {
    Column,
    SearchPanel,
    Scrolling,
    Export,
    Editing
} from "devextreme-react/data-grid";
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import Typography from "@mui/material/Typography";
import {
    Stack,
    Button as MaterialButton,
    Checkbox,
    Grid,
    FormControlLabel,
    FormGroup
} from '@mui/material';
import {
    createCalendarData,
    toMondayDate,
    isDateInRange,
    addDays,

    getEmployeeName,
    getJobName,
    getJobColor,

    getDataByCategory
} from "@/lib/helper-functions";

const WeeklyView = (props) => {
    const {
        jobs,

        employees,
        employeeNotes,
        tasks,
        settings,

        updateEmployees,
        updateEmployeeNotes,
        updateTasks,
        updateSettings,

        rows,
        handleUpdate,
        weeks,
        canEdit,
        handleDelete,
        handleAdd,
    } = props;

    const [expanded, setExpanded] = useState(true);
    const [calendarData, setCalendarData] = useState({});

    useEffect(() => {
        const newCalendarData = createCalendarData(employees, tasks, employeeNotes);
        setCalendarData(newCalendarData);
    }, []);

    const updateRowHandler = async (e) => {
        try {
            //   const res = await axios.get(
            //     `/desktopmodules/ww_Global/API/PSDev/GetShopDrawing?ID=${e.oldData.ID}`
            //   );

            //   const data = { ...res.data, ...e.newData };

            e.component.beginCustomLoading();
            await handleUpdate("shopDrawing", data);
            e.component.endCustomLoading();
        } catch (error) {
            console.error(error);
            e.component.endCustomLoading();
        }
    };

    const addRowHandler = async (e) => {
        e.component.beginCustomLoading();

        await handleAdd("shopDrawing", e.data);

        e.component.endCustomLoading();
    };

    const deleteRowHandler = async (e) => {
        e.component.beginCustomLoading();

        await handleDelete("shopDrawing", e.data);

        e.component.endCustomLoading();
    };

    const onExporting = (e) => {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Main sheet');

        exportDataGrid({
            component: e.component,
            worksheet,
            autoFilterEnabled: true,
        }).then(() => {
            workbook.xlsx.writeBuffer().then((buffer) => {
                saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'ShopDrawings.xlsx');
            });
        });
        e.cancel = true;
    }

    const onCellPrepared = (cell) => {
        if (cell.column.dataField === toMondayDate(new Date()).toLocaleDateString()) {
            if (cell.rowType === "header") {
                cell.cellElement.style.backgroundColor = "#c2eafc";
            }
            cell.cellElement.style.fontWeight = "bolder";
            cell.cellElement.style.color = "black";
            cell.cellElement.style.borderLeft = "solid #c2eafc 5px";
            cell.cellElement.style.borderRight = "solid #c2eafc 5px";
        }
    }

    const renderWeekTaskTemplate = (row) => {
        const start = toMondayDate(row.column.dataField);
        const end = addDays(start, 7);

        const workingJobs = calendarData[row.data.name]
            ? calendarData[row.data.name]
                .filter(taskNote => isDateInRange(taskNote.date, start, end))
                .map(taskNote => taskNote.jobNumber)
            : [];

        // Find the job that appears the most
        const jobCountMap = {};
        let maxCount = 0;
        let mainJob = "";

        workingJobs.forEach(job => {
            if (jobCountMap[job]) {
                jobCountMap[job]++;
            } else {
                jobCountMap[job] = 1;
            }

            if (jobCountMap[job] > maxCount) {
                maxCount = jobCountMap[job];
                mainJob = job;
            }
        });

        const jobName = mainJob ? getJobName(mainJob, jobs) : "";
        const color = mainJob ? getJobColor(mainJob, settings) : "";

        return <div style={{ color: color, padding: "5px" }}>{jobName}</div>;
    };


    return (
        <div style={{ margin: "3vw" }}>
            <DataGrid
                dataSource={employees}
                showBorders
                showRowLines
                allowColumnResizing
                columnAutoWidth
                repaintChangesOnly
                wordWrapEnabled
                autoExpandAll={expanded}
                columnResizingMode='widget'
                onExporting={onExporting}
                onCellPrepared={onCellPrepared}
            >
                <Editing
                // mode="cell" useIcons allowAdding allowDeleting allowUpdating
                />
                <Scrolling mode="infinite" />
                <SearchPanel visible highlightCaseSensitive={false} />
                <Export enabled={true} allowExportSelectedData={true} />

                <Column
                    dataField='name'
                    alignment='left'
                    width={"auto"}
                    allowEditing
                />

                {/* rows is actually dateRows aka array of date strings */}
                {rows.map((date, i) => (
                    <Column
                        key={i}
                        dataField={date.date}
                        caption={date.date}
                        allowEditing={false}
                        alignment="center"
                        cellRender={renderWeekTaskTemplate}
                    />
                ))}
            </DataGrid>
        </div>
    );
};

export default WeeklyView;
