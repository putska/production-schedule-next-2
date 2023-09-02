import React, { useState, useEffect, useRef } from "react";
import DataGrid, {
    Column,
    SearchPanel,
    Scrolling,
    MasterDetail,
    Export,
    Editing,
    Toolbar,
    Item
} from "devextreme-react/data-grid";
import DateBox from 'devextreme-react/date-box';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import Typography from "@mui/material/Typography";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    TextareaAutosize,
    Button as MaterialButton,
    Checkbox,
    Grid,
    FormControlLabel,
    FormGroup,
    Paper,
    IconButton
} from '@mui/material';
import {
    toMondayDate,
    createCalendarData,
    addDays,
    isDateInRange,

    getJobName,
    getJobColor,
    getTask
} from "@/lib/helper-functions";
import { RepeatOneRounded } from "@mui/icons-material";

const daysOfWeek = ["Mon", "Tues", "Wed", "Thurs", "Fri"];

const COMPLETED = "green";
const IN_PROGRESS = "blue";
const PENDING = "red";


const MiniView = ({ task, item, cellDate, jobs, tasks, showPopup, offset, showTaskDetails }) => {
    const taskData = getTask(task.taskID, tasks)
    taskData.jobName = getJobName(task.jobNumber, jobs);
    const dueDate = new Date(taskData.endDate);
    const dueToday = new Date(cellDate).getTime() === dueDate.getTime();

    let taskStatus = `Due ${dueDate.toLocaleDateString()}`
    if (task.status === "Completed") {
        taskStatus = "Completed"
    } else if (dueToday) {
        taskStatus = "Due today!"
    }

    let dotColor = COMPLETED;
    if (item.status === "Pending") {
        dotColor = PENDING;
    } else if (item.status === "In Progress") {
        dotColor = IN_PROGRESS;
    }

    return (
        <Paper
            square
            style={{
                padding: "10px",
                backgroundColor: `${task.vacation && "#ced4de"}`,
                borderTop: `solid ${item.color} 5px`,
                height: "200px",
                width: "100%",
                position: "absolute",
                top: `${offset * 200}px`, // Adjust the offset value based on your requirement
            }}
            onClick={() => showPopup(task, taskData)}>
            <Stack spacing={1}>
                <div>
                    <Typography variant="h6" style={{
                        color: `${item.color}`,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                    }}>
                        {showTaskDetails && `${taskData.jobName}  | ${item.jobNumber}`}
                    </Typography>

                    {showTaskDetails &&
                        <Typography variant="body1" style={{
                            fontWeight: "bolder",
                            display: 'flex',
                            alignItems: 'center',
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                        }}>
                            <div
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: dotColor,
                                    borderRadius: '50%',
                                    marginRight: '5px',
                                }}
                            ></div>
                            {taskData.task} - {taskStatus}
                        </Typography>}

                </div>


                {task.notes !== "" &&
                    <Typography variant="caption"
                        style={{
                            whiteSpace: "nowrap",
                            wordBreak: "break-word",
                            maxHeight: "3vh", // Set a maximum height for the notes section
                            overflow: "hidden", // Add overflow: hidden
                            textOverflow: "ellipsis", // Add text-overflow: ellipsis
                        }}
                    >{task.notes}</Typography>
                }

                {task.problems !== "" &&
                    <Typography variant="caption"
                        style={{
                            color: "red",
                            whiteSpace: "nowrap",
                            wordBreak: "break-word",
                            maxHeight: "3vh", // Set a maximum height for the notes section
                            overflow: "hidden", // Add overflow: hidden
                            textOverflow: "ellipsis", // Add text-overflow: ellipsis
                        }}
                    >{task.problems}</Typography>
                }

                {task.workFromHome &&
                    <Typography variant="span">
                        <HomeWorkIcon style={{ fontSize: "20px" }} />
                    </Typography>
                }
            </Stack>
        </Paper>
    )
}

const DailyView = (props) => {
    const {
        jobs,
        employees,
        employeeNotes,
        tasks,
        settings,

        selectedMonday,
        week,
        updateWeek,

        canEdit,
        handleUpdate,
        handleDelete,
        handleAdd,
    } = props;

    const [calendarData, setCalendarData] = useState({});
    const [formVisible, setFormVisible] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const newCalendarData = createCalendarData(employees, tasks, employeeNotes);
        setCalendarData(newCalendarData);
    }, [employees, tasks, employeeNotes]);

    const getTaskOffset = (weekTasks, taskID) => {
        const index = weekTasks.indexOf(taskID);
        return index != -1 ? index : 0;
    };

    const getWeekTasksForEmployee = (employeeName) => {

        const workingJobs = calendarData[employeeName]
            ? calendarData[employeeName]
                .filter(taskNote => isDateInRange(taskNote.date, week[0], week[week.length - 1]))
                .map(taskNote => taskNote.taskID) // Extract the taskID instead of the jobNumber
            : [];

        const uniqueTaskIDs = [...new Set(workingJobs)]; // Remove duplicates using Set
        return uniqueTaskIDs;
    }

    const showPopup = (task, taskData) => {
        setFormData({
            ...task,
            task: taskData.task,
            jobName: taskData.jobName,
            startDate: taskData.startDate,
            endDate: taskData.endDate,
        })
        setFormVisible(true);
    }

    const hidePopup = () => {
        setFormVisible(false)
    }

    const savePopupForm = async () => {
        // if the formData has an ID property, update. Otherwise, add new note to database
        if (formData.ID != null) {
            await handleUpdate(formData, "employeeNotes");
        } else {
            await handleAdd(formData, "employeeNotes");
        }
        setFormVisible(false);
    }

    const deleteTask = async (row) => {
        await handleDelete(row.data, "employeeNotes")
        setFormVisible(false);
    }

    const handleInputChange = (key, value) => {
        const newFormData = {
            ...formData,
            [key]: value
        }
        setFormData(newFormData);
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
        if (cell.rowType === "data" && cell.column.dataField !== "name" && cell.column.dataField !== "button") {
            cell.cellElement.style.padding = 0;
        }
    }

    const renderTaskCell = (cellData) => {

        const employeeName = cellData.data.name;
        const cellDate = cellData.column.dataField;

        const filteredTasks = employeeName in calendarData
            ? calendarData[employeeName].filter(day => day.date.toLocaleDateString() === cellDate)
            : []

        const tasksIntoJobs = filteredTasks.reduce((result, item) => {
            const foundItem = result.find(obj => obj.jobNumber === item.jobNumber);
            if (foundItem) {
                foundItem.tasks.push(item);
            } else {
                result.push({ jobNumber: item.jobNumber, tasks: [item], color: getJobColor(item.jobNumber, settings) });
            }
            return result;
        }, []);

        tasksIntoJobs.sort((a, b) => {
            const jobNameA = getJobName(a.jobNumber, jobs);
            const jobNameB = getJobName(b.jobNumber, jobs);
            return jobNameA.localeCompare(jobNameB);
        });

        const weekTasks = getWeekTasksForEmployee(employeeName);

        return (
            <div style={{ position: "relative", height: `${weekTasks.length * 200}px` }}>
                {tasksIntoJobs.map((item, i) => {
                    return (
                        <div key={i}>
                            {item.tasks.map((task, j) => {
                                const taskOffset = getTaskOffset(weekTasks, task.taskID);

                                return (
                                    <MiniView
                                        key={j}
                                        task={task}
                                        item={item}
                                        cellDate={cellDate}
                                        jobs={jobs}
                                        tasks={tasks}
                                        showPopup={showPopup}
                                        offset={taskOffset}
                                        showTaskDetails={task.firstTask}
                                    />
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div style={{ margin: "3vw" }}>

            <Grid container spacing={1} direction="row" alignItems="center" style={{ height: "100px" }}>
                <Grid item>
                    <IconButton
                        onClick={(e) => {
                            const newDate = addDays(selectedMonday, -7)
                            updateWeek(newDate)
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                </Grid>
                <Grid item>
                    <DateBox
                        label="Selected Monday Date"
                        style={{ width: "250px", padding: "10px" }}
                        type="date"
                        value={selectedMonday}
                        onValueChanged={(e) => updateWeek(toMondayDate(e.value))}
                    />
                </Grid>
                <Grid item>
                    <IconButton
                        onClick={(e) => {
                            const newDate = addDays(selectedMonday, 7)
                            updateWeek(newDate)
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>
                </Grid>
            </Grid>

            <DataGrid
                dataSource={employees}
                showBorders
                showRowLines
                showColumnLines={true}
                allowColumnResizing
                columnAutoWidth
                repaintChangesOnly
                wordWrapEnabled
                columnResizingMode='widget'
                onExporting={onExporting}
                onCellPrepared={onCellPrepared}
            >
                <Editing
                    mode="cell"
                    useIcons
                    allowUpdating
                />
                <Scrolling mode="infinite" />
                <SearchPanel visible highlightCaseSensitive={false} />
                <Export enabled={true} allowExportSelectedData={true} />

                <Column
                    dataField='name'
                    alignment='left'
                    width={100}
                />

                {week.map((date, i) => (
                    <Column
                        key={i}
                        width="20%"
                        dataField={date}
                        caption={`${daysOfWeek[i]} ${date} `}
                        allowEditing={false}
                        cellRender={renderTaskCell}
                    />
                ))}
            </DataGrid>

            <Dialog open={formVisible} onClose={hidePopup} scroll="paper" fullWidth >
                <DialogTitle>{formData.jobName}</DialogTitle>
                <DialogContent style={{ height: '50vh' }}>
                    <Stack spacing={2} direction="column" style={{ margin: "20px" }}>
                        <DialogContentText>{formData.task}</DialogContentText>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.vacation}
                                    onChange={(e) => handleInputChange("vacation", e.target.checked)}
                                    name="vacation"
                                />
                            }
                            label="Vacation"
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    defaultChecked={formData.workFromHome}
                                    onChange={(e) => handleInputChange("workFromHome", e.target.checked)}
                                    name="workFromHome"
                                />
                            }
                            label="Working from Home"
                        />

                        <FormControl fullWidth>
                            <InputLabel id="status-label">Status</InputLabel>
                            <Select
                                labelId="status-label"
                                id="status"
                                defaultValue={formData.status}
                                onChange={(e) => handleInputChange("status", e.target.value)}
                                label="Job Name"
                            >
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="In Progress">In Progress</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <Stack direction="row" spacing={1}>
                                <DateBox defaultValue={formData.startDate}
                                    label="start"
                                    style={{ width: "50%" }}
                                    onValueChanged={(e) => handleInputChange("startDate", e.value)}
                                    type="date" />

                                <DateBox defaultValue={formData.endDate}
                                    label="end"
                                    style={{ width: "50%" }}
                                    onValueChanged={(e) => handleInputChange("endDate", e.value)}
                                    type="date" />
                            </Stack>
                        </FormControl>

                        <InputLabel id="notes">Notes</InputLabel>
                        <TextareaAutosize
                            id="notes"
                            label="Notes"
                            minRows={5}
                            placeholder="Enter notes"
                            defaultValue={formData.notes}
                            onChange={(e) => handleInputChange("notes", e.target.value)}
                            style={{ width: '100%', padding: "10px" }}
                        />

                        <InputLabel id="problems">Problems</InputLabel>
                        <TextareaAutosize
                            id="problems"
                            label="Problems"
                            minRows={3}
                            placeholder="Enter problems"
                            defaultValue={formData.problems}
                            onChange={(e) => handleInputChange("problems", e.target.value)}
                            style={{ width: '100%', padding: "10px" }}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions>
                    <MaterialButton onClick={savePopupForm} variant="outlined" >Save</MaterialButton>
                    <MaterialButton onClick={hidePopup}>Cancel</MaterialButton>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default DailyView;
