import React from "react";
import DataGrid, {
  Scrolling,
  Column,
  Grouping,
  GroupPanel,
  SearchPanel,
  Editing,
  Sorting,
  Pager,
  Paging
} from "devextreme-react/data-grid";

import {
  toWeeks,
  addDays,
} from "@/lib/helper-functions";

const GlassGasket = (props) => {
  const { jobs, handleUpdate, canEdit } = props;

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

  const orderWeekRender = (row) => {
    let date = new Date(row.data.glassTakeoff);

    date.setDate(date.getDate() + 7);

    row.data.orderWeekOffset = toWeeks(row.data.start, date);
    return (
      <div>
        {date && date.toLocaleDateString()}
        <br />
        {
          <p style={{ color: "#3f50b5" }}>
            {-row.data.orderWeekOffset} weeks before shop start
          </p>
        }
      </div>
    );
  };

  const orderWeekEdit = (row) => {
    let link = row.data.orderLinkToShop;
    return (
      <div>
        {link ? (
          <input
            placeholder='weeks after shop start'
            onChange={(e) => {
              let weeks = parseInt(e.target.value);
              let date = addDays(new Date(row.data.start), weeks * 7);
              row.setValue(date);
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

  return (
    <div style={{ margin: "3vw" }}>
      <DataGrid
       height={2500}
        dataSource={jobs}
        showBorders
        showRowLines
        allowColumnResizing
        columnAutoWidth
        highlightChanges
        repaintChangesOnly
        //twoWayBindingEnabled
        columnResizingMode='widget'
        wordWrapEnabled
        autoExpandAll
        onRowUpdating={(e) => updateHandler(e, "jobs")}
        onRowPrepared={renderRow}
        cellHintEnabled
      >
        <Scrolling mode='infinite' />
        <GroupPanel visible={false} autoExpandAll />
        <SearchPanel visible highlightCaseSensitive={false} />
        <Grouping autoExpandAll />
        <Sorting mode='multiple' />
        {/* <Pager
          visible={true}
          displayMode='compact'
          showPageSizeSelector={true}
          allowedPageSizes={[1, 40, 80, 160, 300]}
        />

        <Paging defaultPageSize={1} /> */}
        <Editing mode='cell' allowUpdating={canEdit} useIcons allowSorting />

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

        <Column
          dataField='orderLinkToShop'
          caption='Link To Shop Start?'
          dataType='boolean'
          allowEditing={false}
          calculateDisplayValue={(row) =>
            row.orderLinkToShop ? row.orderLinkToShop : false
          }
        />

        <Column
          dataField='orderWeekOf'
          dataType='date'
          caption='Order Week Of'
          alignment='center'
          minWidth='160'
          cellRender={orderWeekRender}
          editCellRender={orderWeekEdit}
        ></Column>

        <Column
          dataField='glassRequired'
          dataType='date'
          caption='Glass Required'
          alignment='center'
          allowEditing={false}
          calculateDisplayValue={(row) => {
            let date = new Date(row.start);

            date.setDate(date.getDate() - 14);
            return date;
          }}
        ></Column>

        <Column
          dataField='numberOfLites'
          // dataType=""
          caption='# Of Lites'
          alignment='center'
        ></Column>

        <Column
          dataField='sqft'
          // dataType="date"
          caption='Square Footage'
          alignment='center'
        ></Column>

        <Column
          dataField='vendor'
          dataType='string'
          caption='Vendor'
          alignment='center'
        ></Column>

        <Column
          dataField='lbs'
          dataType='number'
          caption='Lbs, K'
          alignment='center'
        ></Column>

        <Column
          dataField='gasket'
          caption='Gasket'
          alignment='center'
          allowEditing={false}
          calculateDisplayValue={(cell) => cell.gasket && `$ ${cell.gasket}`}
        ></Column>

        <Column
          dataField='coating'
          dataType='string'
          caption='Coating'
          alignment='center'
        ></Column>

        <Column
          dataField='pgtTransferred'
          dataType='boolean'
          caption='PGT Transferred'
          alignment='center'
          allowEditing={false}
          calculateDisplayValue={(row) =>
            row.pgtTransferred ? row.pgtTransferred : false
          }
        ></Column>

        <Column
          dataField='bookingPO'
          dataType='string'
          caption='Booking PO'
          alignment='center'
        ></Column>

        <Column
          dataField='pgtComplete'
          dataType='string'
          caption='PGT Complete'
          alignment='center'
        ></Column>
      </DataGrid>
    </div>
  );
};

export default GlassGasket;
