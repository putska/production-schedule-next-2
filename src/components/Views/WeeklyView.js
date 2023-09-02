import React, { useState, useEffect } from "react";
import DataGrid, {
    Column,
    SearchPanel,
    Scrolling,
    Export,
    Editing,
    Toolbar,
    Item
} from "devextreme-react/data-grid";
import {
    DateBox
} from "devextreme-react";

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

    getDataByCategory,
    createBasicRows,
    toWeeks
} from "@/lib/helper-functions";

const WeeklyView = (props) => {
    const {
        jobs,

        employees,
        employeeNotes,
        tasks,
        settings,

        rows,
        weeks
    } = props;

    const [calendarData, setCalendarData] = useState({});
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(addDays(new Date(), 10 * 7));
    const [dates, setDates] = useState(rows);

    useEffect(() => {
        const newCalendarData = createCalendarData(employees, tasks, employeeNotes);
        setCalendarData(newCalendarData);
    }, []);

    useEffect(() => {
        const newWeeks = toWeeks(startDate, endDate) + 1;
        const newDates = createBasicRows(startDate, newWeeks);
        setDates(newDates);
    }, [startDate, endDate])

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
                cell.cellElement.style.color = "black";
            }
            cell.cellElement.style.fontWeight = "bolder";
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

        return <div style={{ padding: "5px" }}>{jobName}</div>;
    }

    return (
        <DataGrid
            dataSource={employees}
            showBorders
            showRowLines
            allowColumnResizing
            columnAutoWidth
            repaintChangesOnly
            wordWrapEnabled
            columnResizingMode='widget'
            onExporting={onExporting}
            onCellPrepared={onCellPrepared}
            height="75vh"
            width="100%"
        >
            <Scrolling mode="infinite" />
            <SearchPanel visible highlightCaseSensitive={false} />
            <Export enabled={true} allowExportSelectedData={true} />

            <Toolbar>
                <Item location="before">
                    <Grid container sx={{ flexDirection: { xs: "column", md: "row" } }} spacing={1}>
                        <Grid item>
                            <DateBox
                                label="Start"
                                defaultValue={startDate}
                                style={{ position: "relative", bottom: "5px" }}
                                onValueChanged={e => setStartDate(e.value)}
                            />
                        </Grid>
                    </Grid>
                </Item>
                <Item location="before">
                    <Grid container sx={{ flexDirection: { xs: "column", md: "row" } }} spacing={1}>
                        <Grid item>
                            <DateBox
                                label="End"
                                defaultValue={endDate}
                                style={{ position: "relative", bottom: "5px" }}
                                onValueChanged={e => setEndDate(e.value)}
                            />
                        </Grid>
                    </Grid>
                </Item>
                <Item location="after" name="searchPanel" />
            </Toolbar>

            <Column
                dataField='name'
                alignment='left'
                width={150}
                fixed
            />

            {dates.map((date, i) => (
                <Column
                    key={i}
                    dataField={date.date}
                    caption={date.date}
                    allowEditing={false}
                    alignment="center"
                    minWidth={`5vw`}
                    cellRender={renderWeekTaskTemplate}
                />
            ))}
        </DataGrid>
    );
};

export default WeeklyView;
