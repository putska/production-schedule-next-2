import React, { useState, useEffect, useRef } from "react";
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
    Scrolling,
    EditingTexts
} from "devextreme-react/data-grid";
import { TagBox, ColorBox } from "devextreme-react";
import { Edit as EditIcon, Delete as DeleteIcon, DeleteForeverTwoTone } from '@mui/icons-material';

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
    Typography,
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
    getEmployees,
    getJob,
    columnsData,
    convertColumns
} from "@/lib/helper-functions";

const COMPLETE_COLOR = "green";
const PROBLEM_COLOR = "red";
const IN_PROCESS_COLOR = "yellow";
const NOT_APPLICABLE_COLOR = "gray";

const PS_Settings = (props) => {
    const {
        tabColumns,
        handleAdd,
        handleDelete,
        handleUpdate
    } = props;

    const [data, setData] = useState([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [selectedCell, setSelectedCell] = useState({});
    const [showValue, setShowValue] = useState(true);
    const [formData, setFormData] = useState({});

    const datagridRef = useRef(null);

    useEffect(() => {
        const newData = convertColumns(tabColumns);
        setData(newData)
    }, []);

    const convertColumns = (columnData) => {
        console.log(columnData)
        return columnData.map((item) => {
            const newItem = {
                ID: item.ID,
                category: item.category
            }
            // console.log(item.columns)
            // if (item.columns) {
            //     item.columns.forEach((col) => {
            //         newItem[col.dataField] = col.dataField;
            //     })
            // }
            return newItem;
        });
    };


    const addJobHandler = () => {
        const newJobData = {
            wallType: "Unitized CW Custom",
            emps: 12,
            booked: false,
            engineering: false,
            stickwall: false,
            reserved: false,
            unitsPerWeek: 150,
            fieldStart: new Date()
        }
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

    const handleCellClick = (cell) => {
        setSelectedCell(cell);
        setFormData(cell.data)
        setDialogVisible(true);
    };

    const handleDialogClose = () => {
        setDialogVisible(false);
    };

    const handleDialogSave = async () => {
        const updatedJson = {
            ...selectedCell.data.json
        }

        updatedJson[selectedCell.column.dataField] = {
            value: formData.value,
            status: formData.status
        }

        const newData = {
            category: "purchasing",
            json: JSON.stringify(updatedJson)
        }

        const purchasingItem = purchasing.find(item => item?.json?.jobNumber?.value === selectedCell.data.jobNumber);

        if (purchasingItem) {
            // already is in the json --> update
            console.log("found purchasing item!")
            newData.ID = purchasingItem.ID;
            handleUpdate(newData, "purchasing");

        } else {
            // otherwise create new one
            console.log("have to make new purchasing item")
            handleAdd(newData, "purchasing");
        }
        setDialogVisible(false);
    };

    const handleInputChange = (key, value) => {
        const newFormData = {
            ...formData,
            [key]: value
        }
        setFormData(newFormData);
    };

    const cellPrepared = (cell) => {
        if (cell.data && cell.rowType === "data") {
            cell.cellElement.addEventListener("click", () => handleCellClick(cell));
        }
    };

    return (
        <div style={{ margin: "3vw" }}>
            <DataGrid
                ref={datagridRef}
                dataSource={data}
                showRowLines
                columnAutoWidth
                height="80vh"
                onCellPrepared={cellPrepared}
                onRowInserted={row => addHandler(row, "column")}
                onRowRemoved={row => deleteHandler(row, "column")}
                onRowUpdated={row => updateHandler(row, "column")}
            >

                <Editing
                    allowUpdating
                    allowAdding
                    allowDeleting
                />

                <Column dataField="category" />
                <Column dataField="columns" />

                {/* {columnsData.columns?.map((column) =>
                    column.columns
                        ? (
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
            </DataGrid>

            <Dialog open={dialogVisible} onClose={handleDialogClose}>
                <DialogContent>
                    {showValue && (
                        <TextField
                            value={formData.value}
                            type={selectedCell.column ? selectedCell.column.dataType : ""}
                            onChange={(e) => handleInputChange("value", e.target.value)}
                            fullWidth
                            label={selectedCell.column ? selectedCell.column.caption : ""}
                        />
                    )}
                    <FormControl fullWidth variant="outlined" style={{ marginTop: 10 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={formData.status}
                            onChange={(e) => handleInputChange("status", e.target.value)}
                            label="Status"
                        >
                            <MenuItem value="Completed">Completed</MenuItem>
                            <MenuItem value="Problem">Problem</MenuItem>
                            <MenuItem value="In Process">In Process</MenuItem>
                            <MenuItem value="Not Applicable">Not Applicable</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDialogSave} color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>



        </div >
    );
};

export default PS_Settings;
