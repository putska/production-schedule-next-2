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
import { TagBox, ColorBox, SelectBox } from "devextreme-react";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';

import {
    Button as MaterialButton,
    Dialog,
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
    IconButton
} from "@mui/material";

import {
    getJobName,
    getJobColor,
    getEmployeeNamesFromIDs,
    addDays,
    getJob,
    toMondayDate,
    getHighlight
} from "@/lib/helper-functions";

// constants for styling
const COMPLETED = "green";
const IN_PROGRESS = "blue";
const PENDING = "red";

const TasksView = (props) => {
    const {
        jobs,

        employees,
        tasks,
        settings,

        handleUpdate,
        handleDelete,
        handleAdd,

        canEdit
    } = props;

    const dataGridRef = useRef(null);
    const [tasksData, setTasksData] = useState(tasks);
    const [jobIndex, setJobIndex] = useState(0);
    const [statusIndex, setStatusIndex] = useState(null);
    const [dialogVisible, setFormVisible] = useState(false);
    const [showValue, setShowValue] = useState(true);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const updatedTasksData = tasks.map(task => {
            const color = getJobColor(task.jobNumber, settings);
            const job = getJob(task.jobNumber, jobs);
            // const highlightJob = getHighlight(job.weeksToGoBackUpdated) || getHighlight(job.startUpdated);
            const highlightJob = true;

            return {
                ...task,
                highlightJob: highlightJob,
                color: color,
                shopStart: job.start,
                startDate: null,
                endDate: null,
                weeksAfterStartDate: task.JSON?.weeksAfterStartDate || null,
                weeksBeforeShopStart: task.JSON?.weeksBeforeShopStart || null,
            }
        });
        setTasksData(updatedTasksData);
    }, [jobs, employees, tasks, settings])

    const updateHandler = async (e, type) => {
        try {
            e.component.beginCustomLoading();
            const newData = {
                ...e.data,
                startDate: e.data.shopStart != null && e.data.weeksBeforeShopStart >= 0
                    ? toMondayDate(addDays(e.data.shopStart, e.data.weeksBeforeShopStart * -7))
                    : null,
                endDate: e.data.startDate != null && e.data.weeksAfterStartDate >= 0
                    ? toMondayDate(addDays(e.data.startDate, e.data.weeksAfterStartDate * 7))
                    : null,
                JSON: JSON.stringify({
                    weeksAfterStartDate: e.data.weeksAfterStartDate,
                    weeksBeforeShopStart: e.data.weeksBeforeShopStart,
                })
            }
            console.log(newData)
            await handleUpdate(newData, type);
            e.component.endCustomLoading();
        } catch (error) {
            console.error(error);
            e.component.endCustomLoading();
        }
    };

    const addHandler = async (e, type) => {
        try {
            e.component.beginCustomLoading();
            console.log(e.data)
            const newData = {
                ...e.data,
                startDate: e.data.shopStart != null && e.data.weeksBeforeShopStart >= 0
                    ? toMondayDate(addDays(e.data.shopStart, e.data.weeksBeforeShopStart * -7))
                    : null,
                endDate: e.data.startDate != null && e.data.weeksAfterStartDate >= 0
                    ? toMondayDate(addDays(e.data.startDate, e.data.weeksAfterStartDate * 7))
                    : null,
                JSON: JSON.stringify({
                    weeksAfterStartDate: e.data.weeksAfterStartDate,
                    weeksBeforeShopStart: e.data.weeksBeforeShopStart,
                })
            }
            console.log(newData)
            // await handleAdd(newData, type);
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

    const CustomStatusCell = (cellData) => {
        const status = cellData.value || "";
        let dotColor = COMPLETED;
        if (status === "Pending") {
            dotColor = PENDING;
        } else if (status === "In Progress") {
            dotColor = IN_PROGRESS;
        }

        return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
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
    };

    const EmployeeTagBox = (cellData) => {

        let defaultData = cellData.data.assignedPeople
            ? cellData.value.split(",").map(e => parseInt(e, 0))
            : [];

        if (defaultData.length > 0 && defaultData[0] !== "") {
            defaultData = defaultData.map(num => parseInt(num))
        } else {
            defaultData = [];
        }

        const onValueChanged = (el) => {
            cellData.setValue(el.value.join(","));
        }

        return (
            <TagBox
                dataSource={employees}
                valueExpr="ID"
                displayExpr="name"
                showSelectionControls={true}
                showMultiTagOnly={false}
                searchEnabled={true}
                defaultValue={defaultData}
                onValueChanged={onValueChanged}
            />
        )
    }

    const initNewTask = (row) => {
        row.data = {
            task: "",
            description: "",
            includeOnMetrics: false,
            status: "Pending",
            assignedPeople: "",
            linkToShopStart: false,
            weeksBeforeShopStart: 0,
            weeksAfterStartDate: 0,
            category: "fab-matrixs",
            created: new Date(),
        }
    }

    const initNewEmployeeName = (row) => {
        row.data = {
            name: "",
            workFromHome: false,
            vacation: false,
            category: "fab matrixs"
        }
    }

    const initNewSetting = (row) => {
        row.data = {
            jobNumber: "",
            color: "black",
            category: "fab matrixs"
        }
    }

    const addTaskHandler = () => {
        handleFormOpen({
            task: "",
            description: "",
            includeOnMetrics: false,
            status: "Pending",
            assignedPeople: "",
            linkToShopStart: false,
            weeksBeforeShopStart: 0,
            weeksAfterStartDate: 0,
            category: "fab-matrixs",
            created: new Date(),
        });
    }

    const handleFormOpen = (data) => {
        setFormData(data);
        setFormVisible(true);
    }

    const handleFormSave = () => {
        setFormVisible(false);
    }

    const handleFormClose = () => {
        setFormVisible(false);
    }

    const handleInputChange = (key, value) => {
        const newFormData = {
            ...formData,
            [key]: value,
        }
        setFormData(newFormData);
    }

    return (
        <div style={{ margin: "3vw" }}>

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
                                <DataGrid
                                    dataSource={employees}
                                    showBorders
                                    wordWrapEnabled
                                    onInitNewRow={initNewEmployeeName}
                                    onRowUpdated={(e) => updateHandler(e, "employeeNames")}
                                    onRowInserted={(e) => addHandler(e, "employeeNames")}
                                    onRowRemoved={(e) => deleteHandler(e, "employeeNames")}
                                >
                                    <SearchPanel visible={true} width={240} placeholder="Search..." />
                                    <Editing mode="cell" allowUpdating allowDeleting allowAdding useIcons />

                                    <Column dataField="name" caption="Employee Name" />
                                </DataGrid>
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
                                </DataGrid>
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            )}

            <DataGrid
                ref={dataGridRef}
                dataSource={tasksData}
                showBorders
                wordWrapEnabled
                onExporting={onExporting}
                onInitNewRow={initNewTask}
                onRowUpdated={(e) => updateHandler(e, "tasks")}
                onRowInserted={(e) => addHandler(e, "tasks")}
                onRowRemoved={(e) => deleteHandler(e, "tasks")}
            >
                <SearchPanel visible={true} width={240} placeholder="Search..." />
                <Scrolling mode="infinite" />
                <Export enabled={true} allowExportSelectedData={true} />
                {/* <Editing mode="popup" allowUpdating allowDeleting allowAdding useIcons>
                    <Popup title="Edit" showTitle={true} minWidth="20vw" height="auto" />
                    <Form>
                        <Item itemType="group" colCount={1} colSpan={2}>
                            <Item dataField="jobNumber" />
                            <Item dataField="task" />
                            <Item dataField="linkToShopStart" />
                            <Item dataField="description" editorType="dxTextArea" />
                            <Item dataField="assignedPeople" />
                            <Item dataField="status" editorType="dxSelectBox" editorOptions={{ items: ['Pending', 'In Progress', 'Completed'] }} />
                            <Item dataField="weeksBeforeShopStart" />
                            <Item dataField="weeksAfterStartDate" />
                        </Item>
                    </Form>
                </Editing> */}

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
                    <Item location="before">
                        <MaterialButton
                            variant="outlined"
                            onClick={e => {
                                if (jobIndex == 0) {
                                    setJobIndex(null);
                                    setStatusIndex(0);
                                } else {
                                    setJobIndex(0);
                                    setStatusIndex(null);
                                }
                            }}
                        >
                            {jobIndex === 0 ? "Sort By Status" : "Sort By Job"}
                        </MaterialButton>
                    </Item>
                    <Item location="after" name="addRowButton" />
                    <Item location="after" name="searchPanel" />
                </Toolbar>

                <Column
                    fixed
                    fixedPosition="left"
                    type="buttons"
                    cellRender={cell => {
                        return (cell.rowType == "data" &&
                            <div>

                                <IconButton color="primary" aria-label="edit" onClick={(e) => handleFormOpen(cell.data)}>
                                    <EditIcon />
                                </IconButton>

                                <IconButton color="red" aria-label="delete" onClick={(e) => deleteHandler(cell, "task")}>
                                    <DeleteIcon />
                                </IconButton>

                            </div>
                        )
                    }}>
                </Column>

                <Column
                    dataField="jobNumber"
                    caption="Job Name"
                    groupCellRender={(cell) => {
                        if (cell.value) {
                            const groupColor = getJobColor(cell.value, settings);
                            const jobName = getJobName(cell.value, jobs);

                            return (
                                <div style={{ color: `${groupColor}` }}>{`${jobName} | ${cell.value}`}</div>
                            )
                        }
                    }}
                    groupIndex={jobIndex}
                >
                    <Lookup
                        dataSource={jobs}
                        displayExpr="jobName"
                        valueExpr="jobNumber"
                    />
                </Column>
                <Column dataField="linkToShopStart" caption="Link to Shop Start" dataType="boolean" />
                <Column dataField="task" caption="Task" />
                <Column dataField="description" caption="Description" />
                <Column
                    dataField="assignedPeople"
                    caption="Assigned People"
                    calculateDisplayValue={cell => {
                        const assignedPeopleString = getEmployeeNamesFromIDs(cell.assignedPeople, employees).join(", ");
                        return assignedPeopleString;
                    }}
                    editCellRender={EmployeeTagBox}
                />
                <Column
                    dataField="status"
                    caption="Status"
                    cellRender={CustomStatusCell}
                    groupIndex={statusIndex}
                    groupCellRender={CustomStatusCell}
                />

                <Column
                    dataField="shopStart"
                    dataType="date"
                    allowEditing={false}
                />

                <Column
                    dataField="startDate"
                    caption="Start Date"
                    dataType="date"
                    cellRender={cell => {
                        const date = cell.data.shopStart != null && cell.data.weeksBeforeShopStart >= 0
                            ? toMondayDate(addDays(cell.data.shopStart, cell.data.weeksBeforeShopStart * -7))
                            : null;
                        cell.setValue(date);
                        return <div style={{ backgroundColor: `${cell.data.highlightJob ? "yellow" : null}` }}>{date}</div>
                    }}
                />
                <Column
                    dataField="endDate"
                    caption="End Date"
                    dataType="date"
                    allowEditing={false}
                    cellRender={cell => {
                        const date = cell.data.startDate != null && cell.data.weeksAfterStartDate >= 0
                            ? toMondayDate(addDays(cell.data.startDate, cell.data.weeksAfterStartDate * 7))
                            : null;
                        cell.setValue(date);
                        return <div style={{ backgroundColor: `${cell.data.highlightJob ? "yellow" : null}` }}>{date}</div>
                    }}
                />

                <Column visible={true} dataField="weeksBeforeShopStart" dataType="number" />
                <Column visible={true} dataField="weeksAfterStartDate" dataType="number" />

                <Column dataField="created" caption="Created Date" dataType="date" allowEditing={false} />
            </DataGrid>

            <Dialog open={dialogVisible} onClose={handleFormClose}>
                <DialogContent>
                    <Grid container spacing={2} direction="row">
                        <Grid item xs={100}>
                            <SelectBox
                                dataSource={jobs}
                                value={formData.jobNumber}
                                valueExpr="jobNumber"
                                displayExpr="jobName"
                                style={{ padding: "10px", fontSize: "18px" }}
                                onValueChanged={(e) => handleInputChange("jobNumber", e.value)}
                            />
                        </Grid>

                        <Grid item>
                            
                        </Grid>


                        </Grid>
                </DialogContent>
                <DialogActions>
                    <MaterialButton onClick={handleFormClose} color="primary">
                        Cancel
                    </MaterialButton>
                    <MaterialButton onClick={handleFormSave} color="primary">
                        Save
                    </MaterialButton>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default TasksView;
