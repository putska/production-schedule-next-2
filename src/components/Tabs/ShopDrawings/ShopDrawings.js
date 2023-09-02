import React, { useState, useEffect } from "react";
import DataGrid, {
  Column,
  Grouping,
  GroupPanel,
  SearchPanel,
  Editing,
  Button,
  RequiredRule,
  Lookup,
  Scrolling
} from "devextreme-react/data-grid";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Grid from "@mui/material/Grid";
import axios from "axios";

import ShopDrawingsCustomized from "@/src/components/Tabs/ShopDrawings/ShopDrawingsCustomized"

const ShopDrawings = (props) => {
  const {
    jobs,
    shopDrawings,
    rows,
    handleUpdate,
    weeks,
    toWeeks,
    toMondayDate,
    addDays,
    canEdit,
    handleDelete,
    handleAdd,
  } = props;
  const [expanded, setExpanded] = useState(false);
  const [shopDrawingsData, setShopDrawingsData] = useState([]);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    const createRows = () => {
      let newRows = JSON.parse(JSON.stringify(rows));

      shopDrawings.forEach((activity) => {
        let numWeeksForProject =
          activity.start && activity.end
            ? toWeeks(activity.start, activity.end)
            : 0;

        let activityDates = [];
        let start = toMondayDate(activity.start);

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

      setShopDrawingsData(newRows);
    };

    const createColumns = () => {
      let cols = [...new Set(shopDrawings.map((item) => item.employee))];
      setColumns(cols);
    };

    createColumns();
    createRows();
  }, [addDays, rows, shopDrawings, toMondayDate, toWeeks, weeks]);

  const updateRowHandler = async (e) => {
    try {
      const res = await axios.get(
        `/desktopmodules/ww_Global/API/PSDev/GetShopDrawing?ID=${e.oldData.ID}`
      );

      const data = { ...res.data, ...e.newData };

      e.component.beginCustomLoading();
      await handleUpdate("shopDrawing", data);
      e.component.endCustomLoading();
    } catch (error) {
      console.error(error);
      e.component.endCustomLoading();
    }
  };

  const addRowHandler = async (e) => {
    e.component.beginCustomLoading();

    await handleAdd("shopDrawing", e.data);

    e.component.endCustomLoading();
  };

  const deleteRowHandler = async (e) => {
    e.component.beginCustomLoading();

    await handleDelete("shopDrawing", e.data);

    e.component.endCustomLoading();
  };

  const rowPrepared = (row) => {
    row.rowElement.style.backgroundColor =
      row.dataIndex % 2 ? "#b5bdc9" : "white";
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
                  dataSource={shopDrawings}
                  showRowLines
                  showBorders
                  allowColumnResizing
                  columnAutoWidth
                  highlightChanges
                  repaintChangesOnly
                 // twoWayBindingEnabled
                  wordWrapEnabled
                  autoExpandAll
                  onRowUpdating={updateRowHandler}
                  onRowRemoved={deleteRowHandler}
                  onRowInserted={addRowHandler}
                >

                  <Editing
                    mode='cell'
                    allowUpdating={canEdit}
                    allowDeleting={canEdit}
                    allowAdding={canEdit}
                    useIcons
                  />

                  <Grouping autoExpandAll={expanded} />

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

                  <Column type='buttons'>
                    <Button name='delete' />
                  </Column>
                  <Column
                    dataField='employee'
                    caption='Employee'
                    dataType='string'
                    alignment='left'
                  >
                    <RequiredRule />
                  </Column>
                  <Column
                    dataField='start'
                    caption='Start Date'
                    dataType='date'
                    alignment='center'
                    defaultSortOrder='asc'
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
                </DataGrid>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      <DataGrid
        height={880}
        dataSource={shopDrawingsData}
        showBorders
        showRowLines
        allowColumnResizing
        columnAutoWidth
        highlightChanges
        repaintChangesOnly
       // twoWayBindingEnabled
        wordWrapEnabled
        autoExpandAll
        columnResizingMode='widget'
        onRowPrepared={rowPrepared}
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
        <Editing mode='row' useIcons allowSorting={false} />

        <Column
          dataField='date'
          caption='Date'
          alignment='left'
          width={"auto"}
          allowEditing={false}
        />

        {columns.map((column, i) => (
          <Column key={i} dataField={column} caption={column} />
        ))}
      </DataGrid>


        
    </div>
  );
};

export default ShopDrawings;
