import React from "react";
import DataGrid, {
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
  addDays
} from "@/lib/helper-functions";

const PanelMatrix = (props) => {
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

    if (row.rowType === "data" && row.data.booked) {
      let link = row.data.linkToField;
      if (link && row.data.fieldStart) {
        let dateFabs = addDays(row.data.fieldStart, row.data.panelFabsOffset * 7);
        row.data.panelFabs = dateFabs;

        let dateRelease = addDays(row.data.fieldStart, row.data.panelReleaseOffset * 7);
        row.data.panelRelease = dateRelease;
      }
    }
  };

  const panelFabsRender = (row) => {
    if (row.data.panelFabs) {
      const panelFabs = row.data.panelFabs
        ? new Date(row.data.panelFabs).toLocaleDateString()
        : "";
      let link = row.data.linkToField;
      if (!link) {
        row.data.panelFabsOffset = toWeeks(
          row.data.fieldStart,
          row.data.panelFabs
        );
      }

      return (
        <div>
          {panelFabs}
          <br />
          <p style={{ color: "#3f50b5" }}>
            {row.data.panelFabsOffset} weeks after field start
          </p>
        </div>
      );
    }
  };

  const panelFabsEdit = (row) => {
    let link = row.data.linkToField;
    return (
      <div>
        {link ? (
          <input
            placeholder='weeks after field start'
            onChange={(e) => {
              let date = addDays(row.data.fieldStart, e.target.value * 7).toLocaleDateString();
              row.setValue(date.toString());

              row.data.panelFabsOffset = e.target.value;
              //console.log(row.data.panelFabsOffset);
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

  const panelReleaseRender = (row) => {
    // if (row.data.panelRelease) {
    //   console.log(row.data.panelRelease + " ID:" + row.data.ID);
    //   const panelRelease = row.data.panelRelease
    //     ? row.data.panelRelease.toLocaleDateString()
    //     : "";
    //   row.data.panelReleaseOffset = toWeeks(
    //     row.data.fieldStart,
    //     row.data.panelRelease
    //   );
    if (row.data.panelRelease) {
      //console.log(row.data.panelRelease + " ID:" + row.data.ID);
      const panelRelease = row.data.panelRelease
        ? new Date(row.data.panelRelease).toLocaleDateString()
        : "";
      let link = row.data.linkToField;
      if (!link) {
        row.data.panelReleaseOffset = toWeeks(
          row.data.fieldStart,
          row.data.panelRelease
        );
      }
      return (
        <div>
          {panelRelease}
          <br />
          <p style={{ color: "#3f50b5" }}>
            {row.data.panelReleaseOffset} weeks after field start
          </p>
        </div>
      );
    }
  };

  const panelReleaseEdit = (row) => {
    let link = row.data.linkToField;
    return (
      <div>
        {link ? (
          <input
            placeholder='weeks after field start'
            onChange={(e) => {
              row.data.panelReleaseOffset = e.target.value;
              let date = addDays(row.data.fieldStart, e.target.value * 7);
              row.setValue(date.toJSON());

              console.log('panel release offset: ' + row.data.panelReleaseOffset)
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
        height={880}
        dataSource={jobs}
        showBorders
        showRowLines
        allowColumnResizing
        columnAutoWidth
        highlightChanges
        repaintChangesOnly
        wordWrapEnabled
        autoExpandAll
        columnResizingMode='widget'
        onRowPrepared={renderRow}
        cellHintEnabled
        onRowUpdating={(e) => updateHandler(e, "jobs")}
      >
        <GroupPanel visible={false} autoExpandAll />
        <SearchPanel visible highlightCaseSensitive={false} />
        <Grouping autoExpandAll />
        <Sorting mode='multiple' />
        <Pager
          visible={true}
          displayMode='compact'
          showPageSizeSelector={true}
          allowedPageSizes={[40, 80, 160, 300]}
        />

        <Paging defaultPageSize={40} />

        <Editing mode='cell' allowUpdating={canEdit} useIcons allowSorting />

        <Column
          dataField='linkToField'
          dataType='boolean'
          caption='Link to Field Start'
          calculateDisplayValue={(row) =>
            row.linkToField ? row.linkToField : false
          }
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

        <Column
          dataField='start'
          dataType='date'
          caption='Shop Start'
          // caption='Metal Takeoff'
          alignment='center'
          allowEditing={false}
        ></Column>

        <Column
          dataField='fieldStart'
          dataType='date'
          caption='Field Start'
          alignment='center'
        ></Column>

        <Column
          dataField='panelFabs'
          dataType='date'
          caption='Panel Fabs'
          minWidth='160'
          alignment='center'
          cellRender={panelFabsRender}
          editCellRender={panelFabsEdit}
        ></Column>

        <Column
          dataField='panelRelease'
          dataType='date'
          caption='Panel Release'
          alignment='center'
          minWidth='160'
          cellRender={panelReleaseRender}
          editCellRender={panelReleaseEdit}
        ></Column>

        <Column
          dataField='dollarAmount'
          dataType='number'
          caption='Dollar Amount'
          alignment='center'
          calculateDisplayValue={(cell) =>
            cell.dollarAmount && `$ ${cell.dollarAmount}`
          }
        ></Column>

        <Column
          dataField='sqft'
          dataType='number'
          caption='Sq. Ft.'
          alignment='center'
        ></Column>

        <Column
          dataField='pnl_vendor'
          dataType='string'
          caption='Vendor'
          alignment='center'
        ></Column>

        <Column
          dataField='costPerSqft'
          dataType='number'
          caption='$ per Sq. Ft.'
          alignment='center'
          allowEditing={false}
          calculateDisplayValue={(row) =>
            row.dollarAmount && `$ ${(row.dollarAmount / row.sqft).toFixed(2)}`
          }
        ></Column>

        <Column
          dataField='panelRFQ'
          dataType='boolean'
          caption='Panel RFQ'
          alignment='center'
          calculateDisplayValue={(row) => (row.panelRFQ ? row.panelRFQ : false)}
        ></Column>

        <Column
          dataField='proposedPanelReleases'
          dataType='number'
          caption='Proposed Panel Releases (from Sherwin)'
          alignment='center'
          cssClass="blueColumn"
        ></Column>

        <Column
          dataField='panelScope'
          // dataType="number"
          caption='Panel Scope'
          alignment='center'
          cssClass="blueColumn"
        ></Column>

        <Column
          dataField='vendorKickOffLetter'
          dataType='string'
          caption='Vendor Kick-Off Letter'
          alignment='center'
          cssClass="blueColumn"
        ></Column>

        <Column
          dataField='kickOffMeeting'
          dataType='string'
          caption='PM/Vendor Kick-Off Meeting'
          alignment='center'
          cssClass="blueColumn"
        ></Column>
        <Column
          dataField='finalPanelReleases'
          dataType='number'
          caption='Final Panel Releases'
          alignment='center'
          cssClass="blueColumn"
        ></Column>

        <Column
          dataField='keyNotes'
          dataType='string'
          caption='Key Notes for Scope'
          alignment='center'
          cssClass="blueColumn"
        ></Column>

        <Column
          dataField='finish'
          dataType='string'
          caption='Finish'
          alignment='center'
        ></Column>

        <Column
          dataField='certifiedMatchApproved'
          dataType='boolean'
          caption='Certified Match Approved'
          alignment='center'
          allowEditing={false}
          calculateCellValue={(row) =>
            row.certifiedMatchApproved ? row.certifiedMatchApproved : false
          }
        ></Column>

        <Column
          dataField='warranty'
          dataType='string'
          caption='Warranty'
          alignment='center'
        ></Column>

        <Column
          dataField='deliveryStartDateShop'
          dataType='date'
          caption='Delivery Start Date Shop'
          alignment='center'
        ></Column>

        <Column
          dataField='deliveryStartDateField'
          dataType='date'
          caption='Delivery Start Date Field'
          alignment='center'
        ></Column>

        <Column
          dataField='shopUseBrakes'
          dataType='date'
          caption='Shop Use Brakes Shape Release'
          alignment='center'
        ></Column>

        <Column
          dataField='shopUseSteel'
          dataType='date'
          caption='Shop Use Steel Release'
          alignment='center'
        ></Column>

        <Column
          dataField='glazeInPanelRelease'
          dataType='date'
          caption='Glaze-In Panel Release'
          alignment='center'
        ></Column>

        <Column
          dataField='fieldUsePanelRelease'
          dataType='date'
          caption='Field Use Panel Release'
          alignment='center'
        ></Column>

        <Column
          dataField='QC'
          // dataType="date"
          caption='QC'
          alignment='center'
        ></Column>

        <Column
          dataField='doorLeafs'
          dataType='number'
          caption='# of Door Leafs'
          alignment='center'
        ></Column>

        <Column
          dataField='notes'
          dataType='string'
          caption='Notes'
          alignment='left'
        ></Column>
      </DataGrid>
    </div>
  );
};

export default PanelMatrix;
