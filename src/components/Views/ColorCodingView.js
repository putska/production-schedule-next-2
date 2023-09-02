import React, { useState, useEffect, useRef } from "react";
import DataGrid, {
    Column,
    Grouping,
    GroupPanel,
    LoadPanel,
    SearchPanel,
    Summary,
    TotalItem,
    GroupItem,
    Sorting,
    SortByGroupSummaryInfo,
    Pager,
    Export,
    Paging,
    Editing,
    Form,
    RequiredRule,
    Popup,
    Lookup,
    Toolbar,
    Item,
    Scrolling,
} from "devextreme-react/data-grid";
import { Button, TagBox, ColorBox, DateBox } from "devextreme-react";

import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Grid,
    Button as MaterialButton,
    ButtonGroup,
    IconButton,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, ExpandMoreIcon, Add as AddIcon } from "@mui/icons-material";

import {
    month,
    convertToDate,
    convertDates,
    toOffset,
    toMondayDate,
    addDays,
    toWeeks,
    getMondays,
    getEmployees,
    lightOrDark
} from "@/lib/helper-functions";

export default function ColorCodingView(props) {
    const {
        categoryKey,

        handleAdd,
        handleDelete,
        handleUpdate
    } = props;

    const [expanded, setExpanded] = useState(true);

    const updateHandler = async (e, type) => {
        try {
            e.component.beginCustomLoading();
            await handleUpdate(e.data, type);
            e.component.endCustomLoading();
        } catch (error) {
            console.error(error);
            e.component.endCustomLoading();
        }
    };

    const addHandler = async (e, type) => {
        try {
            e.component.beginCustomLoading();
            await handleAdd(e.data, type);
            e.component.endCustomLoading();
        } catch (error) {
            console.error(error);
            e.component.endCustomLoading();
        }
    };

    const deleteHandler = async (e, type) => {
        try {
            e.component.beginCustomLoading();
            await handleDelete(e.data, type);
            e.component.endCustomLoading();
        } catch (error) {
            console.error(error);
            e.component.endCustomLoading();
        }
    };

    return (
        <Accordion style={{ marginBottom: "20px" }}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls='panel1a-content'
                id='panel1a-header'
            >
                <Typography>Adjust Shop Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container direction='column'>
                    <Grid item>
                        <DataGrid
                            dataSource={sortedShops}
                            showRowLines
                            showBorders
                            allowColumnResizing
                            columnAutoWidth
                            highlightChanges
                            repaintChangesOnly
                            columnResizingMode='widget'
                            wordWrapEnabled
                            autoExpandAll
                            cellHintEnabled
                            onInitNewRow={onShopRowInit}
                            onRowUpdated={(e) => updateHandler(e, "shop")}
                            onRowInserted={(e) => addHandler(e, "shop")}
                            onRowRemoved={(e) => deleteHandler(e, "shop")}
                        >
                            <Editing
                                mode='cell'
                                allowUpdating={canEdit}
                                allowAdding={canEdit}
                                allowDeleting={canEdit}
                                useIcons
                            />

                            <Column dataField='shop' caption='Shop'>
                                <RequiredRule />
                            </Column>
                            <Column
                                dataField='colorkey'
                                caption='Colorkey for Shop'
                                cellRender={(cell) => {
                                    return (
                                        <ColorBox
                                            applyValueMode='instantly'
                                            defaultValue={cell.data.colorkey}
                                            readOnly={true}
                                        />
                                    );
                                }}
                                editCellRender={(cell) => {
                                    return (
                                        <ColorBox
                                            defaultValue={cell.data.colorkey}
                                            onValueChange={(color) => cell.setValue(color)}
                                        />
                                    );
                                }}
                            />
                            <Column
                                dataField='fontColor'
                                caption='Font Color for Shop'
                                cellRender={(cell) => {
                                    return (
                                        <ColorBox
                                            readOnly={true}
                                            defaultValue={cell.data.fontColor}
                                        />
                                    );
                                }}
                                editCellRender={(cell) => {
                                    return (
                                        <ColorBox
                                            defaultValue={cell.data.fontColor}
                                            onValueChange={(color) => {
                                                cell.setValue(color);
                                            }}
                                        />
                                    );
                                }}
                            />
                        </DataGrid>
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    )
}