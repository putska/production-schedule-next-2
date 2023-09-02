import React, { useState, useEffect } from "react";
import DataGrid, {
  Column,
  //Grouping,
  LoadPanel,
  SearchPanel,
  Summary,
  TotalItem,
  Sorting,
  Scrolling,
} from "devextreme-react/data-grid";

import {
  toWeeks,
  toMondayDate,
  addDays,
  convertDates
} from "@/lib/helper-functions"


const FieldGrid = (props) => {
  const {
    jobs,
    fields,
    columns,
    columnsX
  } = props;
  //const [expanded, setExpanded] = useState(false);
  const [fieldData, setFieldData] = useState(jobs);
  const [totalEmps, setTotalEmps] = useState(0);

  useEffect(() => {
    const newJobs = convertDates(jobs);
    let total = 0;

    fields.forEach((row) => {
      let jobIndex = newJobs.findIndex((j) => j.jobName === row.jobName);
      if (jobIndex !== -1) {
        let fieldOffset = toWeeks(jobs[0].start, newJobs[jobIndex].fieldStart);
        newJobs[jobIndex][(fieldOffset + row.offsetFromField).toString()] =
          row.numberOfEmployees;
        total += row.numberOfEmployees;
      }
    });

    setFieldData(newJobs);
    setTotalEmps(total);
  }, [fields, jobs]);

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

  return (
    <div style={{ margin: "3vw" }}>
      <DataGrid
        height={880}
        dataSource={fieldData}
        showRowLines
        columnAutoWidth
        autoExpandAll
        highlightChanges
        repaintChangesOnly
        wordWrapEnabled
        showColumnLines={true}
        onCellPrepared={cellPrepared}
      >
        <SearchPanel visible highlightCaseSensitive={false} />
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
          dataField='employees'
          caption='Avg. # of Employees'
          alignment='center'
          allowEditing={false}
          calculateDisplayValue={(row) => {
            let cols = columns
              .filter((col) => row[col.offset.toString()])
              .map((col) => row[col.offset.toString()]);
            const rowTotal =
              cols.length > 0 ? cols.reduce((total, col) => total + col) : 0;
            const avgEmployees =
              rowTotal > 0 ? Math.ceil(rowTotal / cols.length) : 0;
            return avgEmployees;
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
        <Summary recalculateWhileEditing>
          <TotalItem
            column='employees'
            summaryType='sum'
            customizeText={(item) => `Total Employees: ${totalEmps}`}
          />

          {columns.map((oldCol, i) => (
            <TotalItem
              key={i}
              column={oldCol.offset.toString()}
              summaryType='sum'
              customizeText={(item) => item.value}
            />
          ))}
        </Summary>
      </DataGrid>
    </div>
  );
};

export default FieldGrid;
