import React, { useState, useEffect, useRef } from "react";
import DataGrid, {
  Column,
  LoadPanel,
  SearchPanel,
  Editing,
  Toolbar,
  Item
} from "devextreme-react/data-grid";
import {
  Grid,
  Box,
  Typography,
  Button as MaterialButton,
  LinearProgress
} from '@mui/material';

import {
  month,
  convertToDate,
  toOffset,
  toMondayDate,
  getMondays,
  loadData,

  convertDates,
  addDays,
  toWeeks,
  toDays,
  isDateInRange,

  getEmployeeName,
  getJobName,
  getJobColor
} from "@/lib/helper-functions";

// styles --- coloring
const PLANNED_DATE = "blue";
const ACTUAL_DATE = "#33ab9f";
const PROGRESS_DATE = "#00695f";

const COMPLETED_STATUS = "Done";

const MyMetrics = (props) => {
  const { jobs, tasks, settings, aiMetrics } = props;

  const datagridRef = useRef(null);
  const [columns, setColumns] = useState([]);
  const [columnsX, setColumnsX] = useState([]);
  const [jobData, setJobData] = useState([]);
  const [today, setToday] = useState(new Date());
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [width, setWidth] = useState(800);
  const [totalWidth, setTotalWidth] = useState(0);
  const [cellSize, setCellSize] = useState(50);
  const [showDetails, setShowDetails] = useState(true);
  const [datagridWidth, setDatagridWidth] = useState(0);
  const [jobTotalDuration, setJobTotalDuration] = useState(0);

  useEffect(() => {
    const newDatagridWidth = window.innerWidth - 100;
    const newWidth = showDetails ? 800 : 300;
    setCellSize((newDatagridWidth - newWidth) / jobTotalDuration);
  }, [window.innerWidth, showDetails, jobTotalDuration]);

  useEffect(() => {
    const jobsToInclude = tasks
      .filter(task => task.includeOnMetrics)
      .map(task => task.jobNumber)

    if (jobsToInclude.length > 0) {
      const convertedJobs = convertDates(jobs);

      let counter = 0;
      const updatedJobs = convertedJobs
        .filter((job) => jobsToInclude.indexOf(job.jobNumber) != -1)
        .map((job, i) => {
          const { progress, progressChange, start, end, totalDuration } = calculateProgress(job);
          counter++;

          return ({
            jobName: job.jobName,
            jobNumber: job.jobNumber,
            sheets: job.SD_sheets,
            notes: job.SD_metrics_notes,

            start: new Date(start),
            end: new Date(end),
            plannedStart: new Date(job.startDate),
            plannedEnd: new Date(job.endDate),

            progress: progress,
            progressChange: progressChange,
            totalDuration: totalDuration
          });
        });

      let colStart = new Date(); // Set colStart to a default date
      let colEnd = new Date(); // Set colEnd to a default date

      if (updatedJobs.length > 0) {
        colStart = updatedJobs.reduce((prevStart, job) => {
          const earliestStart = new Date(Math.min(job.start, job.plannedStart));
          return earliestStart < prevStart ? earliestStart : prevStart;
        }, new Date());

        colEnd = updatedJobs.reduce((prevEnd, job) => {
          const latestEnd = new Date(Math.max(job.end, job.plannedEnd));
          return latestEnd > prevEnd ? latestEnd : prevEnd;
        }, new Date());
      }

      updatedJobs.sort((a, b) => {
        const startA = new Date(a.start).getTime();
        const startB = new Date(b.start).getTime();
        return startA - startB;
      })

      setStartDate(toMondayDate(colStart));
      setEndDate(toMondayDate(colEnd));

      setSelectedJobs(updatedJobs);
      setJobData(convertedJobs);

      const totalDuration = toWeeks(colStart, colEnd);
      setJobTotalDuration(totalDuration);

      const today = new Date();
      today.setDate(1);
      const startOffset = toWeeks(updatedJobs[0].start, colStart);

      let newCols = [];
      let newColsX = [];

      for (let i = startOffset; i <= startOffset + totalDuration; i++) {
        newCols.push({
          offset: i,
          date: convertToDate(colStart, i - startOffset),
        });
      }

      var i = startOffset;
      do {
        var d = convertToDate(colStart, i);

        var mondays = getMondays(new Date(d));
        let innerColsX = [];
        var j = 0;
        do {
          innerColsX.push({
            offset: i,
            date: convertToDate(colStart, i),
          });
          i++;
          j++;
        } while (j < mondays.length);
        let mnth =
          month[d.substring(0, d.indexOf("/"))] +
          " " +
          d.substring(d.length - 2, d.length);
        newColsX.push({
          month: mnth,
          innerColsX,
        });
      } while (i <= startOffset + totalDuration);

      setColumnsX(newCols);
      setColumns(newColsX);
    }

  }, [jobs])

  const calculateProgress = (job) => {
    let totalDuration = 0;
    let completedDuration = 0;
    let completedProgressDuration = 0;

    // filter shop drawings data so that it only holds tasks related to current job
    const filteredTasks = tasks.filter(task => task.includeOnMetrics && task.jobNumber === job.jobNumber);

    // Sort the tasks by the start date
    filteredTasks.sort((task1, task2) => new Date(task1.startDate).getTime() - new Date(task2.startDate).getTime());

    // go through each filtered task and add # days for task to completed duration
    filteredTasks.forEach(task => {
      let taskDuration = toDays(task.startDate, task.endDate);

      // add to totalDuration for each assigned task
      totalDuration += taskDuration;

      // add to completedDuration if completed
      if (task.status === COMPLETED_STATUS) {
        completedDuration += taskDuration;
      }

      // if a job task was completed in the previous week, 
      // meaning it's end date is in the previous week and it's status is completed, 
      // then add that number of days to completedProgressDuration
      const prevWeekMon = addDays(toMondayDate(today), -7);
      if (task.status === "Completed" && isDateInRange(new Date(task.endDate), prevWeekMon, toMondayDate(today))) {
        completedProgressDuration += taskDuration;
      }
    })

    // Check if the start date is before the current date
    const progress = totalDuration > 0
      ? (completedDuration / totalDuration)
      : 0;

    const progressChange = completedDuration > 0
      ? ((completedProgressDuration / completedDuration) * 100)
      : 0;

    const start = filteredTasks[0].startDate;
    const end = filteredTasks[filteredTasks.length - 1].endDate;

    return { progress: progress, progressChange: progressChange, start: start, end: end, totalDuration: totalDuration };
  }

  const rowPrepared = (row) => {
    const totalWeeks = toWeeks(row.data.start, row.data.end);
    const timelineWidth = totalWeeks * cellSize;

    const totalPlannedWeeks = toWeeks(row.data.plannedStart, row.data.plannedEnd);
    const timelinePlannedWidth = totalPlannedWeeks * cellSize;

    const progressWidth = row.data.progress * timelineWidth;

    const offset = width + ((toWeeks(startDate, row.data.start) + 1) * cellSize);
    const plannedOffset = width + ((toWeeks(startDate, row.data.plannedStart) + 1) * cellSize);

    return (
      <Grid container style={{ position: "relative", width: `${width}px`, height: '50px', marginBottom: "20px" }}>
        <Grid item style={{ width: "100px", color: getJobColor(row.data.jobNumber, settings) }}>{row.data.jobName}</Grid>

        {showDetails && <Grid item style={{ width: "100px" }}>{new Date(row.data.start).toLocaleDateString()}</Grid>}
        {showDetails && <Grid item style={{ width: "100px" }}>{new Date(row.data.end).toLocaleDateString()}</Grid>}
        {showDetails && <Grid item style={{ width: "100px" }}>{new Date(row.data.plannedStart).toLocaleDateString()}</Grid>}
        {showDetails && <Grid item style={{ width: "100px" }}>{new Date(row.data.plannedEnd).toLocaleDateString()}</Grid>}

        {showDetails && <Grid item style={{ width: "100px" }}>{row.data.sheets}</Grid>}
        {showDetails && <Grid item style={{ width: "100px" }}>{row.data.sheetsPerDay}</Grid>}

        <Grid item style={{ width: "100px" }}>{row.data.notes}</Grid>

        <Grid item style={{
          position: "absolute",
          top: 0,
          left: `${plannedOffset}px`,
          width: `${timelinePlannedWidth}px`,
          height: "10%",
          overflow: "visible",
          backgroundColor: PLANNED_DATE
        }}>
        </Grid>

        <Grid item style={{
          position: "absolute",
          top: 0,
          left: `${offset}px`,
          width: `${timelineWidth}px`,
          height: "100%",
          overflow: "visible",
          backgroundColor: ACTUAL_DATE
        }}>
        </Grid>

        <Grid item style={{
          position: "absolute",
          top: "15px",
          left: `${offset + 10}px`,
          width: `${timelineWidth}px`,
          height: "100%",
          overflow: "visible",
        }}>
          {row.data.progress}%
        </Grid>

        <Grid item style={{
          position: "absolute",
          top: 0,
          left: `${offset + progressWidth}px`,
          height: "100%",
          overflow: "visible",
          backgroundColor: PROGRESS_DATE
        }}>
        </Grid>

        <Grid item style={{
          position: "absolute",
          top: "15px",
          left: `${offset + timelineWidth + 10}px`,
          height: "100%",
          overflow: "visible",
          color: "red",
        }}>
          +{row.data.progressChange}%
        </Grid>

      </Grid>
    )
  }

  return (
    <div>
      <DataGrid
        dataSource={selectedJobs}
        ref={datagridRef}
        showColumnLines={false}
        height={500}
        highlightChanges
        repaintChangesOnly
        wordWrapEnabled
        dataRowRender={rowPrepared}
        width="100%"
      >
        <SearchPanel visible highlightCaseSensitive={false} />
        <LoadPanel enabled showIndicator />

        <Toolbar>
          <Item location="before">
            <MaterialButton
              variant="outlined"
              onClick={e => {
                const newShowDetails = !showDetails;
                setShowDetails(!showDetails);
                const newWidth = newShowDetails ? 800 : 300;
                setWidth(newWidth);
              }}
            >
              {showDetails ? "Hide details" : "Show Details"}
            </MaterialButton>
          </Item>
          <Item location="after" name="searchPanel" />
        </Toolbar>

        <Editing
          mode="cell"
          allowUpdating
        />

        <Column
          dataField="jobName"
          caption="Job Name"
          width={100}
          alignment='center'
          cellRender={cell => {
            const color = getJobColor(cell.data.jobNumber, settings);
            return (
              <div
                style={{ color: `${color}` }} >
                {cell.value}
              </div>
            )
          }}
        />
        <Column
          dataField="start"
          caption="Start Date"
          visible={showDetails}
          width={100}
          alignment='center'
          calculateDisplayValue={cell => cell.start && cell.start.toLocaleDateString()}
        />
        <Column
          dataField="end"
          caption="End Date"
          visible={showDetails}
          width={100}
          alignment='center'
          calculateDisplayValue={cell => cell.end && cell.end.toLocaleDateString()}
        />

        <Column
          dataField="plannedStart"
          caption="Planned Start Date"
          visible={showDetails}
          width={100}
          alignment='center'
          calculateDisplayValue={cell => cell.plannedStart && cell.plannedStart.toLocaleDateString()}
        />
        <Column
          dataField="plannedEnd"
          caption="Planned End Date"
          visible={showDetails}
          width={100}
          alignment='center'
          calculateDisplayValue={cell => cell.plannedEnd && cell.plannedEnd.toLocaleDateString()}
        />

        <Column dataField="sheets" caption="Sheets" visible={showDetails} width={100} alignment='center' />
        <Column
          dataField="sheetsPerDay"
          caption="Sheets/Day"
          width={100}
          alignment='center'
          calculateCellValue={cell => {
            const days = toDays(cell.start, cell.end);
            return cell.sheets ? Math.ceil(cell.sheets / days) : 0;
          }}
        />
        <Column dataField="notes" caption="Notes" width={100} alignment='center' />

        {columns.map((col, i) => {
          return (
            <Column caption={col.month} alignment='center' key={i}>
              {col.innerColsX.map((innerCol, k) => (
                <Column
                  key={k}
                  dataField={innerCol.offset.toString()}
                  caption={cellSize >= 100 ? new Date(innerCol.date).getDate() : ""}
                  width={cellSize}
                  alignment='center'
                  dataType='number'
                  allowEditing={false}
                  headerFullDate={innerCol.date}
                />
              ))}
            </Column>
          );
        })}

      </DataGrid>

      <Grid container direction="row" style={{ marginTop: "10px" }}>
        <Grid item style={{ color: "white", backgroundColor: ACTUAL_DATE, padding: "10px" }}>Actual Dates</Grid>
        <Grid item style={{ color: "white", backgroundColor: PLANNED_DATE, padding: "10px" }}>Planned Dates</Grid>
        <Grid item style={{ color: "white", backgroundColor: PROGRESS_DATE, padding: "10px" }}>Progress</Grid>
        <Grid item style={{ color: "red", border: "solid black 1px", padding: "10px" }}>Progress Change</Grid>
      </Grid>

      <Box
        sx={{
          padding: "1rem",
          backgroundColor: "#f7f7f7",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          margin: "auto",
          marginTop: "2rem",
        }}
      >
        <Typography variant="h5" sx={{ marginBottom: "1rem" }}>
          What ChatGPT has to say about our progress:
        </Typography>
        <Typography sx={{ whiteSpace: "pre-line" }}>{aiMetrics}</Typography>
      </Box>
    </div>
  );
};

export default MyMetrics;
