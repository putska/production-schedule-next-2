import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import TabPanel from "./TabPanel";

const Header = (props) => {
  return (
    <AppBar position='sticky'>
      <Toolbar variant='dense'>
        <Typography variant='h6' component='div' sx={{ mr: 7 }}>
          {"PS"}
        </Typography>

        <TabPanel tabs={props.tabs} />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
