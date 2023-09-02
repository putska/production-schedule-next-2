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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
    FormControlLabel
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
    updateDataWithJSON,
    parseJSON
} from "@/lib/helper-functions";

import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';

export default function CustomView(props) {
    const {
        jobs,
        data,
        tabColumns,
        colorOptions,
        categoryKey,
        handleUpdate,
        handleAdd,
        handleDelete,
        canEdit
    } = props;

    const [expanded, setExpanded] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [selectedCell, setSelectedCell] = useState({});
    const [formData, setFormData] = useState({})

    const updateHandler = async (e, type) => {
        try {
            e.component.beginCustomLoading();
            const newSetting = {
                ...e.data,
                category: categoryKey,
                JSON: JSON.stringify({
                    value: e.data.value,
                    color: e.data.color
                })
            }
            await handleUpdate(newSetting, type);
            e.component.endCustomLoading();
        } catch (error) {
            console.error(error);
            e.component.endCustomLoading();
        }
    }

    const addHandler = async (e, type) => {
        try {
            e.component.beginCustomLoading();
            const newSetting = {
                category: categoryKey,
                JSON: JSON.stringify({
                    value: e.data.value,
                    color: e.data.color
                })
            }
            await handleAdd(newSetting, type);
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

    const handleCellClick = (cell) => {
        const cellData = cell.data[cell.column.dataField];

        setSelectedCell(cell);
        setFormData({ value: cellData.value, status: cellData.status })
        setDialogVisible(true);
    };

    const handleDialogClose = () => {
        setFormData({});
        setDialogVisible(false);
    };

    const handleDialogSave = async () => {

        let newJobs = convertDates(parseJSON(jobs, "JSON"));
        const jobData = newJobs.find(job => job.ID === selectedCell.data.ID);

        const newJobData = {
            ...jobData,
            JSON: JSON.stringify({
                ...jobData.JSON,
                [categoryKey]: {
                    ...selectedCell.data,
                    [selectedCell.column.dataField]: {
                        value: formData.value,
                        status: formData.status
                    }
                }
            })
        }

        handleUpdate(newJobData, "job");
        setDialogVisible(false);
    }

    const handleInputChange = (key, value) => {
        const newFormData = {
            ...formData,
            [key]: value
        }
        setFormData(newFormData);
    }

    const cellPrepared = (cell) => {
        if (cell.data && cell.rowType === "data") {
            const cellData = cell.data[cell.column.dataField];
            cell.cellElement.addEventListener("click", () => handleCellClick(cell));
            const bgColor = getColorFromStatus(cellData ? cellData.status : "none");
            cell.cellElement.style.backgroundColor = bgColor;
        }
        if (cell.column.headerColor) {
            cell.cellElement.style.backgroundColor = cell.column.headerColor;
            cell.cellElement.style.color = "white";
        }
    }

    const getColorFromStatus = (status) => {
        const foundStatusObject = colorOptions.find(option => option.value === status);
        return foundStatusObject ? foundStatusObject.color : "white";
    }

    const onColorCodingRowInit = (row) => {
        row.data = {
            value: "",
            color: "black",
        }
    }

    const renderCheckBox = (row) => {
        const value = row.value.value ? row.value.value : false;
        return <Checkbox checked={value} size="small" />
    }

    return (
        <div>
            {canEdit &&
                (
                    <Accordion style={{ marginBottom: "20px" }}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls='panel1a-content'
                            id='panel1a-header'
                        >
                            <Typography>Adjust Settings</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <DataGrid
                                dataSource={colorOptions}
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
                                onInitNewRow={onColorCodingRowInit}
                                onRowUpdated={(e) => updateHandler(e, "setting")}
                                onRowInserted={(e) => addHandler(e, "setting")}
                                onRowRemoved={(e) => deleteHandler(e, "setting")}
                            >
                                <Editing
                                    mode='cell'
                                    allowUpdating={canEdit}
                                    allowAdding={canEdit}
                                    allowDeleting={canEdit}
                                    useIcons
                                />

                                <Column dataField='value' caption='Option' />

                                <Column
                                    dataField='color'
                                    caption='Color'
                                    cellRender={(cell) => {
                                        return (
                                            <ColorBox
                                                applyValueMode='instantly'
                                                defaultValue={cell.data.color}
                                                readOnly={true}
                                            />
                                        );
                                    }}
                                    editCellRender={(cell) => {
                                        return (
                                            <ColorBox
                                                defaultValue={cell.data.color}
                                                onValueChange={(color) => cell.setValue(color)}
                                            />
                                        );
                                    }}
                                />
                            </DataGrid>
                        </AccordionDetails>
                    </Accordion>
                )
            }

            <DataGrid
                dataSource={data}
                showRowLines
                columnAutoWidth
                repaintChangesOnly
                wordWrapEnabled
                showColumnLines
                onCellPrepared={cellPrepared}
                onExporting={onExporting}
                height="75vh"
                // style={{fontFamily: "Verdana"}}
            >
                {/* <GroupPanel visible /> */}
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
                    <Item name="searchPanel" />
                </Toolbar>

                {tabColumns.map((column) => {
                    if (column.dataType === "boolean") {
                        column = {
                            ...column,
                            cellRender: (row) => renderCheckBox(row)
                        }
                    }
                    
                    return (
                    column.columns
                        ? (
                            <Column key={column.dataField} caption={column.caption} alignment="center">
                                {column.columns.map((subCol) => (
                                    <Column
                                        key={subCol.dataField}
                                        {...subCol}
                                        allowEditing={false}
                                        alignment="center"
                                        calculateDisplayValue={cell => {
                                            const cellData = cell[subCol.dataField];
                                            return (cellData && cellData.value) ? cellData.value : "";
                                        }}
                                    />
                                ))}
                            </Column>
                        ) : (
                            <Column
                                key={column.dataField}
                                {...column}
                                allowEditing={false}
                                alignment="center"
                                calculateDisplayValue={cell => {
                                    const cellData = cell[column.dataField];
                                    return (cellData && cellData.value) ? cellData.value : "";
                                }}
                            />
                        ))
                })}
            </DataGrid>

            <Dialog open={dialogVisible} onClose={handleDialogClose}>
                <DialogContent>
                    {(selectedCell?.column && selectedCell.column.dataType !== "boolean" && selectedCell.column.canEdit) &&
                        <TextField
                            value={formData.value}
                            type={selectedCell.column ? selectedCell.column.dataType : ""}
                            onChange={(e) => handleInputChange("value", e.target.value)}
                            fullWidth
                            label={selectedCell.column ? selectedCell.column.caption : ""}
                        />}

                    {(selectedCell?.column && selectedCell.column.dataType === "boolean" && selectedCell.column.canEdit) &&
                        <FormControlLabel
                            control={<Checkbox
                                checked={formData.value}
                                onChange={(e) => handleInputChange("value", e.target.checked)}
                                fullWidth
                            />}
                            label={selectedCell.column ? selectedCell.column.caption : ""}
                        />
                    }

{/* {(selectedCell?.column && selectedCell.column.dataType === "boolean" && selectedCell.column.canEdit) &&
                        <FormControlLabel
                            control={<Checkbox
                                checked={formData.value}
                                onChange={(e) => handleInputChange("value", e.target.checked)}
                                fullWidth
                            />}
                            label={selectedCell.column ? selectedCell.column.caption : ""}
                        />
                    } */}
                    <FormControl fullWidth variant="outlined" style={{ marginTop: 10 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={formData.status}
                            onChange={(e) => handleInputChange("status", e.target.value)}
                            label="Status"
                        >
                            {colorOptions.map(option => (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                    style={{ color: `${option.color != "white" ? option.color : "black"}` }}>
                                    {option.value}
                                </MenuItem>
                            ))}
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

        </div>
    );
}
