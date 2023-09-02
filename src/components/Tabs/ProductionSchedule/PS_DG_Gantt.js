import React, { useState, useEffect } from "react";
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
import Button from 'devextreme-react/button';
import { TagBox, ColorBox } from "devextreme-react";
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  Button as MaterialButton,
  IconButton
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Add as AddIcon } from "@mui/icons-material";
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';


import {
  month,
  convertToDate,
  convertDates,
  toOffset,
  toMondayDate,
  addDays,
  toWeeks,
  getMondays,
  getEmployees
} from "@/lib/helper-functions";

import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import JobForm from "./PS_JobForm";

const ProductionScheduleGantt = (props) => {
  const {
    jobs,
    shops,
    columns,
    columnsX,
    handleAdd,
    handleDelete,
    handleUpdate
  } = props;
  const [expanded, setExpanded] = useState(true);
  const [jobData, setJobData] = useState([]);
  const [jobTasks, setJobTasks] = useState([]);
  const [currentJobName, setCurrentJobName] = useState("");
  const [canEdit, setCanEdit] = useState(true);
  const [sortedShops, setSortedShops] = useState([]);
  const [formData, setFormData] = useState({});
  const [formVisible, setFormVisible] = useState(false);
  const [showGanttSection, setShowGanttSection] = useState(true);

  useEffect(() => {
    const newSortedShops = [...shops].sort((a, b) => parseInt(a.index) - parseInt(b.index));
    setSortedShops(newSortedShops);
  }, [shops]);

  useEffect(() => {
    let newJobs = convertDates(jobs);

    jobs.forEach(job => {
      const index = newJobs.findIndex((j) => j.ID === job.ID);
      const startOffset = toWeeks(toMondayDate(jobs[0].start), toMondayDate(job.start))

      columns.forEach(innerCol => {
        let isDate =
          parseInt(innerCol.offset) >= startOffset &&
          parseInt(innerCol.offset) < startOffset + job.weeks;

        if (isDate) {
          const thisWeek = innerCol.offset - startOffset + 1;
          let displayUnits = job.unitsPerWeek;

          if (thisWeek == job.weeks) {
            const remainderUnits = job.unitsPerWeek > 0 ? job.units % job.unitsPerWeek : 0;
            displayUnits = remainderUnits != 0 ? remainderUnits : job.unitsPerWeek;
          }

          newJobs[index][innerCol.offset.toString()] = displayUnits;
        }
      })
    })

    setJobData(newJobs)

  }, [jobs]);

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
  };

  const cellPrepared = (cell) => {
    let colorEntry =
      cell.rowType === "data"
        ? sortedShops.find((shop) => shop.__KEY__ === cell.data.groupKey)
        : "";
    let headerColor =
      cell.rowType === "data" && colorEntry ? colorEntry.colorkey : "white";

    if (cell.data && cell.rowType === "data") {
      const startOffset = toWeeks(jobs[0].start, toMondayDate(cell.data.start))
      cell.data.offset = startOffset;

      let isDate =
        parseInt(cell.column.dataField) >= startOffset &&
        parseInt(cell.column.dataField) < startOffset + cell.data.weeks;

      if (isDate) {
        cell.cellElement.style.backgroundColor = headerColor;
      }
      if (
        cell.data.booked &&
        cell.data.engineering &&
        (cell.columnIndex <= 4 || isDate)
      ) {
        cell.cellElement.style.backgroundColor = "#edada6";
      }
      if (!cell.data.booked && (cell.columnIndex <= 4 || isDate)) {
        cell.cellElement.style.backgroundColor = "cyan";
      }

      if (
        cell.column.headerFullDate ===
        toMondayDate(cell.data.fieldStart).toLocaleDateString()
      ) {
        cell.cellElement.style.borderLeft = "solid red 5px";
      }

      if (cell.column.headerFullDate === toMondayDate(new Date()).toLocaleDateString() && !isDate) {
        cell.cellElement.style.backgroundColor = "#c2eafc"
      }
    }
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

  return (
    <div>
      {canEdit && (
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
          dataSource={jobData}
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
          height={1000}
        // onEditingStart={startEditingJob}
        // onInitNewRow={onInitNewJob}
        // onRowUpdated={(e) => updateHandler(e, "job")}
        // onRowInserted={(e) => addHandler(e, "job")}
        // onRowRemoved={(e) => deleteHandler(e, "job")}
        >
          <Scrolling mode="virtual" />
          <GroupPanel visible />
          <SearchPanel visible highlightCaseSensitive={false} />
          <Grouping autoExpandAll={expanded} />
          <Sorting mode='multiple' />
          <Export enabled={true} allowExportSelectedData={true} />
          <LoadPanel enabled showIndicator />
          <Pager
            visible={true}
            displayMode='compact'
            showPageSizeSelector={true}
            allowedPageSizes={[20, 50, 100, 150, 200]}
          />
          <Paging defaultPageSize={20} />

          <Toolbar>
            <Item location="before">
              <IconButton
                color="primary"
                variant="outlined"
                onClick={addJobHandler}
              >
                <AddIcon />
                <Typography>Add Job</Typography>
              </IconButton>
            </Item>
            <Item location="before">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showGanttSection}
                    onChange={() => setShowGanttSection(!showGanttSection)}
                  />
                }
                label="Show Gantt"
              />
            </Item>

            <Item location="before">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={expanded}
                    onChange={() => setExpanded(!expanded)}
                  />
                }
                label={expanded ? 'Collapse All' : 'Expand All'}
              />
            </Item>
            <Item location="after" name="searchPanel" />
          </Toolbar>

          <Column
            fixed
            fixedPosition="left"
            type="buttons"
            cellRender={cell => {
              return (cell.rowType == "data" &&
                <div>

                  <IconButton color="primary" aria-label="edit" onClick={(e) => showPopup(cell.data)}>
                    <EditIcon />
                  </IconButton>

                  <IconButton color="red" aria-label="delete" onClick={(e) => deleteHandler(cell, "job")}>
                    <DeleteIcon />
                  </IconButton>

                </div>
              )
            }}>
          </Column>

          <Column
            dataField='shop'
            groupIndex={0}
            dataType='string'
            allowSorting
            calculateGroupValue='groupKey'
            sortingMethod={(a, b) => {
              // Compare the shop indexes for sorting
              const shopA = sortedShops.find((shop) => shop.__KEY__ === a);
              const shopB = sortedShops.find((shop) => shop.__KEY__ === b);
              return parseInt(shopA.index) - parseInt(shopB.index);
            }
            }
            groupCellRender={(row) => {
              let shop = sortedShops.find((shop) => row.value === shop.__KEY__);
              return (
                shop && (
                  <div
                    style={{
                      flexDirection: "row",
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "10px",
                      backgroundColor: shop.colorkey,
                      padding: "10px",
                      color: shop.fontColor,
                      fontSize: "15px",
                    }}
                  >
                    <b style={{ fontSize: "20px" }}> {shop.shop}: </b> &nbsp;
                    Units: {row.summaryItems[0].value} | Units Per Week:{" "}
                    {row.summaryItems[2].value} | Employees:{" "}
                    {row.summaryItems[1].value}
                  </div>
                )
              );
            }}
          >
            <Lookup
              dataSource={sortedShops}
              valueExpr="__KEY__"
              displayExpr="shop"
            />
          </Column>


          <Column
            fixed
            dataField='jobNumber'
            dataType='string'
            caption='Job Number'
            alignment='center'
            allowSorting
            calculateDisplayValue={(row) => {
              if (!row.booked) {
                return "Book in 90 Days";
              }
              return row.jobNumber;
            }}
          ></Column>

          <Column
            dataField='jobName'
            fixed
            minWidth={"250px"}
            caption='Job Name & Wall Type'
            cellRender={jobWallCell}
          />

          <Column
            dataField='start'
            caption='Shop Start Date'
            alignment='center'
            fixed
            defaultSortOrder="asc"
            allowSorting
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
            fixed
            dataField='fieldStart'
            caption='Field Start'
            alignment='center'
          />
          <Column fixed dataField='units' caption='# Units' alignment='center' />
          <Column
            fixed
            dataField='unitsPerWeek'
            dataType='number'
            caption='Units/Week'
            alignment='center'
            calculateCellValue={(row) => {
              if (row.stickwall) {
                return 0;
              }
              return row.unitsPerWeek;
            }}
          >
          </Column>

          <Column
            dataField='end'
            dataType='date'
            caption='End Date'
            alignment='center'
            allowEditing={false}
            visible={false}
            calculateCellValue={(row) => {
              if (row.weeks != null && row.start != null) {
                row.end = addDays(row.start, row.weeks);
              }
              return row.end;
            }}
          ></Column>

          <Column
            dataField='metalTakeoff'
            dataType='date'
            allowEditing={false}
            visible={false}
            calculateCellValue={(row) => {
              if (row.start != null && row.weeksToGoBack >= 0) {
                row.metalTakeoff = addDays(row.start, -row.weeksToGoBack);
              }
              return row.metalTakeoff;
            }}
          ></Column>

          <Column
            dataField='weeks'
            visible={false}
            allowEditing={false}
            calculateCellValue={(row) => {
              if (!row.stickwall && row.unitsPerWeek > 0) {
                row.weeks = Math.ceil(row.units / row.unitsPerWeek);
              }
              return row.weeks;
            }}
          ></Column>

          {
            columnsX
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
                          width={40}
                          alignment='center'
                          dataType='number'
                          allowEditing={false}
                          headerFullDate={innerCol.date}
                        />
                      )
                    })
                    }
                  </Column>
                )
              })
          }

          <Summary>
            <GroupItem
              column='units'
              summaryType='sum'
              customizeText={(data) => {
                return `Total Units: ` + data.value;
              }}
            />
            <GroupItem
              column='emps'
              summaryType='sum'
              customizeText={(data) => {
                return `Total Emps: ` + data.value;
              }}
            />
            <GroupItem
              column='unitsPerWeek'
              summaryType='sum'
              customizeText={(data) => {
                return `Total Units/Week: ` + data.value;
              }}
            />

            <TotalItem column='units' summaryType='sum' />
            <TotalItem column='unitsPerWeek' summaryType='sum' />
            <TotalItem column='employees' summaryType='sum' />
            {columns.map((col, i) => (
              <TotalItem
                key={i}
                column={col.offset.toString()}
                summaryType='sum'
                customizeText={(item) => item.value}
              />
            ))}
          </Summary>

        </DataGrid>
      }

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
    </div >
  );
};

export default ProductionScheduleGantt;
