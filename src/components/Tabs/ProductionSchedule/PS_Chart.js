import React, { useState, useEffect } from "react";
import { 
  DataGrid, 
  Column, 
  Grouping, 
  SearchPanel, 
  Editing, 
  Summary, 
  TotalItem, 
  GroupItem, 
  Button, 
  SortByGroupSummaryInfo, 
  LoadPanel, 
  Lookup, 
  RequiredRule, 
  Pager, 
  Export, 
  Paging 
} from "devextreme-react/data-grid";
import ColorBox from "devextreme-react/color-box";
import { Accordion, AccordionSummary, AccordionDetails, Typography, Grid } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";

const ProductionScheduleChart = (props) => {
  const {
    handleUpdate,
    handleAdd,
    handleDelete,
    addDays,
    canEdit,
    jobs,
    shops,
    toWeeks,
  } = props;
  const [expanded, setExpanded] = useState(true);

  const renderRow = (row) => {
    if (row.rowType === "data") {
      if (!row.data.booked) {
        row.rowElement.style.backgroundColor = "cyan";
      } else if (row.data.booked && row.data.engineering) {
        row.rowElement.style.backgroundColor = "#edada6";
      }
    } else if (row.rowType === "group") {
      let colorEntry = shops.find((shop) => shop.shop === row.data.key);
      row.rowElement.style.backgroundColor = colorEntry
        ? colorEntry.colorkey
        : "white";
      row.rowElement.style.color = colorEntry ? colorEntry.fontColor : "black";
    }
  };

  const cellPrepared = (cell) => {
    if (
      cell.rowType === "data" &&
      !cell.data.stickwall &&
      (cell.column.dataField === "weeks" ||
        cell.column.dataField === "offset" ||
        cell.column.dataField === "end")
    ) {
      cell.cellElement.style.backgroundColor = "#c2c4c4";
    } else if (
      cell.rowType === "data" &&
      cell.data.stickwall &&
      ["end", "offset", "units", "unitsPerWeek"].includes(cell.column.dataField)
    ) {
      cell.cellElement.style.backgroundColor = "#c2c4c4";
      cell.text = "";
    }
  };

  const editingStart = (cell) => {
    // if (
    //   cell.data.stickwall &&
    //   ["end", "offset", "units", "unitsPerWeek"].includes(cell.column.dataField)
    // ) {
    //   cell.cancel = true;
    // } else if (
    //   !cell.data.stickwall &&
    //   ["end", "offset", "weeks"].includes(cell.column.dataField)
    // ) {
    //   cell.cancel = true;
    // } else {
    //   cell.cancel = false;
    // }
  };

  const updateShopHandler = async (e) => {
    try {
      const res = await axios.get(
        `/desktopmodules/ww_Global/API/PSDev/GetShop?ID=${e.oldData.ID}`
      );

      const data = { ...res.data, ...e.newData };

      e.component.beginCustomLoading();
      await handleUpdate("/PutShop", data);
      e.component.endCustomLoading();
    } catch (error) {
      console.error(error);
      e.component.endCustomLoading();
    }
  };

  const updateJobHandler = async (e) => {
    try {
      const res = await axios.get(
        `/desktopmodules/ww_Global/API/PSDev/GetJob?ID=${e.oldData.ID}`
      );

      const data = { ...res.data, ...e.newData };

      let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

      if(data.start.toLocaleString('en-US', options) !== res.data.start.toLocaleString('en-US', options)){    
        data.weeksToGoBack = toWeeks(data.metalTakeoff, data.start.toLocaleString('en-US', options));
      }
      else {

        data.end = addDays(data.start, data.weeks);
        data.metalStart = addDays(data.start, -data.weeksToGoBack);
  
        let metalTakeoff = addDays(data.start, -data.weeksToGoBack*7);

        let jobMetalTakeoff = jobs.filter(job => job.metalTakeoff);
        let foundOnSameDate = jobMetalTakeoff.find(function (job) {
          return (job.JobName !== data.JobName) && job.metalTakeoff.toLocaleString('en-US', options) === props.toMondayDate(metalTakeoff).toLocaleString('en-US', options);
        });
        
        data.weeksToGoBack = (foundOnSameDate) ? data.weeksToGoBack + 1 : data.weeksToGoBack;
        data.metalTakeoff =  (foundOnSameDate) ? addDays(props.toMondayDate(data.start), (data.weeksToGoBack + 1) * -7) : metalTakeoff;
        
      };

      e.component.beginCustomLoading();
      await handleUpdate("/PutJob", data);
      e.component.endCustomLoading();
    } catch (error) {
      console.error(error);
      e.component.endCustomLoading();
    }
  };

  const addShopHandler = async (e) => {
    e.component.beginCustomLoading();

    await handleAdd("shop", e.data);

    e.component.endCustomLoading();
  };

  const addJobHandler = async (e) => {
    e.data.end = addDays(new Date(e.data.start), e.data.weeks);
    e.data.metalStart = addDays(e.data.start, -e.data.weeksToGoBack);
    //cannot be 2 overlapping dates for metalTakeoff
    let metalTakeoff = addDays(e.data.start, -e.data.weeksToGoBack*7);
    let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    let jobMetalTakeoff = jobs.filter(job => job.metalTakeoff);
    let foundOnSameDate = jobMetalTakeoff.find(function (job) {
      return job.metalTakeoff.toLocaleString('en-US', options) === props.toMondayDate(metalTakeoff).toLocaleString('en-US', options);
    });
    
    //let foundOnSameDate = jobMetalTakeoff.find(job => (props.toMondayDate(job.metalTakeoff).toLocaleString('en-US', options) === metalTakeoff.toLocaleString('en-US', options)));
    e.data.weeksToGoBack = (foundOnSameDate) ? e.data.weeksToGoBack + 1 : e.data.weeksToGoBack;
    e.data.metalTakeoff =  (foundOnSameDate) ? addDays(props.toMondayDate(e.data.start), (e.data.weeksToGoBack + 1) * -7) : metalTakeoff;

    e.component.beginCustomLoading();

    await handleAdd("job", e.data);

    e.component.endCustomLoading();
  };

  const deleteShopHandler = async (e) => {
    const deleteJobs = jobs.filter((job) => job.groupKey === e.data.__KEY__);

    e.component.beginCustomLoading();

    //delete jobs attached to shop
    for (const job of deleteJobs) {
      await handleDelete("job", job);
    }

    await handleDelete("shop", e.data);

    e.component.endCustomLoading();
  };

  const deleteJobHandler = async (e) => {
    e.component.beginCustomLoading();

    await handleDelete("job", e.data);

    e.component.endCustomLoading();
  };

  const onShopRowInit = (row) => {
    row.data.shop = "";
    row.data.fontColor = "#000";
    row.data.colorkey = "#fff";
    row.data.index = shops.length;
  };

  const onRowInit = (row) => {
    row.data.groupIndex = shops.length;
    row.data.jobName = "";
    row.data.wallType = "";
    row.data.units = 0;
    row.data.unitsPerWeek = 0;
    row.data.emps = 0;
    row.data.weeks = 0;
    row.data.weeksToGoBack = 14;
  };

  return (
    <div>
      <input
        type='checkbox'
        style={{ width: "30px" }}
        id='expand'
        name='expand'
        value={expanded}
        onChange={() => setExpanded(!expanded)}
      />
      <label htmlFor='expand'>Collapse All</label>c
      {canEdit && (
        <Accordion>
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
                  dataSource={shops}
                  showRowLines
                  showBorders
                  allowColumnResizing
                  columnAutoWidth
                  highlightChanges
                  repaintChangesOnly
                  // twoWayBindingEnabled
                  columnResizingMode='widget'
                  wordWrapEnabled
                  autoExpandAll
                  cellHintEnabled
                  onInitNewRow={onShopRowInit}
                  // onRowInserted={addShopHandler}
                  // onRowRemoved={deleteShopHandler}
                  onRowUpdating={updateShopHandler}
                >
                  <Editing
                    mode='cell'
                    allowUpdating={canEdit}
                    allowAdding={canEdit}
                    allowDeleting={canEdit}
                    useIcons
                  />
                  {/* 
                  <RowDragging
                    allowReordering
                    onReorder={onShopReorder}
                    showDragIcons
                  /> */}

                  <Column type='buttons'>
                    <Button name='delete' />
                  </Column>

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
                          onValueChange={(color) => {
                            cell.setValue(color);
                            //handleUpdate({ ...data, shops: shops });
                          }}
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
                            //handleUpdate({ ...data, shops: shops });
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
        height={880}
        dataSource={jobs}
        keyExpr={"__KEY__"}
        showRowLines
        showBorders
        columnAutoWidth
        highlightChanges
        repaintChangesOnly
        onRowPrepared={renderRow}
        allowColumnResizing
        wordWrapEnabled
        autoExpandAll
        activeStateEnabled
        onInitNewRow={onRowInit}
        onCellPrepared={cellPrepared}
        onEditingStart={editingStart}
        onRowInserted={addJobHandler}
        onRowRemoved={deleteJobHandler}
        onRowUpdating={updateJobHandler}
      >
        <SearchPanel visible highlightCaseSensitive={false} />
        <Grouping autoExpandAll={expanded} />
        <LoadPanel enabled showIndicator />
        <Export enabled={true} />
        <Pager
          visible={true}
          displayMode='compact'
          showPageSizeSelector={true}
          allowedPageSizes={[40, 80, 160, 300]}
        />
        <Paging defaultPageSize={40} />
        <Editing
          mode='form'
          allowUpdating={canEdit}
          allowDeleting={canEdit}
          allowAdding={canEdit}
          useIcons
          allowSorting
        />

        <Column type='buttons'>
          <Button name='edit' />
          <Button name='delete' />
        </Column>

        <Column
          dataField='shop'
          groupIndex={0}
          dataType='string'
          allowSorting={false}
          calculateGroupValue='groupKey'
          groupCellRender={(row) => {
            const shop = shops.find((shop) => row.value === shop.__KEY__);
            return (
              shop && (
                <div
                  style={{
                    borderRadius: "10px",
                    backgroundColor: shop.colorkey,
                    padding: "15px",
                    color: shop.fontColor,
                  }}
                >
                  <p style={{ fontSize: "20px" }}>{shop.shop}</p>{" "}
                  <p style={{ fontSize: "15px" }}>
                    Units: {row.summaryItems[0].value} | Units Per Week:{" "}
                    {row.summaryItems[2].value} | Employees:{" "}
                    {row.summaryItems[1].value}
                  </p>
                </div>
              )
            );
          }}
        />

        <Column dataField='groupKey' caption='Shop' minWidth={100}>
          <Lookup dataSource={shops} displayExpr='shop' valueExpr='__KEY__' />
        </Column>

        <Column dataField='booked' alignment='center' dataType='boolean' />

        <Column
          dataField='engineering'
          caption='Engineering Release?'
          alignment='center'
          dataType='boolean'
        />

        <Column dataField='stickwall' alignment='center' dataType='boolean' />

        <Column
          dataField='reserved'
          caption='Reserved?'
          alignment='center'
          dataType='boolean'
        />

        <Column
          dataField='jobNumber'
          dataType='string'
          caption='Job Number'
          alignment='center'
          calculateDisplayValue={(row) => {
            if (!row.booked) {
              return "Book in 90 Days";
            }
            return row.jobNumber;
          }}
        ></Column>
        <Column
          dataField='jobName'
          dataType='string'
          caption='Job Name'
          alignment='left'
        >
          <RequiredRule />
        </Column>
        <Column
          dataField='wallType'
          dataType='string'
          caption='Wall Type'
          alignment='left'
        >
          <RequiredRule />
        </Column>
        <Column
          dataField='customer'
          dataType='string'
          caption='Customer'
          alignment='center'
        >
          <RequiredRule />
        </Column>
        <Column
          dataField='unitsPerWeek'
          dataType='number'
          caption='Units/Week'
          alignment='center'
          calculateDisplayValue={(row) => {
            if (row.stickwall) {
              return 0;
            }
            return row.unitsPerWeek;
          }}
        >
          <RequiredRule />
        </Column>
        <Column
          allowSorting
          dataField='start'
          dataType='date'
          caption='Shop Start Date'
          defaultSortOrder='asc'
          alignment='center'
        >
          <RequiredRule />
        </Column>
        <Column
          allowSorting
          dataField='weeksToGoBack'
          dataType='number'
          caption='Weeks To Go Back'
          alignment='center'
        >
          <RequiredRule />
        </Column>
        <Column
          dataField='end'
          dataType='date'
          caption='End Date'
          alignment='center'
          allowEditing={false}
          calculateCellValue={(row) => {
            if (row.weeks) {
              row.end = addDays(row.start, row.weeks);
            }
            return row.end;
          }}
        ></Column>
        <Column
          dataField='fieldStart'
          dataType='date'
          cption='Field Start Date'
          alignment='center'
        >
          <RequiredRule />
        </Column>
        <Column
          dataField='metalTakeoff'
          dataType='date'
          caption='Metal Start'
          alignment='center'
          allowEditing={false}
        ></Column>
        <Column
          dataField='units'
          dataType='number'
          caption='Units'
          alignment='center'
          calculateCellValue={(row) => {
            if (row.stickwall) {
              return 0;
            }
            return row.units;
          }}
        >
          <RequiredRule />
        </Column>
        <Column
          dataField='emps'
          dataType='number'
          caption='Emps'
          alignment='center'
        >
          <RequiredRule />
        </Column>

        <Column
          dataField='weeks'
          caption='Weeks'
          alignment='center'
          calculateCellValue={(row) => {
            if (!row.stickwall && row.unitsPerWeek > 0) {
              row.weeks = Math.ceil(row.units / row.unitsPerWeek);
            }
            return row.weeks;
          }}
        ></Column>

        <Summary recalculateWhileEditing>
          <GroupItem
            column='units'
            summaryType='sum'
            name='shopUnits'
            customizeText={(data) => `Total Units: ` + data.value}
          />
          <GroupItem
            column='emps'
            summaryType='sum'
            name='shopEmps'
            customizeText={(data) => `Total Emps: ` + data.value}
          />
          <GroupItem
            column='unitsPerWeek'
            summaryType='sum'
            name='shopUnitsPerWeek'
            customizeText={(data) => `Total Units/Week: ` + data.value}
          />
          <GroupItem column='groupIndex' summaryType='avg' name='groupIndex' />

          <TotalItem
            column='units'
            summaryType='sum'
            customizeText={(data) =>
              `Total Units: ` + data.value.toLocaleString()
            }
          />
          <TotalItem
            column='unitsPerWeek'
            summaryType='sum'
            customizeText={(data) =>
              `Total Units/Week: ` + data.value.toLocaleString()
            }
          />
          <TotalItem
            column='emps'
            summaryType='sum'
            customizeText={(data) =>
              `Total Emps: ` + data.value.toLocaleString()
            }
          />
        </Summary>

        <SortByGroupSummaryInfo summaryItem='groupIndex' />
      </DataGrid>
    </div>
  );
};

export default ProductionScheduleChart;
