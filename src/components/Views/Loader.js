import React, { useEffect } from "react";
import NProgress from "nprogress";
import { Box, LinearProgress } from "@mui/material";

const Loader = () => {

  useEffect(() => {
    NProgress.start();

    return () => {
      NProgress.done();
    };
  }, []);

  return (
    <div className={classes.root}>
      <Box width={400} style={{
        alignItems: "center",
        backgroundColor: theme.palette.background.default,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justify: "center",
        minHeight: "100%",
      }}>
        <LinearProgress />
      </Box>
    </div>
  );
};

export default Loader;