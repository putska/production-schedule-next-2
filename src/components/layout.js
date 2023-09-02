import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link'
import logo from '@/assets/ww logo.png'

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useRouter } from 'next/router';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Stack
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const url = '/Portal/ReactModules/ProductionScheduleNext'; // TO DO: add actual URL later
// const baseURL = 'http://wwweb/portal/reactmodules/productionschedulenext';
const localURL = 'http://localhost:3000';

const MUI_BLUE = "#1976d2";

const tabs = [
  { name: 'Production Schedule', link: `${url}/production-schedule.html` },
  { name: 'Shop Drawings', link: `${url}/shop-drawings.html` },
  { name: 'Takeoff Matrix', link: `${url}/takeoff-matrix.html` },
  { name: 'Panel Matrix', link: `${url}/panel-matrix.html` },
  { name: 'Fab Matrix', link: `${url}/fab-matrix.html` },
  { name: 'All Activities', link: `${url}/all-activities.html` },
  { name: 'Glass & Gasket', link: `${url}/glass-and-gasket.html` },
  { name: 'Metal', link: `${url}/metal.html` },
  { name: 'Field', link: `${url}/field.html` },
  { name: 'Packaging', link: `${url}/packaging.html` },
  { name: 'Purchasing', link: `${url}/purchasing.html` },
  { name: 'JMP Field Tracking Log', link: `${url}/jmp-field-tracking.html` },
  { name: 'PS Settings', link: `${url}/ps-settings.html` },
];

const localTabs = [
  { name: 'Production Schedule', link: `${localURL}/production-schedule` },
  { name: 'Shop Drawings', link: `${localURL}/shop-drawings` },
  { name: 'Takeoff Matrix', link: `${localURL}/takeoff-matrix` },
  { name: 'Panel Matrix', link: `${localURL}/panel-matrix` },
  { name: 'Fab Matrix', link: `${localURL}/fab-matrix` },
  { name: 'All Activities', link: `${localURL}/all-activities` },
  { name: 'Glass & Gasket', link: `${localURL}/glass-and-gasket` },
  { name: 'Metal', link: `${localURL}/metal` },
  { name: 'Field', link: `${localURL}/field` },
  { name: 'Packaging', link: `${localURL}/packaging` },
  { name: 'Purchasing', link: `${localURL}/purchasing` },
  { name: 'JMP Field Tracking Log', link: `${localURL}/jmp-field-tracking` },
  { name: 'PS Settings', link: `${localURL}/ps-settings` },
];

export default function Layout({ children }) {
  const router = useRouter();
  const [currTabs, setCurrTabs] = useState(tabs);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [currentTabName, setCurrentTabName] = useState("");

//   useEffect(() => {
//     if (typeof window !== 'undefined' && window.localStorage) {
//         const storedValue = localStorage.getItem("shop-drawings_sortByName");
//         setSortByName(storedValue ? storedValue : "true"); // Convert the value to the desired data type
//     }
//     const today = new Date();
//     updateWeek(today);
// }, [])

// useEffect(() => {
//     localStorage.setItem("lastOpenedTab", router.asPath);
// }, [currentTabName]);

  useEffect(() => {
    setCurrentTabName(getTabName(router.asPath));
  }, []);

  useEffect(() => {
    setCurrentTabName(getTabName(router.asPath));
  }, [router.asPath]);

  const getTabName = (path) => {
    if (process.env.NODE_ENV === 'development') {
      setCurrTabs(localTabs)
      const currTab = localTabs.find(tab => tab.link === localURL + path) || localTabs[0];
      return currTab.name;
    } else {
      setCurrTabs(tabs)
      const currTab = tabs.find(tab => tab.link === path) || tabs[0];
      return currTab.name;
    }

  };

  const toggleDrawer = (open) => (event) => {
    if (
      event &&
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setOpenDrawer(open);
  };

  const handleTabChange = (name) => {
    setCurrentTabName(name);
    toggleDrawer(false);
    setOpenDrawer(false);
  }

  const sideList = () => (
    <Stack spacing={2} direction="column" style={{ padding: "5%", minWidth: "30vw" }}>
      {currTabs.map((tab, index) => (
        <Link
          key={index}
          href={tab.link}
          onClick={(e) => handleTabChange(tab.name)}
          className='link'
          style={{ fontSize: "max(15px, 1vw)" }}
        >
          {tab.name}
        </Link>
      ))}
    </Stack>
  );

  return (
    <>
      <AppBar position="sticky" style={{ padding: "20px" }}>
        <Toolbar variant="dense">
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Image
                src={logo}
                priority
                alt="Logo"
                style={{ minWidth: "40px", width: "5vw", height: "auto" }}
              />
            </Grid>
            <Grid item>
              <Typography style={{ fontSize: "max(15px, 3vw)" }}>
                {currentTabName}
              </Typography>
            </Grid>
            <Grid item>
              <IconButton
                color="inherit"
                onClick={toggleDrawer(true)}
                size="large"
              >
                <MenuIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={toggleDrawer(false)}
      >
        {sideList()}
      </Drawer>

      <div style={{ padding: "3vw" }}>{children}</div>
    </>
  );
}