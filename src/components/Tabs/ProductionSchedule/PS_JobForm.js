import React, { useState, useEffect } from "react";
import DataGrid, {
    Column,
    SearchPanel,
    Scrolling,
    MasterDetail,
    Export,
    Editing
} from "devextreme-react/data-grid";
import DateBox from 'devextreme-react/date-box';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import Typography from "@mui/material/Typography";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import Box from '@mui/material/Box';
import { SelectBox } from 'devextreme-react/select-box';
import Snackbar from '@mui/material/Snackbar';
import {
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    TextareaAutosize,
    Button as MaterialButton,
    Checkbox,
    Grid,
    FormControlLabel,
    FormGroup,
    Paper
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';

import {
    toMondayDate,
    toDays,
    toWeeks,
    addDays,
    createCalendarData,

    getJobName,
    getJobColor,
    getTask
} from "@/lib/helper-functions";

const formOptions = [

    { dataField: 'booked', label: "Booked", editorType: "bool", readOnly: false },
    { dataField: 'engineering', label: "Engineering", editorType: "bool", readOnly: false },
    { dataField: 'stickwall', label: "Stickwall", editorType: "bool", readOnly: false },
    { dataField: 'reserved', label: "Reserved", editorType: "bool", readOnly: false },

    { dataField: 'jobNumber', label: "Job Number", editorType: "text", readOnly: false },
    { dataField: 'jobName', label: "Job Name", editorType: "text", readOnly: false },
    { dataField: 'customer', label: "Customer", editorType: "text", readOnly: false },
    { dataField: 'wallType', label: "Wall Type", editorType: "text", readOnly: false },
    { dataField: 'unitsPerWeek', label: "Units Per Week", editorType: "text", type: "number", readOnly: false },
    { dataField: 'units', label: "Units", editorType: "text", type: "number", readOnly: false },
    { dataField: 'fieldStart', label: "Field Start Date", editorType: "date", readOnly: false },
    { dataField: 'weeksToGoBack', label: "Weeks to Go Back", editorType: "text", type: "number", readOnly: false },
    { dataField: 'emps', label: "Employees", editorType: "text", type: "number", readOnly: false },

    { dataField: 'weeks', label: "Weeks", editorType: "text", type: "number", readOnly: true },

    { dataField: 'start', label: "Shop Start Date", editorType: "date", readOnly: false },

    { dataField: 'metalTakeoff', label: "Metal Takeoff Date", editorType: "date", readOnly: true },
    { dataField: 'end', label: "End Date", editorType: "date", readOnly: true },
]


const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const JobForm = (props) => {
    const {
        formData,
        setFormData,
        formVisible,
        setFormVisible,
        hidePopup,
        jobs,
        shops,
        handleUpdate,
        handleAdd,
    } = props;

    const [height, setHeight] = useState(100);
    const [unitsFocused, setUnitsFocused] = useState(false);
    const [open, setOpen] = useState(false);

    const handleClose = () => {
        setOpen(false);
    }

    const savePopupForm = async () => {
        if (formData.ID) {
            await handleUpdate(formData, "job");
        } else {
            await handleAdd(formData, "job");
        }
        setFormVisible(false);
    }

    const overlapping = (newMetalTakeoff) => {
        let foundOverlappingDate = jobs.find(job => {
            return toMondayDate(job.metalTakeoff).toLocaleDateString() === newMetalTakeoff.toLocaleDateString()
        })

        return foundOverlappingDate != undefined;
    }

    const calculateMetalTakeoffDate = (startDate, weeksToGoBack) => {
        let newWeeksToGoBack = weeksToGoBack;
        let daysToAdd = newWeeksToGoBack * 7 * -1;
        let newMetalTakeoff = toMondayDate(addDays(new Date(startDate), daysToAdd));

        let foundOverlappingDate = overlapping(newMetalTakeoff);

        if (foundOverlappingDate) {
            setOpen(true);
        }

        while (foundOverlappingDate) {
            newWeeksToGoBack++;
            daysToAdd = newWeeksToGoBack * 7 * -1;
            newMetalTakeoff = toMondayDate(addDays(new Date(startDate), daysToAdd));
            foundOverlappingDate = overlapping(newMetalTakeoff);
        }

        return { newMetalTakeoff: newMetalTakeoff, newWeeksToGoBack: newWeeksToGoBack }
    }

    const handleInputChange = (option, value) => {

        if (!option.readOnly && value != undefined) {
            let updatedValue = value;

            if (option.editorType === "date") {
                const parsedDate = Date.parse(value);
                updatedValue = isNaN(parsedDate) ? new Date() : new Date(parsedDate);
            } else if (option.editorType === "text" && option.type === "number") {
                updatedValue = parseInt(value);
            }

            // const startUpdated = false;
            // if (option.dataField === "start" && (updatedValue > formData.start || updatedValue < formData.start)) {
                
            // }

            const newFormData = {
                ...formData,
                [option.dataField]: updatedValue,
            }


            // EDIT NECESSARY FIELDS

            // weeks
            if (!newFormData.stickwall && newFormData.unitsPerWeek > 0) {
                newFormData.weeks = Math.ceil(newFormData.units / newFormData.unitsPerWeek);
            } else if (newFormData.stickwall) {
                newFormData.weeks = 0;
                newFormData.unitsPerWeek = 0;
            }

            // shop start
            if (newFormData.start == null && newFormData.fieldStart != null && newFormData.weeks >= 0 && !unitsFocused) {
                const daysToAdd = newFormData.weeks * 7 * -1; // multiply by -1 bc start is before field start
                newFormData.start = addDays(newFormData.fieldStart, daysToAdd);
                newFormData.start = toMondayDate(newFormData.start);
            }

            // metal takeoff 

            if (newFormData.start != null && newFormData.weeksToGoBack >= 0) {
                const {
                    newMetalTakeoff,
                    newWeeksToGoBack
                } = calculateMetalTakeoffDate(newFormData.start, newFormData.weeksToGoBack);
                newFormData.metalTakeoff = newMetalTakeoff;
                newFormData.newWeeksToGoBack = newWeeksToGoBack;
            }


            // end date
            if (newFormData.weeks >= 0 && newFormData.start != null) {
                newFormData.end = addDays(newFormData.start, newFormData.weeks * 7);
            }
            setFormData(newFormData);
        }
    };

    return (
        <Dialog open={formVisible} onClose={hidePopup} scroll="paper" fullWidth >
            <DialogTitle>{formData.jobName}</DialogTitle>
            <DialogContent height={`${height}`} width={`auto`}>
                <Grid container spacing={2} direction="row">
                    <Grid item xs={100}>
                        <SelectBox
                            dataSource={shops}
                            value={formData.groupKey}
                            valueExpr="__KEY__"
                            displayExpr="shop"
                            style={{ padding: "10px", fontSize: "18px" }}
                            onValueChanged={(e) => handleInputChange({ dataField: "groupKey" }, e.value)}
                        />
                    </Grid>

                    {formOptions.map((option, i) => (
                        <Grid item key={i} xs={6}>
                            {option.editorType === "bool" &&
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData[option.dataField]}
                                            disabled={option.readOnly}
                                            style={{ float: "left" }}
                                            onChange={(e) => handleInputChange(option, e.target.checked)}
                                        />
                                    }
                                    label={option.label}
                                />
                            }

                            {(option.editorType === "text" && !option.readOnly) &&

                                <TextField
                                    label={option.label}
                                    variant="outlined"
                                    fullWidth
                                    type={option.type}
                                    value={formData[option.dataField]}
                                    onChange={(e) => handleInputChange(option, e.target.value)}
                                    onFocus={() => {
                                        if (option.dataField === "units") {
                                            setUnitsFocused(true);
                                        }
                                    }}
                                    onBlur={() => {
                                        if (option.dataField === "units") {
                                            const newFormData = { ...formData }
                                            if (newFormData.start == null && newFormData.fieldStart != null && newFormData.weeks >= 0) {
                                                const daysToAdd = newFormData.weeks * 7 * -1; // multiply by -1 bc start is before field start
                                                newFormData.start = addDays(newFormData.fieldStart, daysToAdd);
                                                newFormData.start = toMondayDate(newFormData.start);
                                            }
                                            setFormData(newFormData)
                                            setUnitsFocused(false);
                                        }
                                    }}
                                />
                            }

                            {(option.editorType === "text" && option.readOnly) &&

                                <TextField
                                    label={option.label}
                                    fullWidth
                                    variant="outlined"
                                    value={!isNaN(formData[option.dataField]) ? formData[option.dataField] : 0}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                />
                            }

                            {(option.editorType === "date" && !option.readOnly) &&
                                <DateBox
                                    value={formData[option.dataField]}
                                    label={option.label}
                                    style={{ padding: "12px", margin: "0" }}
                                    onValueChanged={(e) => handleInputChange(option, e.value)}
                                    type="date"
                                />
                            }

                            {(option.editorType === "date" && option.readOnly) &&
                                <DateBox
                                    value={formData[option.dataField]}
                                    label={option.label}
                                    style={{ padding: "12px", margin: "0" }}
                                    type="date"
                                    readOnly
                                />
                            }
                        </Grid>
                    ))}

                    <Snackbar
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        open={open}
                        onClose={handleClose}
                        autoHideDuration={3000}
                    >
                        <Alert severity="info">
                            Weeks to go back automatically updated to avoid overlapping metal takeoff dates!
                        </Alert>
                    </Snackbar>
                </Grid>
            </DialogContent>

            <DialogActions>
                <MaterialButton onClick={savePopupForm} variant="outlined" >Save</MaterialButton>
                <MaterialButton onClick={hidePopup}>Cancel</MaterialButton>
            </DialogActions>
        </Dialog>
    );
};

export default JobForm;
