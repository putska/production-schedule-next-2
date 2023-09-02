import React, { useState, useEffect, useRef } from "react";
import {
  convertDates,
  addDays,
  toWeeks,
  toDays,
  toMondayDate,
  isDateInRange,

  getEmployeeName,
  getJobName,
  getJobColor,

  getDataByCategory
} from "@/lib/helper-functions";
import Gantt, {
  Tasks, Resources, ResourceAssignments, Column, Editing, Toolbar, Item, Validation, Baselines
} from 'devextreme-react/gantt';
import SelectBox from 'devextreme-react/select-box';
import DateBox from "devextreme/ui/date_box";

import 'devexpress-gantt/dist/dx-gantt.min.css';


const Metrics = (props) => {
  const {
    jobs,
    tasks,
    settings,
    updateTasks,
    updateSettings,
  } = props;

  const ganttRef = useRef(null);

  const [jobData, setJobData] = useState([]);
  const [today, setToday] = useState(new Date());
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [resources, setResources] = useState([]);
  const [resourceAssignments, setResourceAssignments] = useState([]);
  const [viewMode, setViewMode] = useState("weeks");
  const [colsWidth, setColsWidth] = useState(500);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();

  useEffect(() => {
    // figure out which jobs to include on metrics
    const jobsToInclude = [...new Set(tasks.flatMap(task => {
      if (task.includeOnMetrics) {
        return task.jobNumber;
      }
    }))];

    const convertedJobs = convertDates(jobs);

    let counter = 1;
    const updatedJobs = convertedJobs
      .filter((job) => jobsToInclude.includes(job.jobNumber))
      .map((job, i) => {
        const { progress, progressChange, start, end } = calculateProgress(job);
        counter++;

        return ({
          id: counter,
          parentId: 0,
          jobName: job.jobName,
          title: job.jobName,
          task: job.jobName,
          jobNumber: job.jobNumber,
          start: start,
          end: end,
          plannedStart: addDays(start, -11),
          plannedEnd: addDays(end, 10),
          progress: progress,
          progressChange: progressChange
        });
      });

    // figure out resource assignments aka +Progress% tool
    const newResources = updatedJobs.map((job, i) => {
      return { id: i, text: `${job.progressChange > 0 ? "+" : ""}${job.progressChange}%` }
    });

    const newResourceAssignments = updatedJobs.map((job, i) => {
      return { id: i, taskId: job.id, resourceId: i }
    })

    setResources(newResources);
    setResourceAssignments(newResourceAssignments);

    setTimeout(() => {
      const currentDate = addDays(toMondayDate(today), -1);
      ganttRef.current.instance.scrollToDate(currentDate);
    }, 50)

    const first = updatedJobs[0];
    const last = updatedJobs[updatedJobs.length - 1];

    const newStart = new Date(first.start).getTime() < new Date(first.plannedStart).getTime()
      ? first.start
      : first.plannedStart

    const newEnd = new Date(last.end).getTime() >= new Date(last.plannedEnd).getTime()
      ? last.end
      : last.plannedEnd

    setJobData(convertedJobs);
    setStartDate(new Date(newStart));
    setEndDate(new Date(newEnd));
    setSelectedJobs(updatedJobs);
  }, [jobs])

  const calculateProgress = (job) => {
    let totalDuration = 0;
    let completedDuration = 0;
    let completedProgessDuration = 0;

    // filter shop drawings data so that it only holds tasks related to current job
    const filteredTasks = tasks.filter(task => task.jobNumber === job.jobNumber && task.includeOnMetrics);
    // Sort the tasks by the start date
    filteredTasks.sort((task1, task2) => new Date(task1.startDate).getTime() - new Date(task2.startDate).getTime());

    // go through each filtered task and add # days for task to completed duration
    filteredTasks.forEach(task => {
      let taskDuration = toDays(task.startDate, task.endDate);

      // add to totalDuration for each assigned task
      totalDuration += taskDuration;

      // add to completedDuration if completed
      if (task.status === "Completed") {
        completedDuration += taskDuration;
      }

      const prevWeekMon = addDays(toMondayDate(today), -7);

      // if a job task was completed in the previous week, 
      // meaning it's end date is in the previous week and it's status is completed, 
      // then add that number of days to completedProgressDuration
      if (isDateInRange(new Date(task.endDate), prevWeekMon, toMondayDate(today))) {
        completedProgessDuration += taskDuration;
      }
    })

    // Check if the start date is before the current date
    const progress = completedDuration >= 0 && totalDuration > 0
      ? Math.floor((completedDuration / totalDuration) * 100)
      : 0;

    const progressChange = Math.floor((completedProgessDuration / completedDuration) * 100);
    const start = filteredTasks[0].startDate;
    const end = filteredTasks[filteredTasks.length - 1].endDate;

    return { progress: progress, progressChange: progressChange, start: start, end: end };
  }

  const onScaleCellPrepared = (e) => {
    if (e.startDate.toLocaleDateString() === today.toLocaleDateString()) {
      e.scaleElement.style.backgroundColor = "#1976d2";
      e.scaleElement.style.color = "white";
    }
  }

  const isBefore = (date1, date2) => {
    return new Date(date1) < new Date(date2);
  }

  const TaskTemplate = (item) => {
    const taskData = selectedJobs.find((job) => job.id === item.taskData.id);

    const taskRange = toDays(taskData.start, taskData.end);
    const tickSize = item.taskSize.width / taskRange;

    console.log(taskData.plannedStart, taskData.start)
    const daysBetween = toDays(taskData.plannedStart, taskData.start);

    const baselineDelta = isBefore(taskData.plannedStart, taskData.start) ? daysBetween * -1 : daysBetween;
    const baselineRange = toDays(taskData.plannedEnd, taskData.plannedStart);
    console.log(baselineDelta)

    const baselineWidth = baselineRange * tickSize;
    const baselineLeft = baselineDelta * tickSize;

    const backgroundColor = item.taskSize.width > baselineWidth ? "#ffc400" : "#33ab9f";
    const progressColor = item.taskSize.width > baselineWidth ? "#ff9100" : "#00695f";
    const progressFontColor = item.taskSize.width > baselineWidth ? "black" : "white";

    return (
      <div>
        {/* {baselineWidth != item.taskSize.width && */}
        <div style={{ width: baselineWidth, left: baselineLeft, height: "5px", backgroundColor: "#1976d2", marginBottom: "1px" }} />
        {/* } */}

        <div className="task" style={{ width: item.taskSize.width, backgroundColor: `${backgroundColor}`, display: "flex", flexDirection: "row" }}>
          <div
            className='custom-task-progress'
            style={{ wordWrap: "true", width: `${item.taskData.progress}%`, color: `${progressFontColor}`, backgroundColor: `${progressColor}`, padding: "5px" }}>
            {taskData.jobName} | {item.taskData.progress}%
          </div>

          {item.taskResources.length > 0 && <div style={{
            // backgroundColor: "gray", 
            color: `black`,
            padding: "5px",
            position: "absolute",
            left: `${item.taskSize.width}px`,
            // borderRadius: "10px"
          }}>{`${item.taskResources[0].text}`}</div>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ margin: "3vw" }}>
      <Gantt
        ref={ganttRef}
        taskListWidth={colsWidth}
        scaleType={viewMode}
        taskContentRender={TaskTemplate}
        height={700}
        firstDayOfWeek={1}
        wordWrapEnabled
        onScaleCellPrepared={onScaleCellPrepared}
        startDateRange={startDate}
        endDateRange={endDate}
      >
        <Tasks dataSource={selectedJobs} />
        <Resources dataSource={resources} />
        <ResourceAssignments dataSource={resourceAssignments} />

        <Toolbar>
          <Item name="zoomIn" />
          <Item name="zoomOut" />
          <Item>
            <SelectBox
              items={["days", "weeks", "months", "years"]}
              value={viewMode}
              onValueChanged={(e) => setViewMode(e.value)}
            />
          </Item>
        </Toolbar>

        <Column
          dataField="jobName"
          caption="Job Name" width={300}
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
        <Column dataField="start" caption="Start Date" />
        <Column dataField="end" caption="End Date" />
      </Gantt>
    </div>

  )
};

export default Metrics;
