import { Box, Button, List, ListItem, ListItemText, Paper, Stack, Typography } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GridOnIcon from "@mui/icons-material/GridOn";
import { exportApplicationExcel, exportApplicationPdf } from "../utilities/exporters";

export default function Step4Export({
    applicationName,
    funderName,
    commonItems,
    additionalItems
  }) {
    const exportPdf = () => {
      exportApplicationPdf(applicationName, funderName, commonItems, additionalItems);
    };
    
      // ---------- Export: Excel ----------
    const exportExcel = () => {
      exportApplicationExcel(applicationName, funderName, commonItems, additionalItems);
    };
    return (
        <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                Export
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Export the preview as PDF and Excel.
              </Typography>
        
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    startIcon={<PictureAsPdfIcon />}
                    variant="contained"
                    onClick={exportPdf}
                    disabled={commonItems.length === 0 && additionalItems.length === 0}
                  >
                    Export PDF
                  </Button>
        
                  <Button
                    startIcon={<GridOnIcon />}
                    variant="outlined"
                    onClick={exportExcel}
                    disabled={commonItems.length === 0 && additionalItems.length === 0}
                  >
                    Export Excel
                  </Button>
                </Stack>
        
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                  PDF uses jsPDF + AutoTable (table layout). [2](https://www.npmjs.com/package/jspdf-autotable)[3](https://phppot.com/javascript/jspdf-autotable/)
                  <br />
                  Excel uses SheetJS (xlsx) and triggers a browser download via writeFile. [4](https://docs.sheetjs.com/docs/api/write-options/)[5](https://www.npmjs.com/package/xlsx)
                </Typography>
              </Paper>
            </Box>
    );
  }