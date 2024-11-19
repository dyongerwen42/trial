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
import { Line, Pie } from 'react-chartjs-2';
import { useMjopContext } from './MjopContext';
import fakeData from './invoices.json';

const InvoiceDashboard = () => {
  const theme = useTheme();
  const { state } = useMjopContext();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Determine if we are using real data from the context or fake data
  const invoicesData = state.globalElements?.length ? state.globalElements : fakeData;

  // Format the data to create a list of invoices
  const formattedInvoices = useMemo(() => (
    invoicesData.flatMap((element) => 
      element.tasks.map((task) => ({
        name: task.name,
        elementName: element.elementName,
        price: task.price,
        dueDate: task.dueDate,
        paymentStatus: task.paymentStatus,
        file: task.file,
      }))
    )
  ), [invoicesData]);

  // Apply filtering
  const filteredInvoices = useMemo(() => (
    formattedInvoices.filter((invoice) => {
      const matchesFilter = filter === 'all' || invoice.paymentStatus === filter;
      const matchesSearch = invoice.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    })
  ), [formattedInvoices, filter, searchTerm]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalInvoices = formattedInvoices.length;
    const totalOutstanding = formattedInvoices.reduce((sum, inv) => (
      inv.paymentStatus === 'niet betaald' ? sum + inv.price : sum
    ), 0);
    const overdueCount = formattedInvoices.filter((inv) => (
      inv.paymentStatus === 'niet betaald' && new Date(inv.dueDate) < new Date()
    )).length;

    return { totalInvoices, totalOutstanding, overdueCount };
  }, [formattedInvoices]);

  // Chart Data
  const lineChartData = {
    labels: filteredInvoices.map((invoice) => new Date(invoice.dueDate).toLocaleDateString('nl-NL')),
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

  return (
    <Box sx={{ p: 4, maxWidth: '95vw', margin: '0 auto', bgcolor: theme.palette.background.default }}>
      {/* KPI Section */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Totaal Facturen</Typography>
            <Typography variant="h4" color="primary">{kpis.totalInvoices}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Uitstaand Bedrag (€)</Typography>
            <Typography variant="h4" color="error">{kpis.totalOutstanding.toFixed(2)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Overtijd Betalingen</Typography>
            <Typography variant="h4" color="warning">{kpis.overdueCount}</Typography>
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
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} startAdornment={<FilterListIcon />}>
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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
      </Grid>

      {/* Invoice Table */}
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
