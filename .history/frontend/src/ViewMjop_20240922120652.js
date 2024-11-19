import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Container,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import * as XLSX from 'xlsx';
import InspectionReportView from './InspectionReportView';

const ViewMJOP = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/mjop/${id}`, { withCredentials: true });
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const exportToExcel = (tableData, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography>Error loading data: {error.message}</Typography>;
  }

  if (!data) {
    return <Typography>No data available</Typography>;
  }

  const { globalElements, globalSpaces } = data;

  const inspectionReportsData = globalElements.flatMap((element) =>
    element.inspectionReport.map((report) => ({
      Element: element.name,
      ReportName: report.name,
      Description: report.description,
      Condition: report.condition,
      Urgency: report.urgency,
      Type: report.elementType,
      Function: report.elementFunction,
      Unit: report.unit,
      EstimatedPrice: report.estimatedPrice,
      Remarks: report.remarks,
    }))
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Inspection Reports
        </Typography>

        <Tabs value={tabIndex} onChange={handleTabChange} centered>
          <Tab label="All Reports" />
          <Tab label="Filtered Reports" />
        </Tabs>

        <Divider sx={{ mb: 4 }} />

        {tabIndex === 0 && (
          <>
            <InspectionReportView
              globalElements={globalElements}
              globalSpaces={globalSpaces}
              filter="all"
              setFilter={setFilter}
              setGlobalElements={setData} // To update the global elements if needed
            />
          </>
        )}

        {tabIndex === 1 && (
          <>
            <InspectionReportView
              globalElements={globalElements}
              globalSpaces={globalSpaces}
              filter={filter}
              setFilter={setFilter}
              setGlobalElements={setData} // To update the global elements if needed
            />
          </>
        )}

        <Box mt={2} display="flex" justifyContent="center">
          <Button
            variant="contained"
            onClick={() => exportToExcel(inspectionReportsData, 'Inspection_Reports')}
          >
            Export to Excel
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ViewMJOP;
