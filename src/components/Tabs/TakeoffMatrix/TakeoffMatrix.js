import React from "react";
import DataGrid, {
  Scrolling,
  Column,
  Grouping,
  GroupPanel,
  SearchPanel,
  Editing,
  Button,
} from "devextreme-react/data-grid";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";

const TakeoffMatrix = (props) => {
  const {
    takeoffData,
    canEdit,
    takeoffMatrixs,
    handleUpdate,
    handleDelete,
    handleAdd,
    highlightJobs,
  } = props;

  const rowPrepared = (row) => {
    row.rowElement.style.backgroundColor =
      row.dataIndex % 2 ? "#f3f4f6" : "white";
  };

  const editorPreparing = (row) => {
    if (row.row.data.dataField === "metalTakeoff") {
      row.cancel = true;
    }
  };

  const renderGridCell = (data) => {
    const isHighlight = highlightJobs.find(
      (jobs) => jobs.jobName === data.data[data.column.dataField]
    );

    return (
      <span style={{ backgroundColor: `${isHighlight ? "yellow" : "none"}`, padding: "5px", float: "left"}}>
        {data.data[data.column.dataField]}
      </span>
    );
  };

  return (
    <Box m={3}>
      {canEdit && (
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>Adjust Columns</Typography>
          </AccordionSummary>
          <AccordionDetails>
                <DataGrid
                  dataSource={takeoffMatrixs}
                  showRowLines
                  showBorders
                  allowColumnResizing
                  columnAutoWidth
                  highlightChanges
                  repaintChangesOnly
                  columnResizingMode="nextColumn"
                  wordWrapEnabled
                  autoExpandAll
                  onEditorPreparing={editorPreparing}
                  onRowUpdating={handleUpdate}
                  onRowRemoved={handleDelete}
                  onRowInserted={handleAdd}
                >
                  <Editing
                    mode="cell"
                    allowUpdating={canEdit}
                    allowDeleting={canEdit}
                    allowAdding={canEdit}
                    useIcons
                  />
                  <Column type="buttons">
                    <Button name="delete" />
                  </Column>
                  <Column
                    dataField="header"
                    caption="Header"
                    dataType="string"
                    alignment="left"
                  />
                  <Column
                    dataField="dataField"
                    caption="Data Field"
                    dataType="string"
                    alignment="left"
                  />
                  <Column
                    dataField="offset"
                    caption="Offset Amount"
                    dataType="number"
                    alignment="left"
                  />
                </DataGrid>
          </AccordionDetails>
        </Accordion>
      )}

        <DataGrid
          height="75vh"
          dataSource={takeoffData}
          showBorders
          allowColumnResizing
          columnAutoWidth
          highlightChanges
          repaintChangesOnly
          columnResizingMode="widget"
          wordWrapEnabled
          autoExpandAll
          showRowLines={false}
          onRowPrepared={rowPrepared}
        >
          <Scrolling mode="infinite" />
          <GroupPanel visible={false} autoExpandAll />
          <SearchPanel visible highlightCaseSensitive={false} />
          <Grouping autoExpandAll />
          <Editing mode="row" useIcons allowSorting={false} />

          <Column
            dataField="date"
            caption="Date"
            alignment="left"
            width={100}
            allowEditing={false}
          />

          {takeoffMatrixs.map((header, i) => (
            <Column
              key={header.__KEY__}
              dataField={header.dataField}
              caption={header.header}
              cellRender={renderGridCell}
              alignment="center"
              minWidth="10vw"
            />
          ))}
        </DataGrid>
    </Box>
  );
};

export default TakeoffMatrix;
