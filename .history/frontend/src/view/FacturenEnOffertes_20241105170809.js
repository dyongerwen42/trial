import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Select, MenuItem, IconButton, TextField, FormControl, InputLabel, useTheme, TablePagination, InputAdornment } from '@mui/material';
import { Description as DescriptionIcon, FilterList as FilterListIcon, Search as SearchIcon } from '@mui/icons-material';
import { Line, Pie, Bar } from 'react-chartjs-2';
import fakeData from '../invoices.json';

const InvoiceDashboard = () => {
  const theme = useTheme();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Assuming invoicesData will not change, it can be memoized
  const invoicesData = useMemo(() => fakeData, []);

  const formattedInvoices = useMemo(() => invoicesData.flatMap((element) =>
    element.tasks.map((task) => ({
      name: task.name,
      elementName: element.elementName,
      price: task.price || 0, // Ensure price defaults to 0 if undefined
      dueDate: task.dueDate ? new Date(task.dueDate) : new Date(), // Convert to Date object early
      paymentStatus: task.paymentStatus,
      file: task.file,
    }))
  ), [invoicesData]);

  const filteredInvoices = useMemo(() => formattedInvoices.filter((invoice) => {
    const matchesFilter = filter === 'all' || invoice.paymentStatus === filter;
    const matchesSearch = invoice.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [formattedInvoices, filter, searchTerm]);

  const kpis = useMemo(() => {
    const totalInvoices = filteredInvoices.length;
    const totalOutstanding = filteredInvoices.reduce((sum, inv) => (
      inv.paymentStatus === 'niet betaald' ? sum + inv.price : sum
    ), 0);
    const totalPaid = filteredInvoices.reduce((sum, inv) => (
      inv.paymentStatus === 'betaald' ? sum + inv.price : sum
    ), 0);
    const overdueCount = filteredInvoices.filter((inv) => inv.paymentStatus === 'niet betaald' && inv.dueDate < new Date()).length;
    const averageInvoiceValue = totalInvoices > 0 ? (totalOutstanding + totalPaid) / totalInvoices : 0;

    return { totalInvoices, totalOutstanding, totalPaid, overdueCount, averageInvoiceValue };
  }, [filteredInvoices]);

  const lineChartData = useMemo(() => ({
    labels: filteredInvoices.map((invoice) => invoice.dueDate.toLocaleDateString('nl-NL')),
    datasets: [{
      label: 'Uitstaand Bedrag',
      data: filteredInvoices.map((invoice) => invoice.price),
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.primary.light,
      fill: true,
      tension: 0.4,
    }],
  }), [filteredInvoices, theme]);

  const pieChartData = useMemo(() => ({
    labels: ['Betaald', 'Niet Betaald'],
    datasets: [{
      data: [
        filteredInvoices.filter((inv) => inv.paymentStatus === 'betaald').length,
        filteredInvoices.filter((inv) => inv.paymentStatus === 'niet betaald').length,
      ],
      backgroundColor: [theme.palette.success.main, theme.palette.error.main],
    }],
  }), [filteredInvoices, theme]);

  const barChartData = useMemo(() => ({
    labels: Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('nl-NL', { month: 'long' })),
    datasets: [{
      label: 'Niet Betaalde Facturen',
      data: Array.from({ length: 12 }, (_, month) =>
        filteredInvoices.reduce((sum, inv) => (inv.paymentStatus === 'niet betaald' && inv.dueDate.getMonth() === month ? sum + inv.price : sum), 0)
      ),
      backgroundColor: theme.palette.error.main,
    }],
  }), [filteredInvoices, theme]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    const value = event.target.value;
    setRowsPerPage(value === 'all' ? filteredInvoices.length : parseInt(value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 4, maxWidth: '95vw', margin: '0 auto', bgcolor: theme.palette.background.default }}>
      {/* KPI Section */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {[{ label: 'Totaal Facturen', value: kpis.totalInvoices },
          { label: 'Uitstaand Bedrag', value: `€${kpis.totalOutstanding.toFixed(2)}` },
          { label: 'Totaal Betaald', value: `€${kpis.totalPaid.toFixed(2)}` },
          { label: 'Overtijd Betalingen', value: kpis.overdueCount },
          { label: 'Gemiddelde Factuurwaarde', value: `€${kpis.averageInvoiceValue.toFixed(2)}` }].map(({ label, value }, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3, bgcolor: theme.palette.background.paper, boxShadow: theme.shadows[10] }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.text.primary }}>{label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Chart Section */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, boxShadow: theme.shadows[10], borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Balans Trend</Typography>
            <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, boxShadow: theme.shadows[10], borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Betaalstatus</Typography>
            <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, boxShadow: theme.shadows[10], borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Niet Betaalde Facturen per Maand</Typography>
            <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InvoiceDashboard;
