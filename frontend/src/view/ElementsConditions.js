import React from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Button } from '@mui/material';
import * as XLSX from 'xlsx';

const ElementsConditions = ({ elementsData }) => {
  const exportToExcel = (tableData, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <Box mb={4}>
      <Typography variant="h5" gutterBottom>
        Elements and Conditions
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Condition</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {elementsData.map((element, index) => (
              <TableRow key={index}>
                <TableCell>{element.Name}</TableCell>
                <TableCell>{element.Description}</TableCell>
                <TableCell>{element.Condition}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box mt={2} display="flex" justifyContent="center">
        <Button variant="contained" onClick={() => exportToExcel(elementsData, 'Elements_Conditions')}>
          Export to Excel
        </Button>
      </Box>
    </Box>
  );
};

export default ElementsConditions;
