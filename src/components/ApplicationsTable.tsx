import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Menu,
    MenuItem,
    Chip
  } from "@mui/material";
  import MoreVertIcon from "@mui/icons-material/MoreVert";
  import React from "react";
  
  export default function ApplicationsTable({
    rows,
    onEdit,
    onView,
    onRename,
    onExportPdf,
    onExportExcel,
    onDelete
  }) {
    const [anchor, setAnchor] = React.useState(null);
    const [activeRow, setActiveRow] = React.useState(null);
  
    const openMenu = (e, row) => {
      setAnchor(e.currentTarget);
      setActiveRow(row);
    };
  
    const closeMenu = () => {
      setAnchor(null);
      setActiveRow(null);
    };
  
    return (
      <>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><b>Application name</b></TableCell>
              <TableCell><b>Funder</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell><b>Last updated</b></TableCell>
              <TableCell><b>Updated by</b></TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
  
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.applicationName}</TableCell>
                <TableCell>{row.funderName}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.status}
                    color={row.status === "Submitted" ? "success" : "default"}
                  />
                </TableCell>
                <TableCell>
                  {new Date(row.updatedAt).toLocaleString()}
                </TableCell>
                <TableCell>{row.updatedBy}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={(e) => openMenu(e, row)}>
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
  
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenu}>
          {activeRow?.status === "Drafted" && (
            <>
              <MenuItem onClick={() => { onEdit(activeRow); closeMenu(); }}>
                Edit
              </MenuItem>
              <MenuItem onClick={() => { onRename(activeRow); closeMenu(); }}>
                Rename
              </MenuItem>
            </>
          )}
  
          <MenuItem onClick={() => { onView(activeRow); closeMenu(); }}>
            View
          </MenuItem>
          <MenuItem onClick={() => { onExportPdf(activeRow); closeMenu(); }}>
            Export to PDF
          </MenuItem>
          <MenuItem onClick={() => { onExportExcel(activeRow); closeMenu(); }}>
            Export to Excel
          </MenuItem>
          <MenuItem onClick={() => { onDelete(activeRow); closeMenu(); }} sx={{ color: "error.main" }}>
            Delete
          </MenuItem>
        </Menu>
      </>
    );
  }