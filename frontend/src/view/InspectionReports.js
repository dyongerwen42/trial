import React from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Button } from '@mui/material';
import * as XLSX from 'xlsx';

const InspectionReports = ({ inspectionReportsData }) => {
  const formatCurrency = (value) => `€${parseFloat(value).toLocaleString()}`;

  const exportToExcel = (tableData, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <Box mb={4}>
      <Typography variant="h5" gutterBottom>
        Inspection Reports
      </Typography>
      {inspectionReportsData.length > 0 ? (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Element</TableCell>
                  <TableCell>Report Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Urgency</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Function</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Estimated Price</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inspectionReportsData.map((report, index) => (
                  <TableRow key={index}>
                    <TableCell>{report.Element}</TableCell>
                    <TableCell>{report.ReportName}</TableCell>
                    <TableCell>{report.Description}</TableCell>
                    <TableCell>{report.Condition}</TableCell>
                    <TableCell>{report.Urgency}</TableCell>
                    <TableCell>{report.Type}</TableCell>
                    <TableCell>{report.Function}</TableCell>
                    <TableCell>{report.Unit}</TableCell>
                    <TableCell>{formatCurrency(report.EstimatedPrice)}</TableCell>
                    <TableCell>{report.Remarks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box mt={2} display="flex" justifyContent="center">
            <Button variant="contained" onClick={() => exportToExcel(inspectionReportsData, 'Inspection_Reports')}>
              Export to Excel
            </Button>
          </Box>
        </>
      ) : (
        <Typography>No inspection reports available.</Typography>
      )}
    </Box>
  );
};

export default InspectionReports;
