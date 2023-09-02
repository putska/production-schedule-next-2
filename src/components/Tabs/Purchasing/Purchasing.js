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
    Scrolling
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
    getJob
} from "@/lib/helper-functions";

import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import ShopDrawingsPage from "@/src/pages/shop-drawings";
import { ShowSubmenuMode } from "devextreme-react/context-menu";

const COMPLETE_COLOR = "green";
const PROBLEM_COLOR = "red";
const IN_PROCESS_COLOR = "yellow";
const NOT_APPLICABLE_COLOR = "gray";

const Purchasing = (props) => {
    const {
        jobs,
        shops,
        purchasing,
        tabColumns,
        handleAdd,
        handleDelete,
        handleUpdate
    } = props;
    const [expanded, setExpanded] = useState(true);
    const [jobData, setJobData] = useState([]);
    const [purchasingData, setPurchasingData] = useState([]);
    const [canEdit, setCanEdit] = useState(true);
    const [sortedShops, setSortedShops] = useState([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [selectedCell, setSelectedCell] = useState({});
    const [dialogStatus, setDialogStatus] = useState("Not Applicable");
    const [dialogValue, setDialogValue] = useState("");
    const [showValue, setShowValue] = useState(true);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const convertedJobs = convertDates(jobs);

        const newPurchasingData = convertedJobs.map(job => {
            const purchasingItem = purchasing.find(item => {
                const itemJobNumber = item.json?.jobNumber?.value ? item.json.jobNumber.value : null;
                return itemJobNumber === job.jobNumber;
            });

            const json = purchasingItem ? purchasingItem.json : {
                jobNumber: {
                    value: job.jobNumber,
                    status: "Not Applicable"
                }
            };

            return ({
                ...job,
                json: json
            })
        })
        setPurchasingData(newPurchasingData);
    }, [jobs, purchasing]);

    const jobWallCell = (row) => {
        return (
            <div style={{ textAlign: "left" }}>
                <span>{row.data.jobName}</span>
                <br></br>
                <span style={{ color: "#5a87d1" }}>{row.data.wallType}</span>
            </div>
        );
    };

    const renderRow = (row) => {
        if (row.rowType === "group") {
            let colorEntry = sortedShops.find((shop) => shop.__KEY___ === row.data.key);

            row.rowElement.style.backgroundColor = colorEntry
                ? colorEntry.colorkey
                : "white";
            row.rowElement.style.color = colorEntry ? colorEntry.fontColor : "black";
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
                saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'DataGrid.xlsx');
            });
        });
        e.cancel = true;
    }

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
        const customCellData = cell.data.json[cell.column.dataField];

        if (customCellData && cell.columnIndex >= 5) {
            setShowValue(true);
            setFormData({ value: customCellData.value, status: customCellData.status })
        } else if (cell.columnIndex < 5 && cell.data[cell.column.dataField]) {
            setShowValue(false);
            setFormData({ value: "", status: customCellData.status })
        } else if (cell.data[cell.column.dataField]) {
            setShowValue(true);
            setFormData({ value: customCellData.value, status: "Not Applicable" })
        } else {
            setShowValue(true)
            setFormData({ value: "", status: "Not Applicable" })
        }
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

            const cellData = cell.data.json ? cell.data.json[cell.column.dataField] : null;
            if (cellData) {
                const bgColor = getColorFromStatus(cellData.status);
                cell.cellElement.style.backgroundColor = bgColor;
            }
        }
    };

    const getColorFromStatus = (status) => {
        if (status === "Completed") {
            return COMPLETE_COLOR;
        } else if (status === "Problem") {
            return PROBLEM_COLOR;
        } else if (status === "In Process") {
            return IN_PROCESS_COLOR;
        } else {
            return NOT_APPLICABLE_COLOR;
        }
    }

    return (
        <div style={{ margin: "3vw" }}>
            <DataGrid
                dataSource={purchasingData}
                showRowLines
                columnAutoWidth
                autoExpandAll
                highlightChanges={expanded}
                repaintChangesOnly
                wordWrapEnabled
                showColumnLines
                onCellPrepared={cellPrepared}
                onRowPrepared={renderRow}
                onExporting={onExporting}
                height="80vh"
            >
                <GroupPanel visible />
                <SearchPanel visible highlightCaseSensitive={false} />
                <Grouping autoExpandAll={expanded} />
                <Sorting mode='multiple' />
                <Scrolling mode="virtual" />
                <Export enabled={true} allowExportSelectedData={true} />
                <LoadPanel enabled showIndicator />
                <Editing
                    mode="cell"
                    allowUpdating
                />

                <Toolbar>
                    <Item location="after" name="searchPanel" />
                </Toolbar>

                <Column
                    dataField='jobNumber'
                    dataType='string'
                    caption='Job Number'
                    visibleIndex={0}
                    alignment='center'
                    allowSorting
                    allowEditing={false}
                    calculateDisplayValue={(row) => {
                        if (!row.booked) {
                            return "Book in 90 Days";
                        }
                        return row.jobNumber;
                    }}
                ></Column>

                <Column
                    dataField='jobName'
                    caption='Job Name & Wall Type'
                    visibleIndex={1}
                    alignment="center"
                    allowEditing={false}
                    cellRender={jobWallCell}
                />

                <Column
                    dataField='start'
                    caption='Shop Start Date'
                    visibleIndex={2}
                    alignment='center'
                    defaultSortOrder="asc"
                    allowSorting
                    allowEditing={false}
                    dataType="date"
                    calculateCellValue={(row) => {
                        if (row.fieldStart && row.weeks >= 0 && row.start == null) {
                            const daysToAdd = row.weeks * 7 * -1; // multiply by -1 bc start is before field start
                            row.start = addDays(row.fieldStart, daysToAdd);
                            row.start = toMondayDate(row.start);
                        }
                        return row.start;
                    }}
                />
                <Column
                    dataField='fieldStart'
                    caption='Field Start'
                    visibleIndex={3}
                    dataType="date"
                    allowEditing={false}
                    alignment='center'
                />

                <Column
                    dataField="shop"
                    caption="Shop Location"
                    visibleIndex={4}
                    alignment="center"
                    allowEditing={false}
                    calculateDisplayValue={cell => shops.find(shop => shop.__KEY__ === cell.groupKey).shop || ""}
                />

                {tabColumns.map((column) =>
                    column.columns
                        ? (
                            <Column key={column.dataField} caption={column.caption} alignment="center">
                                {column.columns.map((subCol) => (
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
                )}
            </DataGrid>

            <DataGrid
                dataSource={purchasing}
                onRowRemoved={row => deleteHandler(row, "purchasing")}
                onRowUpdated={row => updateHandler(row, "purchasing")}
            >
                <Editing allowDeleting allowUpdating></Editing>

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

export default Purchasing;
