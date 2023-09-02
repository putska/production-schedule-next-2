import React, { useState, useEffect } from "react";
import Chart from "./PS_Chart";
import Graph from "./PS_Graph";
import Gantt from "./PS_DG_Gantt";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";

const ProductionSchedule = (props) => {
  const {
    handleUpdate,
    handleAdd,
    handleDelete,
    toMondayDate,
    addDays,
    toWeeks,
    canEdit,
    jobs,
    shops,
  } = props;
  const [tabs, setTabs] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setTabs([
      {
        ID: 0,
        name: "Gantt",
        component: (
          <Gantt
            jobs={jobs}
            shops={shops}
            toMondayDate={toMondayDate}
            addDays={addDays}
            toWeeks={toWeeks}
          />
        ),
      },
      {
        ID: 1,
        name: "Production Schedule",
        component: (
          <Chart
            jobs={jobs}
            shops={shops}
            handleUpdate={handleUpdate}
            handleAdd={handleAdd}
            handleDelete={handleDelete}
            toMondayDate={toMondayDate}
            addDays={addDays}
            toWeeks={toWeeks}
            canEdit={canEdit}
          />
        ),
      },
      {
        ID: 2,
        name: "Units Graph",
        component: (
          <Graph
            jobs={jobs}
            shops={shops}
            toMondayDate={toMondayDate}
            addDays={addDays}
            toWeeks={toWeeks}
          />
        ),
      },
    ]);
  }, [
    addDays,
    canEdit,
    handleAdd,
    handleDelete,
    handleUpdate,
    jobs,
    shops,
    toMondayDate,
    toWeeks,
  ]);

  // const inputs = ["gantt", "chart", "graph"].map((value, index) => (
  //   <Grid item key={index}>
  //     <Radio
  //       checked={selectedIndex === index}
  //       onChange={(e) => setValue(index)}
  //       value={index}
  //       color='primary'
  //       name='radio-buttons'
  //       inputProps={{ "aria-label": index }}
  //       size='small'
  //     />
  //   </Grid>
  // ));

  const TabMenu = () => (
    <Box sx={{ width: "100%" }}>
      <Tabs
        value={selectedIndex}
        onChange={(e, value) => setSelectedIndex(value)}
        textColor='secondary'
        indicatorColor='secondary'
        centered={true}
      >
        <Tab value={0} label='Gantt' />
        <Tab value={1} label='Chart' />
        <Tab value={2} label='Graph' />
        <Button
          variant='outlined'
          color='secondary'
          href='http://wwweb/portal/desktopmodules/wwPMDashboard/PTSchedChart_extra.htm'
        >
          PT Tracker
        </Button>
      </Tabs>
    </Box>
  );

  return (
    <div
      style={{ margin: "2vw", alignItems: "center", justifyContent: "center" }}
    >
      <TabMenu />

      <div> {tabs[selectedIndex] && tabs[selectedIndex].component} </div>
    </div>
  );
};

export default ProductionSchedule;
