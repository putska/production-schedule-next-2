import React, { useState, useEffect } from "react";
import DataGrid, {
  Column,
  Grouping,
  GroupPanel,
  SearchPanel,
  Editing,
  Scrolling,
  Button,
  RequiredRule,
  Lookup,
} from "devextreme-react/data-grid";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Grid from "@mui/material/Grid";

import {
  toWeeks,
  toMondayDate,
  addDays,
} from "@/lib/helper-functions";

const FabMatrix = (props) => {
  const {
    jobs,
    fabMatrixs,

    handleUpdate,
    handleAdd,
    handleDelete,

    rows,
    weeks,
    canEdit,
    highlightJobs
  } = props;
  const [expanded, setExpanded] = useState(false);
  const [columns, setColumns] = useState([]);
  const [fabMatrixData, setFabMatrixData] = useState([]);
  ;
  useEffect(() => {
    fabMatrixs.forEach((activity) => {
      activity.start = new Date(activity.start);
      activity.end = new Date(activity.end);
    });

    const createRows = () => {
      let newRows = JSON.parse(JSON.stringify(rows));

      fabMatrixs.forEach((activity) => {
        let startDate = new Date(activity.start);
        let numWeeksForProject = toWeeks(startDate, activity.end);

        let activityDates = [];
        let start = toMondayDate(startDate);

        for (let i = 0; i <= numWeeksForProject; i++) {
          let date = addDays(start, i * 7);
          activityDates.push(date);
        }

        for (let i = 0; i < weeks; i++) {
          activityDates.forEach((date) => {
            if (date.toLocaleDateString() === newRows[i].date) {
              newRows[i][activity.employee] = activity.activity;
            }
          });
        }
      });

      setFabMatrixData(newRows);
    };

    const createColumns = () => {
      let cols = [...new Set(fabMatrixs.map((item) => item.employee))];
      setColumns(cols);
    };

    createColumns();
    createRows();
  }, [addDays, fabMatrixs, rows, toMondayDate, toWeeks, weeks]);

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

  const rowPrepared = (row) => {
    row.rowElement.style.backgroundColor =
      row.dataIndex % 2 ? "#b5bdc9" : "white";
  };

  const startDateRender = (row) => {
    let job = jobs.find((j) => j.__KEY__ === row.data.jobKey);
    row.data.fabOffset = job && toWeeks(job.start, row.data.start);
    return (
      <div>
        {row.data.start && row.data.start.toLocaleDateString()}
        <br />
        {
          <p style={{ color: "#3f50b5" }}>
            {" "}
            {row.data.fabOffset} weeks before shop date{" "}
          </p>
        }
      </div>
    );
  };

  const startDateEdit = (row) => {
    let link = row.data.linkToShopDate;
    return (
      <div>
        {link ? (
          <input
            placeholder='weeks before shop start'
            onChange={(e) => {
              let weeks = e.target.value;
              let job = jobs.find((job) => job.__KEY__ === row.data.jobKey);
              let fabDate = addDays(job.start, weeks * 7);
              row.setValue(fabDate);
            }}
          />
        ) : (
          <input
            type='text'
            placeholder='MM/DD/YYYY'
            onChange={(e) => {
              if (
                new Date(e.target.value) !== "Invalid Date" &&
                !isNaN(new Date(e.target.value))
              ) {
                let d = new Date(e.target.value);
                d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000);
                row.setValue(d);
              }
            }}
          />
        )}
      </div>
    );
  };

  const rowInit = (row) => {
    row.data.start = new Date();
    row.data.weeksBeforeStart = 6;
    row.data.linkToShopDate = false;
  };

  const renderGridCell = (data) => {
    const isHighlight = highlightJobs.find(hjobs => hjobs.jobName === data.data[data.column.dataField]);
    return <span className={isHighlight && "highlighted"}>{data.data[data.column.dataField]}</span>;
  }

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
                  dataSource={fabMatrixs}
                  showRowLines
                  showBorders
                  allowColumnResizing
                  columnAutoWidth
                  highlightChanges
                  repaintChangesOnly
                  //twoWayBindingEnabled
                  columnResizingMode='widget'
                  wordWrapEnabled
                  autoExpandAll
                  cellHintEnabled
                  onInitNewRow={rowInit}
                  onRowUpdated={(e) => updateHandler(e, "fabMatrix")}
                  onRowInserted={(e) => addHandler(e, "fabMatrix")}
                  onRowRemoved={(e) => deleteHandler(e, "fabMatrix")}
                >
                  <Scrolling mode="infinite" />
                  <Editing
                    mode='cell'
                    allowUpdating={canEdit}
                    allowDeleting={canEdit}
                    allowAdding={canEdit}
                    useIcons
                  />

                  <Grouping autoExpandAll={expanded} />

                  <Column type='buttons'>
                    <Button name='delete' />
                  </Column>

                  <Column
                    dataField='employeeName'
                    groupIndex={0}
                    calculateGroupValue='employee'
                    groupCellRender={(row) => {
                      return (
                        <div
                          style={{
                            flexDirection: "row",
                            display: "flex",
                            alignItems: "center",
                            fontSize: "15px",
                          }}
                        >
                          {row.value}
                        </div>
                      );
                    }}
                  />
                  <Column
                    dataField='employee'
                    caption='Employee'
                    dataType='string'
                    alignment='left'
                  >
                    <RequiredRule />
                  </Column>

                  <Column
                    dataField='jobKey'
                    caption='Job'
                    alignment='left'
                    width={250}
                  >
                    <Lookup
                      dataSource={jobs}
                      displayExpr='jobName'
                      valueExpr='__KEY__'
                    />
                  </Column>

                  <Column
                    dataField='shopStart'
                    caption='Shop Start Date'
                    allowEditing='false'
                    calculateCellValue={(row) => {
                      let job = jobs.find((job) => job.__KEY__ === row.jobKey);
                      return job && job.start;
                    }}
                  />

                  <Column
                    dataField='linkToShopDate'
                    caption='Link To Shop Date?'
                    dataType='boolean'
                    alignment='center'
                    de
                  />

                  <Column
                    dataField='start'
                    caption='Start Date'
                    dataType='date'
                    alignment='center'
                    defaultSortOrder='asc'
                    minWidth='160'
                    cellRender={startDateRender}
                    editCellRender={startDateEdit}
                  >
                    <RequiredRule />
                  </Column>
                  <Column
                    dataField='end'
                    caption='End Date'
                    dataType='date'
                    alignment='center'
                  >
                    <RequiredRule />
                  </Column>
                  <Column
                    dataField='activity'
                    caption='Activity'
                    alignment='left'
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
        height={880}
        dataSource={fabMatrixData}
        showBorders
        showRowLines
        allowColumnResizing
        columnAutoWidth
        highlightChanges
        repaintChangesOnly

        wordWrapEnabled
        autoExpandAll
        onRowPrepared={rowPrepared}
      >
        <Scrolling mode='infinite' />
        <GroupPanel visible={false} autoExpandAll />
        <SearchPanel visible highlightCaseSensitive={false} />
        <Grouping autoExpandAll />
        {/* <Pager
          visible={true}
          displayMode='compact'
          showPageSizeSelector={true}
        /> */}
        <Editing
          mode='row'
          useIcons
          allowSorting={false}
          allowEditing={canEdit}
        />

        <Column
          dataField='date'
          caption='Date'
          alignment='left'
          width={"auto"}
          allowEditing={false}
        />

        {columns.map((column, i) => (
          <Column key={i} dataField={column} caption={column} cellRender={renderGridCell} />
        ))}
      </DataGrid>
    </div>
  );
};

export default FabMatrix;
