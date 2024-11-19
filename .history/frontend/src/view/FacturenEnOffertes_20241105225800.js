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
  InputAdornment,
  Button,
} from '@mui/material';
import { DateRangePicker } from '@mui/lab';
import { Description as DescriptionIcon, FilterList as FilterListIcon, Search as SearchIcon, PictureAsPdf as PdfIcon, FileDownload as ExcelIcon } from '@mui/icons-material';
import { Line, Pie, Bar } from 'react-chartjs-2';
import fakeData from '../invoices.json';

const InvoiceDashboard = () => {
  const theme = useTheme();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState([null, null]);

  const formattedInvoices = useMemo(() => (
    fakeData.flatMap((element) =>
      element.tasks.map((task) => ({
        name: task.name,
        elementName: element.elementName,
        price: task.price || 0,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        paymentStatus: task.paymentStatus,
        file: task.file,
      }))
    )
  ), []);

  const filteredInvoices = useMemo(() => (
    formattedInvoices.filter((invoice) => {
      const matchesFilter = filter === 'all' || invoice.paymentStatus === filter;
      const matchesSearch = invoice.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDateRange = (!dateRange[0] || invoice.dueDate >= dateRange[0]) &&
                               (!dateRange[1] || invoice.dueDate <= dateRange[1]);
      return matchesFilter && matchesSearch && matchesDateRange;
    })
  ), [formattedInvoices, filter, searchTerm, dateRange]);

  const kpis = useMemo(() => {
    const totalInvoices = filteredInvoices.length;
    const totalOutstanding = filteredInvoices.reduce((sum, inv) => (
      inv.paymentStatus === 'niet betaald' ? sum + inv.price : sum
    ), 0);
    const totalPaid = filteredInvoices.reduce((sum, inv) => (
      inv.paymentStatus === 'betaald' ? sum + inv.price : sum
    ), 0);
    const overdueCount = filteredInvoices.filter((inv) => 
      inv.paymentStatus === 'niet betaald' && inv.dueDate && inv.dueDate < new Date()
    ).length;
    const averageInvoiceValue = totalInvoices > 0 ? (totalOutstanding + totalPaid) / totalInvoices : 0;

    return {
      totalInvoices,
      totalOutstanding,
      totalPaid,
      overdueCount,
      averageInvoiceValue,
    };
  }, [filteredInvoices]);

  const lineChartData = useMemo(() => ({
    labels: filteredInvoices.map((invoice) => invoice.dueDate ? invoice.dueDate.toLocaleDateString('nl-NL') : ''),
    datasets: [
      {
        label: 'Uitstaand Bedrag',
        data: filteredInvoices.map((invoice) => invoice.price),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        fill: true,
        tension: 0.4,
      },
    ],
  }), [filteredInvoices, theme.palette.primary.main, theme.palette.primary.light]);

  const pieChartData = useMemo(() => ({
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
  }), [filteredInvoices, theme.palette.success.main, theme.palette.error.main]);

  const barChartData = useMemo(() => ({
    labels: ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'],
    datasets: [
      {
        label: 'Niet Betaalde Facturen',
        data: Array.from({ length: 12 }, (_, i) => 
          filteredInvoices.reduce((sum, inv) => (
            inv.paymentStatus === 'niet betaald' && inv.dueDate && inv.dueDate.getMonth() === i ? sum + inv.price : sum
          ), 0)
        ),
        backgroundColor: theme.palette.error.main,
      },
    ],
  }), [filteredInvoices, theme.palette.error.main]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    const value = event.target.value;
    setRowsPerPage(value === 'all' ? filteredInvoices.length : parseInt(value, 10));
    setPage(0);
  };

  const handleExportExcel = () => {
    console.log('Export to Excel');
  };

  const handleExportPDF = () => {
    console.log('Export to PDF');
  };

<Grid container spacing={4} sx={{ mb: 4 }}>
  <Grid item xs={12} md={4}>
    <Paper sx={{ p: 3, boxShadow: theme.shadows[10], borderRadius: 3, height: 300 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Balans Trend</Typography>
      <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false, height: 200 }} />
    </Paper>
  </Grid>
  <Grid item xs={12} md={4}>
    <Paper sx={{ p: 3, boxShadow: theme.shadows[10], borderRadius: 3, height: 300 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Betaalstatus</Typography>
      <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false, height: 200 }} />
    </Paper>
  </Grid>
  <Grid item xs={12} md={4}>
    <Paper sx={{ p: 3, boxShadow: theme.shadows[10], borderRadius: 3, height: 300 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Niet Betaalde Facturen per Maand</Typography>
      <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false, height: 200 }} />
    </Paper>
  </Grid>
</Grid>

  
  
  
  
  
  
  
  
};

export default InvoiceDashboard;
