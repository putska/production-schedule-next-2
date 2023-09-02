import React, { useState, useEffect } from "react";
import FieldGrid from "./FieldGrid.js";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Grid from "@mui/material/Grid";
import axios from "axios";

import {
  toWeeks,
  toMondayDate,
  addDays,
} from "@/lib/helper-functions.js"

import DataGrid, {
  Column,
  Grouping,
  Editing,
  Button,
  RequiredRule,
  Lookup,
  Scrolling,
} from "devextreme-react/data-grid";

const Field = (props) => {
  const {
    jobs,
    jobsites,
    fields,

    columns,
    columnsX,

    handleUpdate,
    handleDelete,
    handleAdd,
    canEdit,
  } = props;

  const [fieldDataSoCal, setFieldDataSoCal] = useState([]);
  const [fieldDataLV, setFieldDataLV] = useState([]);
  const [fieldDataFremont, setFieldDataFremont] = useState([]);
  const [fieldData, setFieldData] = useState([]);

  useEffect(() => {

    let newJobs = JSON.parse(JSON.stringify(jobs));
    setFieldData(newJobs);
    // fremont jobs
    setFieldDataFremont(newJobs.filter(
      (job) => (job.jobNumber || "").substring(0, 1) !== '7' && (job.jobNumber || "").substring(0, 1) !== '9'
    ));

    ///So Cal jobs
    setFieldDataSoCal(newJobs.filter(
      (job) => (job.jobNumber || "").substring(0, 1) === '7'
    ));

    ///Vegas jobs
    setFieldDataLV(newJobs.filter(
      (job) => (job.jobNumber || "").substring(0, 1) === '9'
    ));
  }, [fields, jobs])

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
      {/* {canEdit && (
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
                  dataSource={fields}
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
                  <Editing
                    mode='cell'
                    allowUpdating={canEdit}
                    allowDeleting={canEdit}
                    allowAdding={canEdit}
                    useIcons
                  />

                  <Grouping autoExpandAll={expanded} />
                  <Scrolling mode='infinite' />
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
                      dataSource={fieldData}
                      displayExpr='jobName'
                      valueExpr='jobName'
                    />
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
                    dataField='numberOfEmployees'
                    caption='Number of Employees'
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
      )} */}
      {fieldDataFremont.length > 0 &&
        <FieldGrid
          jobs={fieldDataFremont}
          jobsites={jobsites}
          fields={fields}

          columns={columns}
          columnsX={columnsX}

          handleUpdate={handleUpdate}
          handleAdd={handleAdd}
          handleDelete={handleDelete}
          toWeeks={toWeeks}
          toMondayDate={toMondayDate}
          addDays={addDays}
          canEdit={canEdit}
        />
      }
      {fieldDataSoCal.length > 0 &&
        <FieldGrid
          jobs={fieldDataSoCal}
          jobsites={jobsites}
          fields={fields}

          columns={columns}
          columnsX={columnsX}

          handleUpdate={handleUpdate}
          handleAdd={handleAdd}
          handleDelete={handleDelete}
          toWeeks={toWeeks}
          toMondayDate={toMondayDate}
          addDays={addDays}
          canEdit={canEdit}
        />
      }
      {fieldDataLV.length > 0 &&
        <FieldGrid
          jobs={fieldDataLV}
          jobsites={jobsites}
          fields={fields}

          columns={columns}
          columnsX={columnsX}

          handleUpdate={handleUpdate}
          handleAdd={handleAdd}
          handleDelete={handleDelete}
          toWeeks={toWeeks}
          toMondayDate={toMondayDate}
          addDays={addDays}
          canEdit={canEdit}
        />
      }
    </div>
  );
};

export default Field;
