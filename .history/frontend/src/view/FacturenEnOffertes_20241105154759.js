import React, { useState, useMemo } from 'react';
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
  TablePagination,
} from '@mui/material';
import { Description as DescriptionIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { useMjopContext } from '../MjopContext';
import fakeData from '../invoices.json';

const InvoiceDashboard = () => {
  const theme = useTheme();
  const { state } = useMjopContext();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Ensure invoicesData is valid
  const invoicesData = state.globalElements?.length ? state.globalElements : fakeData;

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

  const filteredInvoices = useMemo(() => {
    return formattedInvoices.filter((invoice) => {
      const matchesFilter = filter === 'all' || invoice.paymentStatus === filter;
      const matchesSearch = invoice.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [formattedInvoices, filter, searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const kpis = useMemo(() => {
    const totalInvoices = formattedInvoices.length;
    const totalOutstanding = formattedInvoices.reduce((sum, inv) => (
      inv.paymentStatus === 'niet betaald' ? sum + (inv.price || 0) : sum
    ), 0);
    const totalPaid = formattedInvoices.reduce((sum, inv) => (
      inv.paymentStatus === 'betaald' ? sum + (inv.price || 0) : sum
    ), 0);
    const overdueCount = formattedInvoices.filter((inv) => inv.paymentStatus === 'niet betaald' && new Date(inv.dueDate) < new Date()).length;
    const averageInvoiceValue = totalInvoices > 0 ? (totalOutstanding + totalPaid) / totalInvoices : 0;

    return {
      totalInvoices,
      totalOutstanding: totalOutstanding || 0, 
      totalPaid: totalPaid || 0,                
      overdueCount,
      averageInvoiceValue: averageInvoiceValue || 0,
    };
  }, [formattedInvoices]);

  const lineChartData = {
    labels: filteredInvoices.map((invoice) => new Date(invoice.dueDate).toLocaleDateString('nl-NL')),
    datasets: [
      {
        label: 'Uitstaand Bedrag (€)',
        data: filteredInvoices.map((invoice) => invoice.price || 0),
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

  const barChartData = {
    labels: [
      'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November'
    ],
    datasets: [
      {
        label: 'Niet Betaalde Facturen (€)',
        data: Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          return filteredInvoices.reduce((sum, inv) => (
            inv.paymentStatus === 'niet betaald' && new Date(inv.dueDate).getMonth() + 1 === month
              ? sum + (inv.price || 0)
              : sum
          ), 0);
        }),
        backgroundColor: theme.palette.error.main,
      },
    ],
  };

  return (
    <Box sx={{ p: 4, maxWidth: '95vw', margin: '0 auto', bgcolor: theme.palette.background.default }}>
      {/* KPI Section */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {[
          { label: 'Totaal Facturen', value: kpis.totalInvoices, color: 'primary' },
          { label: 'Uitstaand Bedrag (€)', value: kpis.totalOutstanding?.toFixed(2), color: 'error' },
          { label: 'Totaal Betaald (€)', value: kpis.?.toFixed(2), color: 'success' },
          { label: 'Overtijd Betalingen', value: kpis.overdueCount, color: 'warning' },
          { label: 'Gemiddelde Factuurwaarde (€)', value: kpis.averageInvoiceValue?.toFixed(2), color: 'secondary' },
        ].map(({ label, value, color }) => (
          <Grid item xs={12} md={2.4} key={label}>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3, bgcolor: theme.palette.background.paper }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{label}</Typography>
              <Typography variant="h4" color={color}>{value !== undefined ? value.toFixed(2) : '0.00'}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Chart Section */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, boxShadow: theme.shadows[4], borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Balans Trend</Typography>
            <Line data={lineChartData} options={{ responsive: true }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, boxShadow: theme.shadows[4], borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Betaalstatus</Typography>
            <Pie data={pieChartData} options={{ responsive: true }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, boxShadow: theme.shadows[4], borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Niet Betaalde Facturen per Maand</Typography>
            <Bar data={barChartData} options={{ responsive: true }} />
          </Paper>
        </Grid>
      </Grid>

      {/* Filter and Table Section */}
      <Grid container spacing={4} alignItems="center" sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filter op Status</InputLabel>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} startAdornment={<FilterListIcon />}>
              <MenuItem value="all">Alle</MenuItem>
              <MenuItem value="betaald">Betaald</MenuItem>
              <MenuItem value="niet betaald">Niet Betaald</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            variant="outlined"
            label="Zoek Factuur"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
      </Grid>

      {/* Invoice Table with Pagination */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: theme.shadows[2], mb: 4 }}>
        <Table>
          <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
            <TableRow>
              {['Naam', 'Bedrag (€)', 'Status', 'Vervaldatum', 'Acties'].map((header) => (
                <TableCell key={header}>
                  <Typography variant="h6" sx={{ color: 'white' }}>{header}</Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((invoice, index) => (
              <TableRow key={index} sx={{ '&:hover': { bgcolor: theme.palette.action.hover } }}>
                <TableCell>{invoice.name}</TableCell>
                <TableCell>€{(invoice.price || 0).toFixed(2)}</TableCell>
                <TableCell sx={{ color: invoice.paymentStatus === 'betaald' ? theme.palette.success.main : theme.palette.error.main }}>
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredInvoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default InvoiceDashboard;
