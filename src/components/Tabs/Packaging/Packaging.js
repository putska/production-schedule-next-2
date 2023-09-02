import React, { useState, useEffect, useRef } from "react";
import DataGrid, {
  Column,
  Grouping,
  LoadPanel,
  SearchPanel,
  Summary,
  TotalItem,
  Sorting,
  Editing,
  Button,
  RequiredRule,
  Lookup,
  Scrolling,
  Pager,
  Export,
} from "devextreme-react/data-grid";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Grid from "@mui/material/Grid";

import {
  month,
  toMondayDate,
  addDays,
  toWeeks,
  toOffset,
  getMondays,
  convertToDate,
  convertDates

} from "@/lib/helper-functions";

const Packaging = (props) => {
  const {
    jobs,
    jobsites,
    packagings,
    settings,
    columns,
    columnsX,
    handleUpdate,
    handleDelete,
    handleAdd,
    canEdit,
  } = props;

  const [expanded, setExpanded] = useState(true);
  const [packagingData, setPackagingData] = useState([]);
  //const [prevColumns, setPrevColumns] = useState([]);
  const [prevTotal, setPrevTotal] = useState(0);
  const [totalPacks, setTotalPacks] = useState(0);
  const [totalPacksAvail, setTotalPacksAvail] = useState(0);
  const dataGridRef = useRef(null);

  useEffect(() => {
    const startOffset = toWeeks(jobs[0].start, new Date());
    let tempJobs = convertDates(jobs);

    const newJobs = tempJobs.filter(
      (job) => !job.wallType.toLowerCase().includes('stick')
    );

    setPackagingData(newJobs);

    let total = 0;

    //get field offset packs
    packagings.forEach((row) => {
      let jobIndex = newJobs.findIndex((j) => j.jobName === row.jobName);
      if (jobIndex !== -1 && row.offsetFromField !== 0) {
        let fieldOffset = toWeeks(jobs[0].start, newJobs[jobIndex].fieldStart)
        newJobs[jobIndex][(fieldOffset + row.offsetFromField).toString()] =
          row.numberOfPacks;
      }
    });

    //get shop offset packs
    packagings.forEach((row) => {
      let jobIndex = newJobs.findIndex((j) => j.jobName === row.jobName);
      if (jobIndex !== -1 && row.offsetFromShop !== 0) {
        let shopOffset = toWeeks(jobs[0].start, newJobs[jobIndex].start)
        //check if there are already packs on this date from the field and include in calc
        let fieldPacksSameDate = (newJobs[jobIndex][(shopOffset + row.offsetFromShop).toString()]) ? newJobs[jobIndex][(shopOffset + row.offsetFromShop).toString()] : 0;
        newJobs[jobIndex][(shopOffset + row.offsetFromShop).toString()] =
          row.numberOfPacks + fieldPacksSameDate;
      }
    });


    packagings.forEach((row) => {
      total += (parseInt(row.numberOfPacks) > 0) ? parseInt(row.numberOfPacks) : 0;
    });

    //get previous weeks total
    let totalPrev = 0;

    packagings.forEach((row) => {
      let jobIndex = newJobs.findIndex((j) => j.jobName === row.jobName);
      if (jobIndex !== -1) {
        let jobShopOffset = toWeeks(jobs[0].start, newJobs[jobIndex].start)
        let jobFieldOffset = toWeeks(jobs[0].start, newJobs[jobIndex].fieldStart)

        if ((jobShopOffset + row.offsetFromShop) < startOffset && row.offsetFromShop !== 0) {
          totalPrev += (row.numberOfPacks < 0) ? Math.abs(parseInt(row.numberOfPacks)) * -1 : parseInt(row.numberOfPacks);
        }
        if ((jobFieldOffset + row.offsetFromField) < startOffset && row.offsetFromField !== 0) {
          totalPrev += (row.numberOfPacks < 0) ? Math.abs(parseInt(row.numberOfPacks)) * -1 : parseInt(row.numberOfPacks);
        }
      }
    });

    //sort by shopoffset then field asc
    if (packagings.length > 0) {
      packagings.sort(function (a, b) {
        function value(el) {
          var x = el;;
          return x === 0 ? Infinity : x;
        }
        return value(a.offsetFromShop) - value(b.offsetFromShop);
      });
    }

    setTotalPacks(total);
    setPrevTotal(totalPrev);

    if (settings.length !== 0) {
      setTotalPacksAvail(settings.Data.packaging[0].numOfpacks);
    }
  }, [packagings, jobs]);

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
    if (cell.data && cell.rowType === "data") {
      let isDate = typeof cell.data[cell.column.dataField] === "number";

      if (isDate) {
        cell.cellElement.style.backgroundColor = "#1976d2";
        cell.cellElement.style.color = "white";
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
      if (cell.column.headerFullDate === toMondayDate(new Date()).toLocaleDateString() && !isDate) {
        cell.cellElement.style.backgroundColor = "#c2eafc"
      }

      //field start border red
      if (
        cell.column.headerFullDate ===
        toMondayDate(cell.data.fieldStart).toLocaleDateString()
      ) {
        cell.cellElement.style.borderLeft = "solid red 5px";
      }

      //shop start border green
      if (
        cell.column.headerFullDate ===
        toMondayDate(cell.data.start).toLocaleDateString()
      ) {
        cell.cellElement.style.borderLeft = "solid green 5px";
      }
    }
  };

  const calculateAccumulatingRow = (options) => {
    let accumulatingTotal = prevTotal;

    if (options.component) {
      if (options.component.pageCount > 0) {
        accumulatingTotal = prevTotal;
      }
    }

    if (options.name === 'customSummmary') {
      if (options.summaryProcess === 'start') {
        options.totalValue = 0;
      } else if (options.summaryProcess === 'calculate') {
        accumulatingTotal = (options.value < 0) ? accumulatingTotal + (Math.abs(options.value) * -1) : accumulatingTotal + (options.value);
        options.totalValue = (accumulatingTotal + totalPacksAvail);

      } else if (options.summaryProcess === 'finalize') {
        accumulatingTotal = prevTotal;

      }
    }
  }

  const handlePageChange = (e) => {
    const pageCount = e.component.pageCount();
    console.log(pageCount);
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
                  checked={expanded}
                  onChange={() => setExpanded(!expanded)}
                />
                <label htmlFor='expand'>Expand All</label>
              </Grid>

              <Grid item style={{ marginTop: "20px" }}>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls='panel1a-content'
                    id='panel1a-header'
                  >
                    <Typography>Edit Jobsites</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <DataGrid
                      dataSource={settings.Data.packaging}
                      showRowLines
                      showBorders
                      allowColumnResizing
                      columnAutoWidth
                      highlightChanges
                      repaintChangesOnly
                      //twoWayBindingEnabled
                      wordWrapEnabled
                      autoExpandAll
                      onRowUpdated={(e) => updateHandler(e, "settings")}
                      onRowInserted={(e) => addHandler(e, "jobsite")}
                      onRowRemoved={(e) => deleteHandler(e, "jobsite")}
                    >
                      <Editing
                        mode='cell'
                        allowUpdating={canEdit}
                        allowDeleting={canEdit}
                        allowAdding={canEdit}
                        useIcons
                      />

                      <Column type='buttons'>
                        <Button name='delete' />
                      </Column>

                      <Column
                        dataField='numOfpacks'
                        caption='# 0f packs'
                        alignment='left'
                      />

                    </DataGrid>
                  </AccordionDetails>
                  <AccordionDetails>
                    <DataGrid
                      dataSource={jobsites}
                      showRowLines
                      showBorders
                      allowColumnResizing
                      columnAutoWidth
                      highlightChanges
                      repaintChangesOnly
                      //twoWayBindingEnabled
                      wordWrapEnabled
                      autoExpandAll
                      onRowUpdated={(e) => updateHandler(e, "jobsite")}
                      onRowInserted={(e) => addHandler(e, "jobsite")}
                      onRowRemoved={(e) => deleteHandler(e, "jobsite")}
                    >
                      <Editing
                        mode='cell'
                        allowUpdating={canEdit}
                        allowDeleting={canEdit}
                        allowAdding={canEdit}
                        useIcons
                      />

                      <Column type='buttons'>
                        <Button name='delete' />
                      </Column>

                      <Column
                        dataField='jobsite'
                        caption='Jobsite'
                        alignment='left'
                      />

                    </DataGrid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              <Grid item>
                <DataGrid
                  dataSource={packagings}
                  showRowLines
                  showBorders
                  allowColumnResizing
                  columnAutoWidth
                  highlightChanges
                  repaintChangesOnly
                  //twoWayBindingEnabled
                  wordWrapEnabled
                  autoExpandAll
                  onRowUpdated={(e) => updateHandler(e, "field")}
                  onRowInserted={(e) => addHandler(e, "field")}
                  onRowRemoved={(e) => deleteHandler(e, "field")}

                >
                  <Export enabled={true} />

                  <Pager
                    visible={true}
                    displayMode='compact'
                    showPageSizeSelector={true}
                    pageCount='200'
                  />
                  <Editing
                    mode='cell'
                    allowUpdating={canEdit}
                    allowDeleting={canEdit}
                    allowAdding={canEdit}
                    useIcons
                  />

                  <Grouping autoExpandAll={expanded} />
                  {/* <Scrolling mode='infinite' /> */}
                  <Column type='buttons'>
                    <Button name='delete' />
                  </Column>

                  <Column
                    dataField='jobsiteGroup'
                    caption='Jobsite'
                    alignment='left'
                    groupIndex={0}
                    calculateGroupValue='jobsite'
                  />
                  <Column
                    dataField='jobNameGroup'
                    caption='Job'
                    alignment='left'
                    width={300}
                    groupIndex={1}
                    calculateGroupValue='jobName'
                  />

                  <Column
                    dataField='jobsite'
                    caption='Jobsite'
                    alignment='left'
                    calculateGroupValue='jobsite'
                    minWidth={250}
                  >
                    <Lookup
                      dataSource={jobsites}
                      displayExpr='jobsite'
                      valueExpr='jobsite'
                    />
                    <RequiredRule />
                  </Column>
                  <Column
                    dataField='jobName'
                    caption='Job'
                    alignment='left'
                    minWidth={250}
                    calculateGroupValue='jobName'
                  >
                    <Lookup
                      dataSource={jobs}
                      displayExpr='jobName'
                      valueExpr='jobName'
                    />
                    <RequiredRule />
                  </Column>
                  <Column
                    dataField='start'
                    caption='Shop Start'
                    dataType='date'
                    alignment='center'
                    defaultSortOrder='asc'
                    allowEditing={false}
                    calculateDisplayValue={(row) => {
                      let job = jobs.find((job) => job.jobName === row.jobName);
                      return job && job.start;
                    }}
                  ></Column>

                  <Column
                    dataField='offsetFromShop'
                    caption='Offset From Shop Start'
                    dataType='number'
                    alignment='center'
                  >
                    <RequiredRule />
                  </Column>
                  <Column
                    dataField='fieldStart'
                    caption='Field Start'
                    dataType='date'
                    alignment='center'
                    defaultSortOrder='asc'
                    allowEditing={false}
                    calculateDisplayValue={(row) => {
                      let job = jobs.find((job) => job.jobName === row.jobName);
                      return job && job.fieldStart;
                    }}
                  ></Column>

                  <Column
                    dataField='offsetFromField'
                    caption='Offset From Field Start'
                    dataType='number'
                    alignment='center'
                  >
                    <RequiredRule />
                  </Column>

                  <Column
                    dataField='numberOfPacks'
                    caption='Number of Packs'
                    dataType='number'
                    alignment='center'
                  >
                    <RequiredRule />
                  </Column>
                </DataGrid>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      <DataGrid
        ref={dataGridRef}
        height={880}
        dataSource={packagingData}
        showRowLines
        columnAutoWidth
        autoExpandAll
        highlightChanges
        repaintChangesOnly
        wordWrapEnabled
        showColumnLines={true}
        onCellPrepared={cellPrepared}
        onPagingChange={handlePageChange}
      >
        <Export enabled={true} />
        <SearchPanel visible highlightCaseSensitive={false} />
        <Grouping autoExpandAll={expanded} />
        <Scrolling mode='infinite' />
        <Sorting mode='multiple' />
        <LoadPanel enabled showIndicator />

        <Column
          fixed
          allowSorting
          dataField='jobNumber'
          caption='Job Number'
          alignment='center'
        />
        <Column
          fixed
          minWidth={"250px"}
          dataField='jobName'
          caption='Job Name & Wall Type'
          cellRender={jobWallCell}
          alignment='left'
        />

        <Column
          fixed
          allowSorting
          dataField='start'
          caption='Shop Start Date'
          alignment='center'
          dataType="date"
        />

        <Column
          fixed
          dataField='fieldStart'
          caption='Field Start'
          alignment='center'
          defaultSortOrder='asc'
          dataType="date"
        />



        <Column
          fixed
          dataField='packs'
          caption='Total # of Packs'
          alignment='center'
          allowEditing={false}
          calculateDisplayValue={(row) => {
            let cols = columns
              .filter((col) => row[col.offset.toString()])
              .map((col) => row[col.offset.toString()]);

            const initialValue = 0;
            const rowTotal =
              cols.length > 0 ? cols.reduce((total, col) => total + ((Number(col) > 0) ? Number(col) : 0), initialValue) : 0;
            return rowTotal;
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
                  width={40}
                  alignment='center'
                  dataType='number'
                  allowEditing={false}
                  headerFullDate={innerCol.date}
                />
              ))}
            </Column>
          );
        })}
        <Summary recalculateWhileEditing calculateCustomSummary={calculateAccumulatingRow}>
          <TotalItem
            column='packs'
            summaryType='sum'
            customizeText={(item) => `Total : ${totalPacks}`}
          />

          {columns.map((oldCol, i) => (
            <TotalItem
              key={i}
              column={oldCol.offset.toString()}
              //use custom summary to accumulate the totals along the bottom
              name="customSummmary"
              summaryType='custom'
              customizeText={(item) => ((item.value) ? item.value : '')}
            />
          ))}
        </Summary>
      </DataGrid>
    </div>
  );
};

export default Packaging;
