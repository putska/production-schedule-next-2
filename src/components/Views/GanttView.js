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
} from "devextreme-react/data-grid";
import { Button, TagBox, ColorBox, DateBox } from "devextreme-react";

import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Grid,
    Button as MaterialButton,
    ButtonGroup,
    IconButton,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";

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
    lightOrDark
} from "@/lib/helper-functions";

import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import JobForm from "@/src/components/Tabs/ProductionSchedule/PS_JobForm";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function GanttView(props) {
    const {
        jobs,
        shops,
        columns,
        columnsX,
        startDate,
        endDate,
        handleDateChange,

        categoryKey,
        customColumns,
        showEditButtons,
        defaultColor,
        linkToFieldStart,
        showShopButtons,

        handleAdd,
        handleDelete,
        handleUpdate
    } = props;

    const [expanded, setExpanded] = useState(true);
    const [canEdit, setCanEdit] = useState(true);
    const [sortedShops, setSortedShops] = useState([]);
    const [formData, setFormData] = useState({});
    const [formVisible, setFormVisible] = useState(false);
    const [showGanttSection, setShowGanttSection] = useState(true);
    const [ganttData, setGanttData] = useState([]);

    const [shop, setShop] = useState(shops[0])
    const [shopID, setShopID] = useState(0);
    const dataGridRef = useRef();

    useEffect(() => {
        if (showShopButtons && typeof window !== 'undefined' && window.localStorage) {
            const storedValue = localStorage.getItem(`${categoryKey}_ganttShopID`);
            setShopID(storedValue ? parseInt(storedValue, 10) : 0);
        }
    }, [])

    useEffect(() => {
        if (showShopButtons) {
            localStorage.setItem(`${categoryKey}_ganttShopID`, shopID.toString());
            const selectedShop = shops.find(shop => shop.ID === shopID) || shops[0];
            setShop(selectedShop);
            setGanttData(jobs.filter(job => job.groupKey === selectedShop.__KEY__))
        }
    }, [shopID, jobs])

    const showPopup = (data) => {
        setFormData(data)
        setFormVisible(true);
    }

    const hidePopup = () => {
        setFormData({});
        setFormVisible(false)
    }

    const jobWallCell = (row) => {
        return (
            <div>
                <span>{row.data.jobName}</span>
                <br></br>
                <span style={{ color: "#5a87d1" }}>{row.data.wallType}</span>
            </div>
        );
    }

    const handleCellClick = (cell) => {
        if (dataGridRef.current?.instance && cell.column.headerFullDate) {
            // setSelectedCell(cell);
            dataGridRef.current?.instance?.editCell(cell.rowIndex, cell.column.dataField);
        }
    }

    const cellPrepared = (cell) => {

        cell.cellElement.addEventListener("click", (e) => handleCellClick(cell));

        if (cell.value && cell.rowType === "data") {
            if (cell.value?.cellColor && cell.column.headerFullDate) {
                cell.cellElement.style.backgroundColor = cell.value?.cellColor;
            }
        }
        if (cell.rowType === "data") {
            if (
                cell.column.headerFullDate ===
                toMondayDate(cell.data.fieldStart).toLocaleDateString()
            ) {
                cell.cellElement.style.borderLeft = "solid red 5px";
            }
            if (
                cell.data.booked &&
                cell.data.engineering &&
                (cell.columnIndex == 3)
            ) {
                cell.cellElement.style.backgroundColor = "#edada6";
            }
            if (!cell.data.booked && (cell.columnIndex == 3)) {
                cell.cellElement.style.backgroundColor = "cyan";
            }
        }

        // Setting today's header color and styling
        const today = toMondayDate(new Date());
        if (cell.column.headerFullDate === today.toLocaleDateString()) {
            if (cell.rowType === "header") {
                cell.cellElement.style.backgroundColor = "#c2eafc";
            }
        }
    }

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

        setFormData(newJobData);
        setFormVisible(true);
    }

    const onShopRowInit = (row) => {
        row.data.shop = "";
        row.data.fontColor = "#000";
        row.data.colorkey = "#fff";
        row.data.index = sortedShops.length;
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

    const calculateUnitTotals = (options) => {
        columns.map((col, i) => {
            if (options.name === `UnitSummary_${col.offset}`) {
                if (options.summaryProcess === 'start') {
                    options.totalValue = 0;
                } else if (options.summaryProcess === 'calculate') {
                    if (options.value[col.offset.toString()]?.planned) {
                        options.totalValue += options.value[col.offset.toString()].planned;
                    } else if (options.value[col.offset.toString()]?.actual) {
                        options.totalValue += options.value[col.offset.toString()].actual;
                    }
                }
            }
        })

        if (options.name === `customSummary`) {
            if (options.summaryProcess === 'start') {
                options.totalValue = 0;
            } else if (options.summaryProcess === 'calculate') {
                options.totalValue += options.value;
            }
        }
    }

    const handleRowUpdated = (cell) => {
        const newJobData = { ...cell.data, JSON: { ...cell.data.JSON } }

        for (const key in newJobData) {
            if (!isNaN(parseInt(key)) && typeof newJobData[key].actual === "number") {
                if (linkToFieldStart) {
                    const ganttStartDate = jobs[0].start;
                    const fieldStartOffset = toWeeks(ganttStartDate, cell.data.fieldStart);
                    const dataField = parseInt(key) - fieldStartOffset;
                    newJobData.JSON[categoryKey][dataField] = newJobData[key];
                } else {
                    newJobData.JSON[categoryKey][key] = newJobData[key];
                }
            }
        }

        newJobData.JSON = JSON.stringify({
            ...newJobData.JSON,
            [categoryKey]: newJobData.JSON[categoryKey]
        });

        handleUpdate(newJobData, "job");
    }

    return (
        <div>
            {(canEdit && showShopButtons) && (
                <Accordion style={{ marginBottom: "20px" }}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls='panel1a-content'
                        id='panel1a-header'
                    >
                        <Typography>Adjust Shop Settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container direction='column'>
                            <Grid item>
                                <DataGrid
                                    dataSource={sortedShops}
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
                                    onInitNewRow={onShopRowInit}
                                    onRowUpdated={(e) => updateHandler(e, "shop")}
                                    onRowInserted={(e) => addHandler(e, "shop")}
                                    onRowRemoved={(e) => deleteHandler(e, "shop")}
                                >
                                    <Editing
                                        mode='cell'
                                        allowUpdating={canEdit}
                                        allowAdding={canEdit}
                                        allowDeleting={canEdit}
                                        useIcons
                                    />

                                    <Column dataField='shop' caption='Shop'>
                                        <RequiredRule />
                                    </Column>
                                    <Column
                                        dataField='colorkey'
                                        caption='Colorkey for Shop'
                                        cellRender={(cell) => {
                                            return (
                                                <ColorBox
                                                    applyValueMode='instantly'
                                                    defaultValue={cell.data.colorkey}
                                                    readOnly={true}
                                                />
                                            );
                                        }}
                                        editCellRender={(cell) => {
                                            return (
                                                <ColorBox
                                                    defaultValue={cell.data.colorkey}
                                                    onValueChange={(color) => cell.setValue(color)}
                                                />
                                            );
                                        }}
                                    />
                                    <Column
                                        dataField='fontColor'
                                        caption='Font Color for Shop'
                                        cellRender={(cell) => {
                                            return (
                                                <ColorBox
                                                    readOnly={true}
                                                    defaultValue={cell.data.fontColor}
                                                />
                                            );
                                        }}
                                        editCellRender={(cell) => {
                                            return (
                                                <ColorBox
                                                    defaultValue={cell.data.fontColor}
                                                    onValueChange={(color) => {
                                                        cell.setValue(color);
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

            {!formVisible &&
                <DataGrid
                    dataSource={showShopButtons ? ganttData : jobs}
                    ref={dataGridRef}
                    showRowLines
                    showColumnLines={false}
                    columnAutoWidth
                    autoExpandAll
                    highlightChanges={expanded}
                    repaintChangesOnly
                    wordWrapEnabled
                    onCellPrepared={cellPrepared}
                    onRowPrepared={renderRow}
                    onExporting={onExporting}
                    height="70vh"
                    onRowUpdated={handleRowUpdated}
                >
                    <Scrolling mode="infinite" />
                    <GroupPanel visible />
                    <SearchPanel visible highlightCaseSensitive={false} />
                    <Grouping autoExpandAll={expanded} />
                    <Sorting mode='multiple' />
                    <Export enabled={true} allowExportSelectedData={true} />
                    <LoadPanel enabled showIndicator />

                    <Editing mode="cell" allowEditing />

                    <Toolbar>
                        <Item location="before">
                            <Grid container spacing={1} sx={{ flexDirection: { xs: "column", md: "row" } }}>
                                {showShopButtons &&
                                    <Grid item>
                                        <IconButton
                                            color="primary"
                                            variant="outlined"
                                            onClick={addJobHandler}
                                        >
                                            <AddIcon />
                                            <Typography>Add Job</Typography>
                                        </IconButton>
                                    </Grid>}
                            </Grid>
                        </Item>
                        <Item location="before" name="searchPanel" style={{ padding: "3px", position: "relative", bottom: "10px" }} />

                        {showShopButtons &&
                            <Item location="center">
                                <ButtonGroup variant="contained" aria-label="outlined primary button group" sx={{
                                    flexDirection: { sm: "column", md: "row" }
                                }}>
                                    {shops.map(s => {
                                        return (
                                            <MaterialButton
                                                key={s.ID}
                                                onClick={e => setShopID(s.ID)}
                                                sx={{
                                                    color: `${(shopID === s.ID) ? s.fontColor : "white"}`,
                                                    backgroundColor: `${(shopID === s.ID) ? s.colorkey : "primary"}`
                                                }}
                                            >
                                                {s.shop}
                                            </MaterialButton>
                                        )
                                    })}
                                </ButtonGroup>
                            </Item>
                        }

                        <Item location="after">
                            <Grid container sx={{ flexDirection: { xs: "column", md: "row" } }} spacing={1}>
                                <Grid item>
                                    <DateBox
                                        label="Start"
                                        defaultValue={startDate}
                                        style={{ position: "relative", bottom: "5px" }}
                                        onValueChanged={e => handleDateChange("startDate", e.value)}
                                    />
                                </Grid>
                                <Grid item>
                                    <DateBox
                                        label="End"
                                        defaultValue={endDate}
                                        style={{ position: "relative", bottom: "5px" }}
                                        onValueChanged={e => handleDateChange("endDate", e.value)}
                                    />
                                </Grid>
                                <Grid item>
                                    <MaterialButton variant="outlined" onClick={e => setShowGanttSection(!showGanttSection)}>
                                        {showGanttSection ? "Hide Gantt" : "Show Gantt"}
                                    </MaterialButton>
                                </Grid>
                            </Grid>
                        </Item>
                    </Toolbar>

                    {showEditButtons &&
                        <Column
                            fixed
                            fixedPosition="left"
                            type="buttons"
                            cellRender={cell => {
                                return (cell.rowType == "data" &&
                                    <div>

                                        <IconButton color="primary" aria-label="edit" onClick={(e) => showPopup(cell.data)}>
                                            <EditIcon style={{ fontSize: "18px" }} />
                                        </IconButton>

                                        <IconButton color="red" aria-label="delete" onClick={(e) => deleteHandler(cell, "job")}>
                                            <DeleteIcon style={{ fontSize: "18px" }} />
                                        </IconButton>

                                    </div>
                                )
                            }}>
                        </Column>
                    }

                    <Column
                        fixed
                        dataField='jobNumber'
                        dataType='string'
                        caption='Job Number'
                        alignment='center'
                        allowSorting
                        calculateDisplayValue={(row) => !row.booked ? "Book in 90 Days" : row.jobNumber}
                        allowEditing={false}
                    ></Column>

                    <Column
                        dataField='jobName'
                        fixed
                        minWidth={"250px"}
                        caption='Job Name & Wall Type'
                        cellRender={jobWallCell}
                        allowEditing={false}
                    />

                    <Column
                        dataField='start'
                        caption='Shop Start Date'
                        alignment='center'
                        fixed
                        defaultSortOrder="asc"
                        allowSorting
                        dataType="date"
                        allowEditing={false}
                    />
                    <Column
                        fixed
                        dataField='fieldStart'
                        caption='Field Start'
                        dataType="date"
                        alignment='center'
                        allowEditing={false}
                    />

                    {customColumns &&
                        customColumns.map((col, i) => {
                            return (
                                <Column
                                    key={col.dataField}
                                    dataField={col.dataField}
                                    caption={col.caption}
                                    alignment={col.alignment}
                                    dataType={col.dataType}
                                    allowEditing={false}
                                    fixed
                                    calculateCellValue={cell => col.calculateCellValue && col.calculateCellValue(cell)}
                                />
                            )
                        })
                    }


                    {columnsX
                        .filter((col, i) => showGanttSection)
                        .map((col, i) => {
                            return (
                                <Column caption={col.month} alignment='center' key={i}>
                                    {col.innerColsX.map((innerCol, k) => {
                                        return (
                                            <Column
                                                key={k}
                                                dataField={innerCol.offset.toString()}
                                                caption={new Date(innerCol.date).getDate()}
                                                // width={40}
                                                alignment='center'
                                                dataType='number'
                                                allowEditing={false}
                                                headerFullDate={innerCol.date}
                                                cellRender={cell => {
                                                    const col = cell.column.dataField;
                                                    const isDate = cell.data[col] != null;

                                                    return (
                                                        <div>
                                                            <div style={{ fontWeight: "bold" }}>{isDate ? cell.data[col].planned : ""}</div>
                                                            <div>{cell.data[col]?.actual > 0 ? cell.data[col].actual : ""}</div>
                                                        </div>
                                                    )
                                                }}
                                                editCellRender={cell => {
                                                    const handleChange = (key, value) => {
                                                        const newCellData = {
                                                            ...cell.value,
                                                            [key]: parseInt(value) || 0
                                                        }
                                                        cell.setValue(newCellData);
                                                    }

                                                    return (
                                                        <div>
                                                            <input
                                                                style={{ padding: "10px", color: "black", textAlign: "center" }}
                                                                defaultValue={cell.value ? cell.value.actual : ""}
                                                                onChange={(e) => handleChange("actual", e.target.value)}
                                                                type="number"
                                                                min={0}
                                                            />
                                                        </div>
                                                    )
                                                }}
                                            />
                                        )
                                    })}
                                </Column>
                            )
                        })}

                    <Summary calculateCustomSummary={calculateUnitTotals} recalculateWhileEditing>
                        
                        {customColumns.map((col, i) => (
                            col.dataType === "number" && <TotalItem key={i.toString()} column={col.dataField} name="customSummary" summaryType='custom' />
                        ))}
                        
                        {columns.map((col, i) => (
                            <TotalItem
                                key={i.toString()}
                                name={`UnitSummary_${col.offset}`}
                                summaryType="custom"
                                displayFormat="{0}"
                                showInColumn={col.offset.toString()}
                            />
                        ))}
                    </Summary>

                </DataGrid>
            }

            {showEditButtons &&
                <JobForm
                    formVisible={formVisible}
                    setFormVisible={setFormVisible}
                    formData={formData}
                    setFormData={setFormData}
                    hidePopup={hidePopup}
                    jobs={jobs}
                    shops={shops}
                    handleAdd={handleAdd}
                    handleDelete={handleDelete}
                    handleUpdate={handleUpdate}
                />
            }

        </div >
    )
}