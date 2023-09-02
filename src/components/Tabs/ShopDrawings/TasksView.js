import React, { useState, useEffect, useRef } from "react";
import DataGrid, {
    Column,
    Grouping,
    GroupPanel,
    SearchPanel,
    Editing,
    Button,
    RequiredRule,
    Lookup,
    Scrolling,
    MasterDetail,
    Export,
    Popup,
    Form,
    Item,
    FilterRow,
    HeaderFilter,
    FilterPanel,
    Search,
    Toolbar,
    AsyncRule
} from "devextreme-react/data-grid";
import Validator, {
    CustomRule
} from 'devextreme-react/validator';

import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Grid, Button as MaterialButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { TagBox, ColorBox } from "devextreme-react";

import {
    getEmployeeName,
    getJobName,
    getJobColor,
    getEmployeeNamesFromIDs,
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
        columns, 

        handleUpdate,
        handleDelete,
        handleAdd,

        canEdit
    } = props;

    const dataGridRef = useRef(null);
    const [tasksData, setTasksData] = useState(tasks);
    const [jobIndex, setJobIndex] = useState(0);
    const [statusIndex, setStatusIndex] = useState(null);

    // update tasksData if settings changed
    useEffect(() => {
        const updatedTasksData = tasksData.map(task => {
            const color = getJobColor(task.jobNumber, settings);
            return { ...task, assignedPeople: task.assignedPeople, color: color }
        });
        setTasksData(updatedTasksData);
    }, [])

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

    const handleSearchValueChanged = (e) => {
        dataGridRef.current.instance.filter(["assignedPeople", "contains", e.value]);
    };

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
            JSON: "",
            startDate: new Date(),
            endDate: new Date(),
            category: "shop drawings",
            created: new Date()
        }
    }

    const initNewEmployeeName = (row) => {
        row.data = {
            name: "",
            workFromHome: false,
            vacation: false,
            category: "shop drawings"
        }
    }

    const initNewSetting = (row) => {
        row.data = {
            jobNumber: "",
            color: "black",
            category: "shop drawings"
        }
    }

    const validateEndDate = async(params) => {
        console.log(params)
        const startDate = new Date(params.data.startDate);
        const endDate = new Date(params.value);

        if (endDate < startDate) {
            params.rule.message = 'End date must be after the start date';
            return false;
        }

        return true;
    };


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
                <Editing mode="popup" allowUpdating allowDeleting allowAdding useIcons>
                    <Popup title="Edit" showTitle={true} width="20vw" height="auto" />
                    <Form>
                        <Item itemType="group" colCount={1} colSpan={2}>
                            <Item dataField="jobNumber" />
                            <Item dataField="task" />
                            <Item dataField="includeOnMetrics" />
                            <Item dataField="description" editorType="dxTextArea" />
                            <Item dataField="assignedPeople" />
                            <Item dataField="status" editorType="dxSelectBox" editorOptions={{ items: ['Pending', 'In Progress', 'Completed'] }} />
                            <Item dataField="startDate" editorType="dxDateBox" />
                            <Item dataField="endDate" editorType="dxDateBox" editorOptions={{}} />
                        </Item>
                    </Form>
                </Editing>

                <Toolbar>
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

                {/* {columns.map((column) =>
                    column.subColumns ? (
                        <Column key={column.dataField} caption={column.caption} alignment="center">
                            {column.subColumns.map((subCol) => (
                                <Column
                                    key={subCol.dataField}
                                    dataField={subCol.dataField}
                                    caption={subCol.caption}
                                    dataType={subCol.dataType}
                                    alignment="center"
                                    cellRender={cell => {
                                        const cellData = cell.data.json[cell.column.dataField];
                                        const value = cellData ? cellData.value : "";
                                        return <div>{value}</div>
                                    }}
                                />
                            ))}
                        </Column>
                    ) : (
                        <Column
                            key={column.dataField}
                            dataField={column.dataField}
                            caption={column.caption}
                            dataType={column.dataType}
                            alignment="center"
                            cellRender={cell => {
                                const cellData = cell.data.json[cell.column.dataField];
                                const value = cellData ? cellData.value : "";
                                return <div>{value}</div>
                            }}
                        />
                    )
                )} */}

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
                <Column dataField="includeOnMetrics" caption="Include on Metrics" dataType="boolean" />
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
                <Column dataField="startDate" caption="Start Date" dataType="date" />
                <Column
                    dataField="endDate"
                    caption="End Date"
                    dataType="date"
                >
                    <AsyncRule
                        validationCallback={validateEndDate}
                    />
                </Column>
                <Column dataField="created" caption="Created Date" dataType="date" allowEditing={false} />
            
            </DataGrid>
        </div>
    );
};

export default TasksView;
