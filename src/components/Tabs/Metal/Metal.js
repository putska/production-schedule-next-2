import React, { useState, useEffect } from "react";
import DataGrid, {
  Column,
  Grouping,
  LoadPanel,
  SearchPanel,
  Summary,
  TotalItem,
  Sorting,
  Scrolling,
  Editing,
  Button,
  RequiredRule,
  Lookup,
  Export,
  Pager,
  Paging
} from "devextreme-react/data-grid";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Grid from "@mui/material/Grid";

import {
  calculateForOffSetsNew,
  month,
  toWeeks,
  toMondayDate,
  addDays,
  convertToDate,
  getMondays,
  convertDates
} from "@/lib/helper-functions"
import { AcUnit } from "@mui/icons-material";

const Metal = (props) => {
  const {
    jobs,
    metals,
    shops,
    columns,
    columnsX,
    handleUpdate,
    handleAdd,
    handleDelete,
    canEdit,
  } = props;
  const [metalData, setMetalData] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let newJobs = convertDates(jobs);

    jobs.forEach(job => {
      const index = newJobs.findIndex((j) => j.ID === job.ID);
      const startOffset = toWeeks(jobs[0].start, job.start)
      job.offset = startOffset;

      columns.forEach(innerCol => {
        let isDate =
          parseInt(innerCol.offset) >= startOffset &&
          parseInt(innerCol.offset) < startOffset + job.weeks;

        if (isDate) {
          const thisWeek = innerCol.offset - startOffset + 1;
          let displayUnits = {
            lbs: job.lbs,
            actuallbs: 0
          }

          if (thisWeek == job.weeks) {
            const remainderUnits = job.lbs > 0 ? job.units % job.lbs : 0;
            displayUnits = {
              lbs: remainderUnits != 0 ? remainderUnits : job.lbs,
              actuallbs: 0
            }
          }

          newJobs[index][innerCol.offset.toString()] = displayUnits;
        }
      })
    })

    setMetalData(newJobs);
  }, [jobs, metals]);

  const calculateUnitTotals = (options) => {
      columns.map((col, i) => {
        if (options.name === `UnitSummary_${col.offset}`) {
          if (options.summaryProcess === 'start') {
            options.totalValue = 0;
          } else if (options.summaryProcess === 'calculate' && options.value[col.offset.toString()]) {
            options.totalValue += options.value[col.offset.toString()].lbs;
          }
        }
      })

      if (options.name === `lbsSummary`) {
        if (options.summaryProcess === 'start') {
          options.totalValue = 0;
        } else if (options.summaryProcess === 'calculate') {
          options.totalValue += options.value.lbs;
        }
      }
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
        ? shops.find((shop) => shop.__KEY__ === cell.data.groupKey)
        : "";
    let headerColor =
      cell.rowType === "data" && colorEntry ? colorEntry.colorkey : "white";

    if (cell.data && cell.rowType === "data") {
      let offset = toWeeks(jobs[0].start, cell.data.start);
      cell.data.offset = offset;

      let isDate =
        parseInt(cell.column.dataField) >= offset &&
        parseInt(cell.column.dataField) < offset + cell.data.weeks;

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

  const onRowPrepared = (e) => {
    if (e.rowType !== "data") return;
    if (e.data.reserved === true) {
      e.rowElement.style.color = "red";
    }
  };

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
    <div style={{ margin: "3vw" }}>
      {canEdit && (
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls='panel1a-content'
            id='panel1a-header'
          >
            <Typography>Adjust Columns</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container direction='column'>
              <Grid item>
                <input
                  type='checkbox'
                  style={{ width: "30px" }}
                  id='expand'
                  name='expand'
                  value={expanded}
                  onChange={() => setExpanded(!expanded)}
                />
                <label htmlFor='expand'>Expand All</label>
              </Grid>
              <Grid item>
                <DataGrid
                  dataSource={metals}
                  showRowLines
                  showBorders
                  allowColumnResizing
                  columnAutoWidth
                  highlightChanges
                  repaintChangesOnly
                  // twoWayBindingEnabled
                  wordWrapEnabled
                  autoExpandAll
                  onRowUpdated={(e) => updateHandler(e, "metal")}
                  onRowInserted={(e) => addHandler(e, "metal")}
                  onRowRemoved={(e) => deleteHandler(e, "metal")}
                >
                  <Editing
                    mode='cell'
                    allowUpdating={canEdit}
                    allowDeleting={canEdit}
                    allowAdding={canEdit}
                    useIcons
                  />

                  <Grouping autoExpandAll={expanded} />
                  <LoadPanel enabled showIndicator />

                  <Column type='buttons'>
                    <Button name='delete' />
                  </Column>

                  <Column
                    dataField='job'
                    groupIndex={0}
                    calculateGroupValue='jobName'
                    groupCellRender={(row) => {
                      return (
                        <div style={{ fontSize: "15px" }}>{row.value}</div>
                      );
                    }}
                  />
                  <Column
                    dataField='jobName'
                    caption='Job'
                    alignment='left'
                    width={300}
                  >
                    <Lookup
                      dataSource={jobs}
                      displayExpr='jobName'
                      valueExpr='jobName'
                    />
                  </Column>
                  <Column
                    dataField='weekStart'
                    caption='Week'
                    dataType='date'
                    alignment='center'
                    defaultSortOrder='asc'
                  >
                    <RequiredRule />
                  </Column>

                  <Column
                    dataField='lbs'
                    caption='lbs for Week'
                    dataType='number'
                    alignment='center'
                  />
                </DataGrid>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      <DataGrid
        height="80vh"
        dataSource={metalData}
        showRowLines
        columnAutoWidth
        autoExpandAll
        highlightChanges
        repaintChangesOnly
        // twoWayBindingEnabled
        columnResizingMode='widget'
        wordWrapEnabled
        showColumnLines={true}
        onCellPrepared={cellPrepared}
        onRowPrepared={onRowPrepared}
      >
        <SearchPanel visible highlightCaseSensitive={false} />
        <Grouping autoExpandAll={expanded} />
        <Sorting mode='multiple' />
        <Scrolling mode='infinite' />
        {/* <Pager
          visible={true}
          displayMode='compact'
          showPageSizeSelector={true}
          allowedPageSizes={[40, 80, 160, 300]}
        /> */}

        <Paging defaultPageSize={40} />
        <LoadPanel enabled showIndicator />
        <Editing mode='cell' allowUpdating={true} useIcons />
        <Export enabled={true} />

        <Column
          fixed
          allowSorting
          dataField='jobNumber'
          caption='Job Number'
          alignment='center'
          allowEditing={false}
        />
        <Column
          fixed
          minWidth={"250px"}
          dataField='jobName'
          caption='Job Name & Wall Type'
          cellRender={jobWallCell}
          alignment='left'
          allowEditing={false}
        />
        <Column
          fixed
          allowSorting
          dataField='start'
          caption='Shop Start Date'
          alignment='center'
          defaultSortOrder='asc'
          allowEditing={false}
        />
        <Column
          fixed
          dataField='fieldStart'
          caption='Field Start'
          alignment='center'
          allowEditing={false}
        />
        <Column
          fixed
          dataField='reserved'
          caption='Reserved?'
          alignment='center'
          dataType='boolean'
          calculateDisplayValue={(row) => (row.reserved ? row.reserved : false)}
        />
        <Column
          fixed
          dataField='lbs'
          caption='lbs'
          alignment='center'
          allowEditing={false}
          cellRender={(cell) => {
            let plannedTotalCols = columns
              .filter((oldCol) => cell.data[oldCol.offset.toString()])
              .map((oldCol) => cell.data[oldCol.offset.toString()].lbs)

            let plannedTotal = plannedTotalCols.length > 0
              ? plannedTotalCols.reduce((total, oldCol) => total + oldCol)
              : 0

            let actualTotalCols = columns
              .filter((oldCol) => cell.data[oldCol.offset.toString()])
              .map((oldCol) => cell.data[oldCol.offset.toString()].actuallbs)

            let actualTotal = actualTotalCols.length > 0
              ? actualTotalCols.reduce((total, oldCol) => total + oldCol)
              : 0

            return (
              <div style={{ width: "40px" }} >
                <div style={{ color: "blue" }}>{plannedTotal}</div>
                <div style={{ color: "black" }}>{actualTotal}</div>
              </div>
            );
          }}
        />

        {columnsX.map((col, i) => {
          return (
            <Column caption={col.month} alignment='center' key={i}>
              {col.innerColsX.map((innerCol, k) => (
                <Column
                  key={k}
                  dataField={innerCol.offset.toString()}
                  caption={innerCol.date.substring(
                    innerCol.date.indexOf("/") + 1,
                    innerCol.date.length - 5
                  )}
                  minWidth={40}
                  alignment='center'
                  dataType='number'
                  headerFullDate={innerCol.date}
                  cellRender={cell => {
                    const col = cell.column.dataField;
                    const isDate = cell.data[col] != null;
                    return (
                      <div>
                        <div style={{ color: "blue" }}>{isDate ? cell.data[col].lbs : ""}</div>
                        <div style={{ color: "black" }}>{isDate && cell.data[col].actuallbs > 0 ? cell.data[col].actuallbs : ""}</div>
                      </div>
                    )
                  }}
                  editCellRender={cell => {
                    const colData = cell.data[cell.column.dataField];
                    const isDate = cell.data[cell.column.dataField] != null;

                    const handleChange = (key, value) => {
                      if (isDate) {
                        cell.setValue({ ...colData, [key]: parseInt(value) })
                      }
                    }

                    return (
                      <div style={{ width: "40px" }} >
                        <input
                          placeholder="planned"
                          style={{ padding: "10px", color: "blue" }}
                          defaultValue={colData ? colData.lbs : ""}
                          onChange={(e) => handleChange("lbs", e.target.value)}
                        />
                        <input
                          placeholder="actual"
                          style={{ padding: "10px", color: "black" }}
                          defaultValue={colData ? colData.actuallbs : ""}
                          onChange={(e) => handleChange("actuallbs", e.target.value)}
                        />
                      </div>
                    )
                  }}
                />
              ))}
            </Column>
          );
        })}
        <Summary calculateCustomSummary={calculateUnitTotals} recalculateWhileEditing>
          {columns.map((col, i) => (
            <TotalItem
              key={i.toString()}
              name={`UnitSummary_${col.offset}`}
              summaryType="custom"
              displayFormat="{0}"
              showInColumn={col.offset.toString()}
            />
          ))}
          <TotalItem
            name={`lbsSummary`}
            summaryType="custom"
            displayFormat="{0}"
            showInColumn='lbs'
          />
        </Summary>
      </DataGrid>
    </div>
  );
};

export default Metal;
