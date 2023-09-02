import React from "react";
import makeStyles from "@mui/styles/makeStyles";

import { NavLink } from "react-router-dom";
import Grid from "@mui/material/Grid";

const useStyles = makeStyles((theme) => ({
  link: {
    color: "white",
    textDecoration: "none",
    fontSize: "15px",
  },
  links: {
    listStyleType: "none",
    // border: '1px solid #ccc',
  },
  linkContainer: {
    padding: "1vw",
  },
}));

const TabPanel = (props) => {
  const classes = useStyles();

  const links = props.tabs.map((tab, i) => (
    <Grid item key={i}>
      <NavLink
        className={classes.link}
        to={tab.link}
        activeStyle={{
          fontWeight: "bold",
          color: "#19d2d2",
        }}
      >
        {tab.name}
      </NavLink>
    </Grid>
  ));

  return (
    <Grid container spacing={3}>
      {links}
    </Grid>
  );
};

export default TabPanel;
