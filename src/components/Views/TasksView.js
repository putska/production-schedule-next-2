import React, { useState, useEffect, useRef } from "react";
import DataGrid, {
    Column,
    SearchPanel,
    Editing,
    Lookup,
    Scrolling,
    Export,
    Popup,
    Form,
    Item,
    Toolbar,
    AsyncRule
} from "devextreme-react/data-grid";

import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { TagBox, ColorBox, SelectBox, DateBox } from "devextreme-react";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';

import {
    Button as MaterialButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Accordion, AccordionSummary, AccordionDetails,
    Grid,
    IconButton,
    FormLabel,
    Checkbox,
    ListItemText,
    OutlinedInput,
    FormControlLabel,
    Paper,
    Box,
    ButtonGroup,
    Menu,
} from "@mui/material";

import {
    getJobName,
    getJobColor,
    addDays,
    getJob,
    getEmployeeNamesFromIDs,
    toMondayDate,
    getHighlight,
    getEmployeeName
} from "@/lib/helper-functions";


const MiniAccordion = ({ job, task, color, employees }) => {
    const [expandedId, setExpandedId] = useState(null);
    const assignedPeopleString = Array.isArray(task.assignedPeople)
        ? getEmployeeNamesFromIDs(task.assignedPeople, employees)
        : ""

    const handleAccordionChange = (id) => {
        if (id === expandedId) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
        }
    };

    return (
        <Accordion
            expanded={expandedId === task.ID}
            onChange={() => handleAccordionChange(task.ID)}
            sx={{ border: `solid ${color} 2px`, boxShadow: `2px 2px 5px gray` }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel-${task.ID}-content`}
                id={`panel-${task.ID}-header`}
            >
                <Grid container direction="column" spacing={1} alignItems="flex-start">
                    <Grid item sx={{ fontWeight: "bold" }}>{job.jobName}</Grid>
                    <Grid item sx={{ fontWeight: 500 }}>{task.task}</Grid>
                </Grid>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container direction="column" spacing={1} alignItems="flex-start">
                    <Grid item sx={{ marginBottom: "20px" }}>
                        <Typography
                            variant="span"
                        >{task.description}</Typography>
                    </Grid>
                    <Grid item>
                        <Typography
                            variant="span"
                        >Assigned: {assignedPeopleString}</Typography>
                    </Grid>
                    <Grid item>
                        <Typography
                            variant="span"
                        >Start Date: {new Date(task.startDate).toLocaleDateString()}</Typography>
                    </Grid>
                    <Grid item>
                        <Typography
                            variant="span"
                        >End Date: {new Date(task.endDate).toLocaleDateString()}</Typography>
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
};

const TasksView = (props) => {
    const {
        categoryKey,
        jobs,

        employees,
        tasks,
        settings,

        customColumns,
        linkToShopStart,
        statusOptions,
        buttonOptions,
        showPCs,

        handleUpdate,
        handleDelete,
        handleAdd,

        canEdit
    } = props;

    const dataGridRefJobs = useRef(null);
    const dataGridRefStatus = useRef(null);
    const [sortByJob, setSortByJob] = useState(true);
    const [dialogVisible, setFormVisible] = useState(false);
    const [formData, setFormData] = useState({});
    const [showArchived, setShowArchived] = useState(true);
    const [filteredTasks, setFilteredTasks] = useState(tasks);
    const [PCs, setPCs] = useState([]);
    const [team, setTeam] = useState([]);
    const [selectedOption, setSelectedOption] = useState('Option 1');
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        if (!showArchived) {
            setFilteredTasks(tasks.filter(task => task.status !== "Archived"));
        } else {
            setFilteredTasks(tasks);
        }
    }, [showArchived, tasks])

    useEffect(() => {
        setPCs(employees.filter(employee => employee.category === "project-coordinator"));
        setTeam(employees.filter(employee => employee.category === categoryKey));
    }, [employees])

    const initNewEmployeeName = (row) => {
        row.data = {
            name: "",
            workFromHome: false,
            vacation: false,
            category: categoryKey
        }
    }

    const initNewSetting = (row) => {
        row.data = {
            jobNumber: "",
            color: "black",
            category: categoryKey
        }
    }

    const addTaskHandler = () => {
        handleFormOpen({
            task: "",
            description: "",
            includeOnMetrics: false,
            status: statusOptions[0].status,
            assignedPeople: [],
            linkToShopStart: false,
            weeksBeforeShopStart: 0,
            weeksAfterStartDate: 0,
            category: categoryKey,
            created: new Date(),
            startDate: new Date(),
            endDate: new Date()
        });
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
    }

    const addHandler = async (e, type) => {
        try {
            e.component.beginCustomLoading();
            await handleAdd(e.data, type);
            e.component.endCustomLoading();
        } catch (error) {
            console.error(error);
            e.component.endCustomLoading();
        }
    }

    const deleteHandler = async (e, type) => {
        try {
            e.component.beginCustomLoading();
            await handleDelete(e.data, type);
            e.component.endCustomLoading();
        } catch (error) {
            console.error(error);
            e.component.endCustomLoading();
        }
    }

    const cellPrepared = (cell) => {
        if (!sortByJob) {
            if (cell.rowType === "header") {
                cell.cellElement.style.color = cell.column.color;
                cell.cellElement.style.fontWeight = "bold";
                cell.cellElement.style.borderBottom = `solid ${cell.column.color} 5px`;
            }
            if (cell.rowType === "data" && cell.data.highlightJob && cell.column.dataField === "jobNumber") {
                cell.cellElement.style.backgroundColor = "yellow";
            }
        }
    }

    const onExporting = (e) => {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Main sheet');

        exportDataGrid({
            component: e.component,
            worksheet,
            autoFilterEnabled: true,
        }).then(() => {
            workbook.xlsx.writeBuffer().then((buffer) => {
                saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'ShopDrawingAssignments.xlsx');
            });
        });
        e.cancel = true;
    }

    // FORM METHODS
    const handleFormOpen = (data) => {
        setFormData(data);
        setFormVisible(true);
        setSelectedOption(buttonOptions.length > 0 ? buttonOptions[0] : null)
    }

    const handleFormSave = async () => {
        const newFormData = {
            ...formData,
            assignedPeople: JSON.stringify(formData.assignedPeople),
        }

        if (linkToShopStart) {
            newFormData.JSON = JSON.stringify({
                weeksBeforeShopStart: formData.weeksBeforeShopStart,
                weeksAfterStartDate: formData.weeksAfterStartDate
            })
        }

        if (formData.ID) {
            await handleUpdate(newFormData, "tasks");
        } else {
            await handleAdd(newFormData, "tasks");
        }

        setFormVisible(false);
    }

    const handleFormClose = () => {
        setFormVisible(false);
    }

    const handleChange = (key, value) => {
        const newFormData = {
            ...formData,
            [key]: value,
        }

        if (linkToShopStart && newFormData.jobNumber) {
            newFormData.shopStart = getJob(newFormData.jobNumber, jobs).start;
        }

        if (linkToShopStart && newFormData.shopStart && newFormData.weeksBeforeShopStart) {
            const dayChange = parseInt(newFormData.weeksBeforeShopStart) * -7;
            newFormData.startDate = toMondayDate(addDays(newFormData.shopStart, dayChange));
        }

        if (linkToShopStart && newFormData.startDate && newFormData.weeksAfterStartDate) {
            const dayChange = parseInt(newFormData.weeksAfterStartDate) * 7;
            newFormData.endDate = toMondayDate(addDays(newFormData.startDate, dayChange));
        }

        setFormData(newFormData);
    }

    const handleButtonClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleSendButtonClick = async (event) => {
        if (selectedOption) {
            const newFormData = {
                ...formData,
                category: selectedOption.value,
                assignedPeople: JSON.stringify([]),
                status: statusOptions.length > 0 ? statusOptions[0].status : ""
            }

            if (linkToShopStart) {
                newFormData.JSON = JSON.stringify({
                    weeksBeforeShopStart: formData.weeksBeforeShopStart,
                    weeksAfterStartDate: formData.weeksAfterStartDate
                })
            }

            if (formData.ID) {
                await handleUpdate(newFormData, "tasks");
            } else {
                await handleAdd(newFormData, "tasks");
            }
            setFormVisible(false);
        }
    };

    const handleMenuItemClick = (option) => {
        setSelectedOption(option);
        setAnchorEl(null);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // CUSTOM RENDERS
    const CustomStatusCell = (cellData) => {
        const status = cellData.value ? cellData.value : statusOptions[0].status;
        let dotColor = statusOptions.find(option => option.status === status);
        dotColor = dotColor ? dotColor.color : statusOptions[0].color;

        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: `${sortByJob ? "center" : "left"}` }}>
                <div
                    style={{
                        width: '10px',
                        height: '10px',
                        backgroundColor: dotColor,
                        borderRadius: '50%',
                        marginRight: '5px',
                    }}
                ></div>
                <span>{status}</span>
            </div>
        );
    }

    const EmployeeTagBox = ({ assignedPeople }) => {

        const onValueChanged = (e) => {
            handleChange("assignedPeople", e.target.value);
        }

        const renderValue = (selected) => {
            return getEmployeeNamesFromIDs(selected, team);
        }

        return (
            <FormControl fullWidth>
                <InputLabel id="demo-multiple-checkbox-label">Assigned People</InputLabel>
                <Select
                    labelId="demo-multiple-checkbox-label"
                    id="demo-multiple-checkbox"
                    label="Assigned People"
                    multiple
                    value={assignedPeople}
                    onChange={onValueChanged}
                    renderValue={renderValue}
                >
                    {employees.map((emp) => (
                        <MenuItem key={emp.name} value={emp.ID}>
                            <Checkbox checked={assignedPeople.indexOf(emp.ID) > -1} />
                            <ListItemText primary={emp.name} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

        )
    }

    const StatusCellRender = (cell) => {
        const status = cell.column.dataField;
        const color = statusOptions.find(option => option.status === status);
        const foundTasks = filteredTasks.filter(task => task.status === status);

        return (
            <Grid container spacing={1} direction="column" justifyContent="flex-start">
                {foundTasks.map(task => {
                    const job = getJob(task.jobNumber, jobs);

                    return (
                        <Grid item key={task.ID}>
                            <MiniAccordion
                                job={job}
                                task={task}
                                color={color ? color.color : "white"}
                                employees={employees}
                            />
                        </Grid>
                    )
                })}
            </Grid>
        )
    }

    return (
        <div>
            {canEdit && (
                <Accordion style={{ marginBottom: "20px" }}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls='panel1a-content'
                        id='panel1a-header'
                    >
                        <Typography>Adjust Settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={1} style={{ display: "flex", flexDirection: "row" }}>
                            <Grid item>
                                <Grid item>
                                    <DataGrid
                                        dataSource={employees}
                                        showBorders
                                        wordWrapEnabled
                                        onInitNewRow={initNewEmployeeName}
                                        onRowUpdated={(e) => updateHandler(e, "employeeNames")}
                                        onRowInserted={(e) => addHandler(e, "employeeNames")}
                                        onRowRemoved={(e) => deleteHandler(e, "employeeNames")}
                                    >
                                        <Editing mode="popup" allowUpdating allowDeleting allowAdding useIcons>
                                            <Popup width={600} height={200} />
                                        </Editing>

                                        <Column type="buttons" fixed={true} fixedPosition="left" />

                                        <Column
                                            dataField="category"
                                            caption="Category"
                                            groupIndex={0}
                                            groupCellRender={cell => {
                                                return cell.value === categoryKey ? "Team Employees" : "Project Coordinators";
                                            }}
                                        >
                                            <Lookup
                                                dataSource={[
                                                    { value: categoryKey, name: "Team" },
                                                    { value: "project-coordinator", name: "Project Coordinator" },
                                                ]}
                                                valueExpr="value"
                                                displayExpr="name"
                                            />
                                        </Column>
                                        <Column
                                            dataField="name"
                                            caption="Employee Name"
                                        />
                                    </DataGrid>
                                </Grid>
                            </Grid>
                            <Grid item>
                                <DataGrid
                                    dataSource={settings}
                                    showRowLines
                                    showBorders
                                    allowColumnResizing
                                    columnAutoWidth
                                    highlightChanges
                                    repaintChangesOnly
                                    columnResizingMode='widget'
                                    wordWrapEnabled
                                    autoExpandAll
                                    cellHintEnabled
                                    onInitNewRow={initNewSetting}
                                    onRowUpdated={(e) => updateHandler(e, "settings")}
                                    onRowInserted={(e) => addHandler(e, "settings")}
                                    onRowRemoved={(e) => deleteHandler(e, "settings")}
                                >
                                    <SearchPanel visible={true} width={240} placeholder="Search..." />
                                    <Editing
                                        mode='cell'
                                        allowUpdating={canEdit}
                                        allowAdding={canEdit}
                                        allowDeleting={canEdit}
                                        useIcons
                                    />

                                    <Column type="buttons" fixed={true} fixedPosition="left" />

                                    <Column
                                        dataField='jobNumber'
                                        caption='Job Name'
                                        calculateDisplayValue={cell => `${getJobName(cell.jobNumber, jobs)} | ${cell.jobNumber}`}
                                    >
                                        <Lookup
                                            dataSource={jobs}
                                            displayExpr="jobName"
                                            valueExpr="jobNumber"
                                        />
                                    </Column>
                                    <Column
                                        dataField='color'
                                        caption='Job Color'
                                        cellRender={(cell) => {
                                            return (
                                                <ColorBox
                                                    applyValueMode='instantly'
                                                    value={cell.data.color}
                                                    readOnly={true}
                                                />
                                            );
                                        }}
                                        editCellRender={(cell) => {
                                            return (
                                                <ColorBox
                                                    defaultValue={cell.data.color}
                                                    onValueChanged={(color) => {
                                                        cell.setValue(color.value);
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                    {showPCs &&
                                        <Column
                                            dataField="pc"
                                            caption="PC"
                                            alignment="center"
                                        >
                                            <Lookup dataSource={PCs} valueExpr="ID" displayExpr="name" />
                                        </Column>
                                    }
                                </DataGrid>
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            )}

            {(sortByJob && !dialogVisible) && (<DataGrid
                ref={dataGridRefJobs}
                dataSource={filteredTasks}
                showBorders
                wordWrapEnabled
                onExporting={onExporting}
                onCellPrepared={cellPrepared}
            >
                <SearchPanel visible={true} width={240} placeholder="Search..." />
                <Scrolling mode="infinite" />
                <Export enabled={true} allowExportSelectedData={true} />

                <Toolbar>
                    <Item location="before">
                        <IconButton
                            color="primary"
                            variant="outlined"
                            onClick={addTaskHandler}
                        >
                            <AddIcon />
                            <Typography>Add Task</Typography>
                        </IconButton>
                    </Item>
                    <Item location="after" name="searchPanel" />
                    <Item location="after">
                        <MaterialButton
                            variant="outlined"
                            onClick={e => setShowArchived(!showArchived)}
                        >
                            {showArchived ? "Hide Archived" : "Show Archived"}
                        </MaterialButton>
                    </Item>
                    <Item location="after">
                        <MaterialButton
                            variant="outlined"
                            onClick={e => setSortByJob(false)}
                        >Sort By Status</MaterialButton>
                    </Item>
                </Toolbar>

                <Column
                    fixedPosition="left"
                    alignment="center"
                    type="buttons"
                    cellRender={cell => {
                        return (cell.rowType == "data" &&
                            <Grid container direction="row">
                                <Grid item>
                                    <IconButton color="primary" aria-label="edit" onClick={(e) => handleFormOpen(cell.data)}>
                                        <EditIcon style={{ fontSize: "18px" }} />
                                    </IconButton>
                                </Grid>

                                <Grid item>
                                    <IconButton color="red" aria-label="delete" onClick={(e) => deleteHandler(cell, "tasks")}>
                                        <DeleteIcon style={{ fontSize: "18px" }} />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        )
                    }}>
                </Column>

                <Column
                    dataField="jobNumber"
                    caption="Job Name"
                    alignment="center"
                    groupCellRender={(cell) => {
                        if (cell.value) {
                            const groupColor = getJobColor(cell.value, settings);
                            const jobName = getJobName(cell.value, jobs);

                            return (
                                <div style={{ color: `${groupColor}` }}>{`${jobName} | ${cell.value}`}</div>
                            )
                        }
                    }}
                    groupIndex={0}
                >
                    <Lookup
                        dataSource={jobs}
                        displayExpr="jobName"
                        valueExpr="jobNumber"
                    />
                </Column>
                <Column dataField="task" caption="Task" alignment="center" />
                <Column dataField="description" caption="Description" alignment="center" />
                <Column
                    dataField="assignedPeople"
                    caption="Assigned People"
                    alignment="center"
                    calculateDisplayValue={cell => {
                        const assignedPeopleString = Array.isArray(cell.assignedPeople)
                            ? getEmployeeNamesFromIDs(cell.assignedPeople, team)
                            : ""
                        return assignedPeopleString;
                    }}
                />
                <Column
                    dataField="status"
                    caption="Status"
                    alignment="center"
                    cellRender={CustomStatusCell}
                />

                <Column
                    dataField="startDate"
                    caption="Start Date"
                    dataType="date"
                    alignment="center"
                />
                <Column
                    dataField="endDate"
                    caption="End Date"
                    dataType="date"
                    alignment="center"
                    allowEditing={false}
                />

                <Column
                    dataField="created"
                    caption="Created Date"
                    dataType="date"
                    alignment="center"
                    allowEditing={false}
                />

                {customColumns &&
                    customColumns.map(col => {
                        return (
                            <Column
                                key={col.dataField}
                                {...col}
                            />
                        )
                    })
                }

            </DataGrid>)}

            {(!sortByJob && !dialogVisible) && (<DataGrid
                ref={dataGridRefStatus}
                dataSource={[{}]}
                showBorders
                wordWrapEnabled
                showColumnLines={false}
                onExporting={onExporting}
                onCellPrepared={cellPrepared}
            >
                <Scrolling mode="infinite" />
                <Export enabled={true} allowExportSelectedData={true} />

                <Toolbar>
                    <Item location="after">
                        <MaterialButton
                            variant="outlined"
                            onClick={e => setShowArchived(!showArchived)}
                        >
                            {showArchived ? "Hide Archived" : "Show Archived"}
                        </MaterialButton>
                    </Item>
                    <Item location="after">
                        <MaterialButton
                            variant="outlined"
                            onClick={e => setSortByJob(true)}
                        >
                            Sort By Job
                        </MaterialButton>
                    </Item>
                </Toolbar>

                {statusOptions.filter(option => !showArchived ? option.status !== "Archived" : true).map((option, i) => {
                    return (
                        <Column
                            key={i}
                            dataField={option.status}
                            alignment="center"
                            cellRender={StatusCellRender}
                            {...option}
                        />
                    )
                })}

            </DataGrid>)
            }

            <Dialog open={dialogVisible} onClose={handleFormClose} fullWidth>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} direction="column" style={{ marginTop: "20px" }}>
                        <Grid item>
                            <FormControl fullWidth>
                                <InputLabel id="job name">Job Name</InputLabel>
                                <Select
                                    labelId="job name"
                                    id="jobname-select"
                                    value={formData.jobNumber}
                                    label="Job Name"
                                    onChange={(e) => handleChange("jobNumber", e.target.value)}
                                >
                                    {jobs.map(job => (
                                        <MenuItem key={job.jobNumber} value={job.jobNumber}>{job.jobName}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                        </Grid>
                        <Grid item>
                            <TextField
                                fullWidth
                                label="Task"
                                name="task"
                                value={formData.task}
                                onChange={(e) => handleChange("task", e.target.value)}
                            />
                        </Grid>
                        <Grid item>
                            <TextField
                                fullWidth
                                label="Description"
                                name="desciption"
                                value={formData.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                            />
                        </Grid>
                        <Grid item>
                            <EmployeeTagBox assignedPeople={formData.assignedPeople} />
                        </Grid>
                        <Grid item>
                            <FormControl fullWidth>
                                <InputLabel id="status">Status</InputLabel>
                                <Select
                                    labelId="status"
                                    id="status-select"
                                    value={formData.status}
                                    label="Status"
                                    onChange={(e) => handleChange("status", e.target.value)}
                                >
                                    {statusOptions.map(option => (
                                        <MenuItem key={option.status} value={option.status} sx={{ color: `${option.color}` }}>
                                            {option.status}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {linkToShopStart &&
                            <Grid item>
                                <DateBox
                                    value={formData.shopStart}
                                    label="Shop Start Date"
                                    style={{ padding: "12px", margin: "0" }}
                                    type="date"
                                    readOnly
                                />
                            </Grid>
                        }

                        {linkToShopStart &&
                            <Grid item>
                                <TextField
                                    fullWidth
                                    label="Weeks Before Shop Start"
                                    name="weeksBeforeShopStart"
                                    type="number"
                                    min={0}
                                    value={formData.weeksBeforeShopStart}
                                    onChange={(e) => handleChange("weeksBeforeShopStart", e.target.value)}
                                />
                            </Grid>
                        }

                        {linkToShopStart &&
                            <Grid item>
                                <TextField
                                    fullWidth
                                    label="Weeks After Start Date"
                                    name="weeksAfterStartDate"
                                    type="number"
                                    min={0}
                                    value={formData.weeksAfterStartDate}
                                    onChange={(e) => handleChange("weeksAfterStartDate", e.target.value)}
                                />
                            </Grid>
                        }

                        <Grid item>
                            <DateBox
                                value={formData.startDate}
                                label="Start Date"
                                style={{ padding: "12px", margin: "0" }}
                                type="date"
                                max={formData.endDate}
                                onValueChanged={(e) => !linkToShopStart && handleChange("startDate", e.value)}
                                readOnly={linkToShopStart}
                            />
                        </Grid>
                        <Grid item>
                            <DateBox
                                value={formData.endDate}
                                label="End Date"
                                style={{ padding: "12px", margin: "0" }}
                                type="date"
                                min={formData.startDate}
                                onValueChanged={(e) => !linkToShopStart && handleChange("endDate", e.value)}
                                readOnly={linkToShopStart}
                            />
                        </Grid>
                        {customColumns &&
                            customColumns.map((col) => (
                                <Grid item xs={12} md={6} key={col.dataField}>
                                    {col.dataType === "boolean" &&
                                        <FormControlLabel
                                            control={<Checkbox
                                                checked={formData[col.dataField]}
                                                onChange={(e) => handleChange(col.dataField, e.target.checked)}
                                            />}
                                            label={col.caption}
                                        />
                                    }
                                    {col.dataType === "date" &&
                                        <DateBox
                                            value={formData[col.dataField]}
                                            label={col.caption}
                                            style={{ padding: "12px", margin: "0" }}
                                            type="date"
                                            onValueChanged={(e) => handleChange(col.dataField, e.value)}
                                            readOnly={col.allowEditing}
                                        />
                                    }
                                    {col.dataType === "text" || col.dataType === "number" &&
                                        <TextField
                                            fullWidth
                                            label={col.caption}
                                            name={col.dataField}
                                            type={col.dataType === "text" ? "number" : "text"}
                                            value={formData[col.dataField]}
                                            onChange={(e) => handleChange(col.dataField, e.target.value)}
                                        />
                                    }
                                </Grid>
                            ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Grid container direction="row" spacing={1} justifyContent="space-between">
                        <Grid item>
                            <ButtonGroup variant="outlined" aria-label="split button">
                                <MaterialButton onClick={handleSendButtonClick}>Send to {selectedOption.name}</MaterialButton>
                                <MaterialButton
                                    size="small"
                                    aria-controls={anchorEl ? 'split-button-menu' : undefined}
                                    aria-expanded={anchorEl ? 'true' : undefined}
                                    aria-label="select merge strategy"
                                    aria-haspopup="menu"
                                    onClick={handleButtonClick}
                                >
                                    <ExpandMoreIcon />
                                </MaterialButton>
                            </ButtonGroup>
                            <Menu
                                id="split-button-menu"
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                {buttonOptions.map(option => {
                                    return <MenuItem key={option.value} onClick={() => handleMenuItemClick(option)}>Sent to {option.name}</MenuItem>
                                })}
                            </Menu>
                        </Grid>
                        <Grid item>
                            <IconButton onClick={handleFormClose} color="primary">
                                <CancelIcon />
                            </IconButton>
                            <IconButton onClick={handleFormSave} color="primary">
                                <SaveIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default TasksView;