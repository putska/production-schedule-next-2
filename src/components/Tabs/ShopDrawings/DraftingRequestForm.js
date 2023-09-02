import React, { useState, useEffect } from "react";
import DataGrid, {
    Column,
    Grouping,
    GroupPanel,
    SearchPanel,
    Editing,
    RequiredRule,
    Lookup,
    Scrolling,
    MasterDetail,
    Export,
    Popup
} from "devextreme-react/data-grid";
import DateBox from 'devextreme-react/date-box';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    TextareaAutosize,
    Button as MaterialButton,
    IconButton,
    Divider,
    Checkbox,
    Grid,
    FormControlLabel,
    FormGroup,
    Paper
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import {
    createShopDrawingDates,
    createShopDrawingsEmployees,
    toMondayDate
} from "@/lib/helper-functions";
import { isEqual } from 'lodash';
import { useForm } from "react-hook-form"

const DraftingRequestForm = ({ jobs }) => {

    const [formVisible, setFormVisible] = useState(true);

    const showPopup = () => {
        setFormVisible(true)

    }
    const hidePopup = () => {
        setFormVisible(false)
    }

    return (
        <div>

            {formVisible && (
                <Dialog open={formVisible} onClose={hidePopup} scroll="paper" fullWidth >
                    <DialogTitle>
                        <Typography variant="h5">Drafting and Engineering Revision Form</Typography>
                        <Typography variant="caption">This form is to be filled out after W&Ws first Shop Drawings submittal</Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} direction="column" style={{ margin: "20px" }}>
                            <DialogContentText>
                                <Typography variant="h4"></Typography>
                            </DialogContentText>

                            {/* <FormControl fullWidth>
                                        <InputLabel id="jobName-label">Job Name</InputLabel>
                                        <Select
                                            labelId="jobName-label"
                                            id="jobName"
                                            defaultValue={taskData.jobName}
                                            // onChange={(e) => handleChange(e, "jobName", taskData)}
                                            label="Job Name"
                                        >
                                            {jobNames.map(name => <MenuItem value={name}>{name}</MenuItem>)}
                                        </Select>
                                    </FormControl> */}
                            <TextField
                                fullWidth
                                id="jobName"
                                label="Job Name"
                                // defaultValue={taskData.task}
                                // onChange={(e) => handleChange(e, "task", taskData)}
                                margin="normal"
                                variant="outlined"
                            />

                            <TextField
                                fullWidth
                                id="jobNumber"
                                label="Job Number"
                                // defaultValue={taskData.task}
                                // onChange={(e) => handleChange(e, "task", taskData)}
                                margin="normal"
                                variant="outlined"
                            />

                            <DateBox
                                defaultValue={new Date()}
                                label="Current Date"
                                style={{ width: "50%", padding: "10px" }}
                                type="date"
                            />

                            <FormControl>
                                <Typography style={{margin: "10px"}}>Estimated Drafting Time</Typography>
                                <Stack direction="row" spacing={1}>

                                    <TextField
                                        label="Days"
                                        type="number"
                                        // value={days}
                                        // onChange={handleDaysChange}
                                        style={{width: "50%"}}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        inputProps={{
                                            min: 0,
                                        }}
                                    />

                                    <TextField
                                        label="Hours"
                                        type="number"
                                        // value={hours}
                                        // onChange={handleHoursChange}
                                        style={{width: "50%"}}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        inputProps={{
                                            min: 0,
                                            max: 23,
                                        }}
                                    />
                                </Stack>

                            </FormControl>

                            <FormControl>
                                <Typography style={{margin: "10px"}}>Estimated Takeoff Time</Typography>
                                <Stack direction="row" spacing={1}>

                                    <TextField
                                        label="Days"
                                        type="number"
                                        // value={days}
                                        // onChange={handleDaysChange}
                                        style={{width: "50%"}}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        inputProps={{
                                            min: 0,
                                        }}
                                    />

                                    <TextField
                                        label="Hours"
                                        type="number"
                                        // value={hours}
                                        // onChange={handleHoursChange}
                                        style={{width: "50%"}}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        inputProps={{
                                            min: 0,
                                            max: 23,
                                        }}
                                    />
                                </Stack>

                            </FormControl>

                            <FormControl>
                                <Typography style={{margin: "10px"}}>Drafting Revisions To Be Completed By</Typography>
                                

                            </FormControl>


                           



                            <FormControl fullWidth>
                                <InputLabel id="status-label">Status</InputLabel>
                                <Select
                                    labelId="status-label"
                                    id="status"
                                    // defaultValue={taskData.status}
                                    // onChange={(e) => handleChange(e, "status", taskData)}
                                    label="Job Name"
                                >
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="In Progress">In Progress</MenuItem>
                                    <MenuItem value="Completed">Completed</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <Stack direction="row" spacing={1}>
                                    <DateBox
                                        // defaultValue={taskData.startDate}
                                        label="start"
                                        style={{ width: "50%" }}
                                        type="date" />

                                    <DateBox
                                        // defaultValue={taskData.endDate}
                                        label="end"
                                        style={{ width: "50%" }}
                                        type="date" />
                                </Stack>

                            </FormControl>


                            <InputLabel id="notes">Notes</InputLabel>
                            <TextareaAutosize
                                id="notes"
                                label="Notes"
                                minRows={5}
                                placeholder="Enter notes"
                                // defaultValue={taskData.notes}
                                // onChange={(e) => handleChange(e, "notes", taskData)}
                                style={{ width: '100%', padding: "10px" }}
                            />

                            <InputLabel id="problems">Problems</InputLabel>
                            <TextareaAutosize
                                id="problems"
                                label="Problems"
                                minRows={3}
                                placeholder="Enter problems"
                                // defaultValue={taskData.problems}
                                // onChange={(e) => handleChange(e, "problems", taskData)}
                                style={{ width: '100%', padding: "10px" }}
                            />
                        </Stack>

                    </DialogContent>

                    <DialogActions>
                        <MaterialButton variant="outlined" onClick={hidePopup}>Save</MaterialButton>
                        <MaterialButton onClick={hidePopup}>Cancel</MaterialButton>
                    </DialogActions>
                </Dialog>
            )}
        </div>
    )
}



export default DraftingRequestForm;
