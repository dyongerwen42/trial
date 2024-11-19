import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Tooltip,
  Select,
  MenuItem,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  useTheme,
} from '@mui/material';
import { Description as DescriptionIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { Line, Pie, Bar } from 'react-chartjs-2';
import fakeData from './fakeData'; // Assume fakeData includes added fields like 'price' and 'dueDate'

const InvoiceDashboard = () => {
  const theme = useTheme();
  const [filter, setFilter] = useState('all');
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Filtering logic for invoices based on selected filter and search term
    const filtered = fakeData.filter((invoice) => {
      const matchesFilter = filter === 'all' || invoice.paymentStatus === filter;
      const matchesSearch = invoice.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
    setFilteredInvoices(filtered);
  }, [filter, searchTerm]);

  // Dynamic KPIs
  const kpis = useMemo(() => {
    const totalInvoices = fakeData.length;
    const totalOutstanding = fakeData.reduce((sum, inv) => sum + (inv.paymentStatus === 'niet betaald' ? inv.price : 0), 0);
    const overdueCount = fakeData.filter((inv) => inv.paymentStatus === 'niet betaald' && new Date(inv.dueDate) < new Date()).length;
    const averagePaymentTime = 15; // Placeholder - calculate based on actual payment times

    return { totalInvoices, totalOutstanding, overdueCount, averagePaymentTime };
  }, [fakeData]);

  // Chart Data for trends and insights
  const lineChartData = {
    labels: filteredInvoices.map((invoice) => new Date(invoice.dueDate).toLocaleDateString()),
    datasets: [
      {
        label: 'Outstanding Balance (€)',
        data: filteredInvoices.map((invoice) => invoice.price),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const pieChartData = {
    labels: ['Betaald', 'Niet Betaald'],
    datasets: [
      {
        data: [
          filteredInvoices.filter((inv) => inv.paymentStatus === 'betaald').length,
          filteredInvoices.filter((inv) => inv.paymentStatus === 'niet betaald').length,
        ],
        backgroundColor: [theme.palette.success.main, theme.palette.error.main],
      },
    ],
  };

  // Dynamic filters and sorting (more options can be added)
  const handleFilterChange = (e) => setFilter(e.target.value);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  return (
    <Box sx={{ p: 4, maxWidth: '95vw', margin: '0 auto', bgcolor: theme.palette.background.default }}>
      {/* KPI Section */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Totaal Facturen</Typography>
            <Typography variant="h4" color="primary">{kpis.totalInvoices}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Uitstaand Bedrag (€)</Typography>
            <Typography variant="h4" color="error">{kpis.totalOutstanding.toFixed(2)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Overtijd Betalingen</Typography>
            <Typography variant="h4" color="warning">{kpis.overdueCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Gemiddelde Betaaltijd</Typography>
            <Typography variant="h4" color="secondary">{kpis.averagePaymentTime} Dagen</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Chart Section */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, boxShadow: theme.shadows[4] }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Balans Trend (Line Chart)</Typography>
            <Line data={lineChartData} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, boxShadow: theme.shadows[4] }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Betaalstatus (Pie Chart)</Typography>
            <Pie data={pieChartData} />
          </Paper>
        </Grid>
      </Grid>

      {/* Filter and Table Section */}
      <Grid container spacing={4} alignItems="center" sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Filter op Status</InputLabel>
            <Select value={filter} onChange={handleFilterChange} startAdornment={<FilterListIcon />}>
              <MenuItem value="all">Alle</MenuItem>
              <MenuItem value="betaald">Betaald</MenuItem>
              <MenuItem value="niet betaald">Niet Betaald</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            label="Zoek Factuur"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
        <Table>
          <TableHead sx={{ bgcolor: theme.palette.primary.light }}>
            <TableRow>
              <TableCell><Typography variant="h6">Naam</Typography></TableCell>
              <TableCell><Typography variant="h6">Bedrag (€)</Typography></TableCell>
              <TableCell><Typography variant="h6">Status</Typography></TableCell>
              <TableCell><Typography variant="h6">Datum</Typography></TableCell>
              <TableCell><Typography variant="h6">Acties</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.map((invoice, index) => (
              <TableRow key={index} sx={{ '&:hover': { bgcolor: theme.palette.action.hover } }}>
                <TableCell>{invoice.name}</TableCell>
                <TableCell>{invoice.price.toFixed(2)}</TableCell>
                <TableCell sx={{ color: invoice.paymentStatus === 'betaald' ? 'success.main' : 'error.main' }}>
                  {invoice.paymentStatus}
                </TableCell>
                <TableCell>{new Date(invoice.dueDate).toLocaleDateString('nl-NL')}</TableCell>
                <TableCell>
                  <Tooltip title="Download">
                    <IconButton href={`http://localhost:5000/${invoice.file}`} target="_blank" color="primary">
                      <DescriptionIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InvoiceDashboard;
