import React, { useEffect } from "react";
import { Box, LinearProgress } from "@mui/material";

const LoadingScreen = () => {
  useEffect(() => {
   
  }, []);

  return (
    <div>
      <Box width={400}>
        <LinearProgress />
      </Box>
    </div>
  );
};

export default LoadingScreen;
