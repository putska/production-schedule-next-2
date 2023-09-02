import React, { useState, useEffect } from "react";
import DataGrid, {
  Column,
  Grouping,
  GroupPanel,
  SearchPanel,
  Editing,
  Scrolling
} from "devextreme-react/data-grid";
import SelectBox from "devextreme-react/select-box";
import Button from "devextreme-react/button";
import axios from "axios";

const AllActivities = (props) => {
  const { jobs, fabMatrixs, shopDrawings, canEdit, handleUpdate, dates } =
    props;
  const [rowSelection, setRowSelection] = useState(null);
  const [colSelection, setColSelection] = useState(null);

  const selectOptions = [
    { name: "Field Installation", value: 9 },
    { name: "Shop Fab Job Units", value: 8 },
    { name: "Shop Fab VMU Units", value: 10 },
    { name: "Metal Takeoff", value: 2 },
    { name: "Profile Drawings", value: 4 },
    { name: "Embed Drawings", value: 3 },
    { name: "Panel Fabs", value: 13 },
    { name: "Unit Fabs", value: 7 },
  ];

  const renderRow = (row) => {
    if (row.rowType === "data" && !row.data.booked) {
      row.rowElement.style.backgroundColor = "cyan";
    } else if (
      row.rowType === "data" &&
      row.data.booked &&
      row.data.engineering
    ) {
      row.rowElement.style.backgroundColor = "#edada6";
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

  const onSelectionChanged = ({ selectedRowsData }) => {
    const data = selectedRowsData[0];
    setRowSelection(data);
  };

  const onSelectionFilterChanged = async (item) => {
    setColSelection(item.value);
  };

  const onChangeDateButtonClicked = () => {
    let date = null;

    selectOptions.forEach(colSelection => {
      switch (colSelection.value) {
        case 9:
          date = rowSelection.fieldStart;
          break;
        case 8:
          date = rowSelection.start;
          break;
        case 10:
          date = rowSelection.doorSchedule;
          break;
        case 2:
          date = rowSelection.metalTakeoff;
          break;
        case 4:
          date = rowSelection.glassTakeoff;
          break;
        case 3:
          date = rowSelection.shopUseBrakeShapesAndSteel;
          break;
        case 13:
          date = rowSelection.panelFabs;
          break;
        case 7:
          date = rowSelection.fabDrawings;
          break;
        default:
          date = null;
      }

      if (date) {
        date = new Date(date).toJSON();
        console.log(date)
        axios
          .put(
            `http://wwweb/portal/DesktopModules/ww_Global/API/PTSchedule/PutBaseline?Job_Number=${rowSelection.jobNumber}&Activity=${colSelection}&Date=${date}`
          )
          .catch((error) => console.log(error));
      }
    })
  };

  const renderDateCell = (rowData, type) => {
    let result = dates.find((item) => item.Job_Number === rowData.jobNumber);
    let color = "#009E60";

    switch (type) {
      case "metalTakeoff":
        if (!rowData.metalTakeoff) {
          break;
        }
        if (result && result["2"]) {
          let date = result["2"];

          let dateArr = date.split(" ");

          if (dateArr.length > 1) {
            date = dateArr[1];
            //baseline date
            let date1 = new Date(date);
            date1.setHours(0, 0, 0, 0);
            //job data date
            let date2 = new Date(rowData.metalTakeoff);
            date2.setHours(0, 0, 0, 0);

            if (date1.getTime() === date2.getTime()) {
              date = null;
            } else if (date1 > date2) {
              color = "red";
            }
          } else {
            date = null;
          }

          return (
            <div>
              <div>{rowData.metalTakeoff.toLocaleDateString()}</div>
              <div style={{ color: color }}>{date}</div>
            </div>
          );
        } else return <div>{rowData.metalTakeoff.toLocaleDateString()}</div>;

      case "fieldStart":
        if (!rowData.fieldStart) {
          break;
        }
        if (result && result["9"]) {
          let date = result["9"];

          let dateArr = date.split(" ");

          if (dateArr.length > 1) {
            date = dateArr[1];
            //baseline date
            let date1 = new Date(date);
            date1.setHours(0, 0, 0, 0);
            //job data date
            let date2 = new Date(rowData.fieldStart);
            date2.setHours(0, 0, 0, 0);
            if (date1.getTime() === date2.getTime()) {
              date = null;
            } else if (date1 > date2) {
              color = "red";
            }
          } else {
            date = null;
          }

          return (
            <div>
              <div>{rowData.fieldStart.toLocaleDateString()}</div>
              <div style={{ color: color }}>{date}</div>
            </div>
          );
        } else return <div>{rowData.fieldStart.toLocaleDateString()}</div>;

      case "shopStart":

        if (!rowData.start) {
          break;
        }
        if (result && result["8"]) {
          let date = result["8"];

          let dateArr = date.split(" ");

          if (dateArr.length > 1) {
            date = dateArr[1];
            //baseline date
            let date1 = new Date(date);
            date1.setHours(0, 0, 0, 0);
            //job data date
            let date2 = new Date(rowData.start);
            date2.setHours(0, 0, 0, 0);
            if (date1.getTime() === date2.getTime()) {
              date = null;
            } else if (date1 > date2) {
              color = "red";
            }
          } else {
            date = null;
          }

          return (
            <div>
              <div>{rowData.start.toLocaleDateString()}</div>
              <div style={{ color: color }}>{date}</div>
            </div>
          );
        } else return <div>{rowData.start.toLocaleDateString()}</div>;

      case "doorSchedule":
        if (!rowData.doorSchedule) {
          break;
        }
        if (result && result["10"]) {
          let date = result["10"];

          let dateArr = date.split(" ");

          if (dateArr.length > 1) {
            date = dateArr[1];
            //baseline date
            let date1 = new Date(date);
            date1.setHours(0, 0, 0, 0);
            //job data date
            let date2 = new Date(rowData.doorSchedule);
            date2.setHours(0, 0, 0, 0);
            if (date1.getTime() === date2.getTime()) {
              date = null;
            } else if (date1 > date2) {
              color = "red";
            }
          } else {
            date = null;
          }

          return (
            <div>
              <div>{rowData.doorSchedule.toLocaleDateString()}</div>
              <div style={{ color: color }}>{date}</div>
            </div>
          );
        } else return <div>{rowData.doorSchedule.toLocaleDateString()}</div>;
      case "glassTakeoff":
        if (!rowData.glassTakeoff) {
          break;
        }
        if (result && result["4"]) {
          let date = result["4"];

          let dateArr = date.split(" ");

          if (dateArr.length > 1) {
            date = dateArr[1];
            //baseline date
            let date1 = new Date(date);
            date1.setHours(0, 0, 0, 0);
            //job data date
            let date2 = new Date(rowData.glassTakeoff);
            date2.setHours(0, 0, 0, 0);
            if (date1.getTime() === date2.getTime()) {
              date = null;
            } else if (date1 > date2) {
              color = "red";
            }
          } else {
            date = null;
          }

          return (
            <div>
              <div>{rowData.glassTakeoff.toLocaleDateString()}</div>
              {/* <div style={{ color: color }}>{date}</div> */}
            </div>
          );
        } else return <div>{rowData.glassTakeoff.toLocaleDateString()}</div>;
      case "panelFabs":
        if (!rowData.panelFabs) {
          break;
        }
        if (result && result["4"]) {
          let date = result["4"];

          let dateArr = date.split(" ");

          if (dateArr.length > 1) {
            date = dateArr[1];
            //baseline date
            let date1 = new Date(date);
            date1.setHours(0, 0, 0, 0);
            //job data date
            let date2 = new Date(rowData.panelFabs);
            date2.setHours(0, 0, 0, 0);
            if (date1.getTime() === date2.getTime()) {
              date = null;
            } else if (date1 > date2) {
              color = "red";
            }
          } else {
            date = null;
          }

          return (
            <div>
              <div>{rowData.panelFabs.toLocaleDateString()}</div>
              <div style={{ color: color }}>{date}</div>
            </div>
          );
        } else {
          return <div>{rowData.panelFabs.toLocaleDateString()}</div>;
        }
      case "shopUseBrakeShapesAndSteel":
        if (!rowData.shopUseBrakeShapesAndSteel) {
          break;
        }
        if (result && result["3"]) {
          let date = result["3"];

          let dateArr = date.split(" ");

          if (dateArr.length > 1) {
            date = dateArr[1];
            //baseline date
            let date1 = new Date(date);
            date1.setHours(0, 0, 0, 0);
            //job data date
            let date2 = new Date(rowData.shopUseBrakeShapesAndSteel);
            date2.setHours(0, 0, 0, 0);
            if (date1.getTime() === date2.getTime()) {
              date = null;
            } else if (date1 > date2) {
              color = "red";
            }
          } else {
            date = null;
          }

          return (
            <div>
              <div>
                {rowData.shopUseBrakeShapesAndSteel.toLocaleDateString()}
              </div>
              {/* <div style={{ color: color }}>{date}</div> */}
            </div>
          );
        } else {
          return (
            <div>{rowData.shopUseBrakeShapesAndSteel.toLocaleDateString()}</div>
          );
        }
      case "fabDrawings":
        if (!rowData.fabDrawings) {
          break;
        }
        if (result && result["7"]) {
          let date = result["7"];

          let dateArr = date.split(" ");

          if (dateArr.length > 1) {
            date = dateArr[1];
            //baseline date
            let date1 = new Date(date);
            date1.setHours(0, 0, 0, 0);
            //job data date
            let date2 = new Date(rowData.fabDrawings);
            date2.setHours(0, 0, 0, 0);
            if (date1.getTime() === date2.getTime()) {
              date = null;
            } else if (date1 > date2) {
              color = "red";
            }
          } else {
            date = null;
          }

          return (
            <div>
              <div>{rowData.fabDrawings.toLocaleDateString()}</div>
              <div style={{ color: color }}>{date}</div>
            </div>
          );
        } else {
          return <div>{rowData.fabDrawings.toLocaleDateString()}</div>;
        }
      default:
        return null;
    }
  };

  return (
    <div>
      {canEdit && (
        <div>
          {/* <SelectBox
            id='select-col'
            dataSource={selectOptions}
            onValueChanged={onSelectionFilterChanged}
            placeholder='Select Col'
            displayExpr='name'
            valueExpr='value'
            width='200px'
          />{" "} */}
          <Button
            disabled={
              (!rowSelection || rowSelection.jobNumber === "None") && canEdit
            }
            onClick={onChangeDateButtonClicked}
            text='Update Dates'
          />
        </div>
      )}
      <DataGrid
        height={880}
        dataSource={jobs}
        selection={{ mode: "single" }}
        showBorders
        showRowLines
        allowColumnResizing
        columnAutoWidth
        highlightChanges
        repaintChangesOnly
        //twoWayBindingEnabled
        columnResizingMode='nextColumn'
        wordWrapEnabled
        autoExpandAll
        onRowUpdating={(e) => updateHandler(e, "job")}
        onRowPrepared={renderRow}
        cellHintEnabled
        onSelectionChanged={onSelectionChanged}
      >
        <Scrolling mode="infinite" />
        <GroupPanel visible={false} autoExpandAll />
        <SearchPanel visible highlightCaseSensitive={false} />
        <Grouping autoExpandAll />

        {/* <Pager
          visible={true}
          displayMode='compact'
          showPageSizeSelector={true}
        /> */}
        <Editing
          mode='cell'
          allowUpdating={canEdit}
          useIcons
          allowSorting
          allowDeleting={false}
        />

        <Column
          dataField='jobNumber'
          dataType='string'
          caption='Job Number'
          alignment='center'
          allowEditing={false}
        ></Column>

        <Column
          dataField='jobName'
          dataType='string'
          caption='Job Name'
          alignment='left'
          allowEditing={false}
        ></Column>
        Shop
        <Column
          dataField='PM'
          dataType='string'
          caption='PM'
          alignment='center'
          defaultSortIndex={0}
          defaultSortOrder='asc'
          minWidth={200}
        >
          {/* <RequiredRule /> */}
        </Column>

        <Column
          dataField='startShopDrawings'
          dataType='date'
          caption='Start Shop Drawings'
          alignment='center'
          allowEditing={false}
          calculateDisplayValue={(row) => {
            let date = shopDrawings.find(
              (item) => item.jobName === row.jobName
            );
            return date ? new Date(date.start).toLocaleDateString() : "";
          }}
        ></Column>

        <Column
          dataField='metalTakeoff'
          //dataType='date'
          caption='Start Metal and Misc Takeoff'
          alignment='center'
          allowEditing={false}
          cellRender={(e) => renderDateCell(e.data, "metalTakeoff")}
        ></Column>

        <Column
          dataField='glassTakeoff'
          dataType='date'
          caption='Start Glass Takeoff'
          alignment='center'
          allowEditing={false}
          cellRender={(e) => renderDateCell(e.data, "glassTakeoff")}
        ></Column>

        <Column
          dataField='doorSchedule'
          dataType='date'
          caption='Start Door Schedule'
          alignment='center'
          allowEditing={false}
          cellRender={(e) => renderDateCell(e.data, "doorSchedule")}
        ></Column>

        <Column
          dataField='shopUseBrakeShapesAndSteel'
          dataType='date'
          caption='Start Shop Use Brake Shapes'
          alignment='center'
          allowEditing={false}
          cellRender={(e) =>
            renderDateCell(e.data, "shopUseBrakeShapesAndSteel")
          }
        ></Column>

        <Column
          dataField='panelFabs'
          dataType='date'
          caption='Panel Fabs'
          alignment='center'
          allowEditing={false}
          cellRender={(e) => renderDateCell(e.data, "panelFabs")}
        ></Column>

        <Column
          dataField='panelRelease'
          dataType='date'
          caption='Panel Release'
          alignment='center'
          allowEditing={false}
        ></Column>

        <Column
          dataField='fabDrawings'
          dataType='date'
          caption='Fab Drawings'
          alignment='center'
          allowEditing={false}
          calculateDisplayValue={(row) => {
            let date = fabMatrixs.find((item) => item.jobKey === row.__KEY__);

            date = date ? new Date(date.start) : new Date(row.start);
            return date;
          }}
          calculateCellValue={(row) => {
            let date = fabMatrixs.find((item) => item.jobKey === row.__KEY__);

            date = date ? new Date(date.start) : new Date(row.start);
            row.fabDrawings = date;
            return date;
          }}
          cellRender={(e) => renderDateCell(e.data, "fabDrawings")}
        ></Column>

        <Column
          dataField='start'
          dataType='date'
          caption='Shop Start'
          alignment='center'
          allowEditing={false}
          cellRender={(e) => renderDateCell(e.data, "shopStart")}
        ></Column>

        <Column
          dataField='fieldStart'
          dataType='date'
          caption='Field Start'
          alignment='center'
          allowEditing={false}
          cellRender={(e) => renderDateCell(e.data, "fieldStart")}
        ></Column>
      </DataGrid>
    </div>
  );
};

export default AllActivities;
