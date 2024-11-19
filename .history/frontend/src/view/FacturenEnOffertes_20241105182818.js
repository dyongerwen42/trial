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
  TablePagination,
  Checkbox,
  Collapse,
  TableSortLabel,
} from '@mui/material';
import { Description as DescriptionIcon, FilterList as FilterListIcon, Search as SearchIcon, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { DateRangePicker } from '@mui/lab';
import { Line, Pie, Bar } from 'react-chartjs-2';
import fakeData from '../invoices.json';

const InvoiceDashboard = () => {
  const [filter, setFilter] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState([null, null]);
  const [visibleColumns, setVisibleColumns] = useState(['name', 'price', 'status', 'dueDate', 'actions']);
  const [expandedRows, setExpandedRows] = useState({});
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const formattedInvoices = useMemo(() => fakeData.flatMap((element) =>
    element.tasks.map((task) => ({
      name: task.name,
      elementName: element.elementName,
      price: task.price || 0,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      paymentStatus: task.paymentStatus,
      file: task.file,
      additionalInfo: task.additionalInfo || "No additional info available",
    }))
  ), []);

  const filteredInvoices = useMemo(() => formattedInvoices
    .filter((invoice) => {
      const matchesFilter = filter.length === 0 || filter.includes(invoice.paymentStatus);
      const matchesSearch = invoice.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = (!dateRange[0] || invoice.dueDate >= dateRange[0]) && (!dateRange[1] || invoice.dueDate <= dateRange[1]);
      return matchesFilter && matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const compareA = a[sortColumn];
      const compareB = b[sortColumn];
      if (sortDirection === 'asc') return compareA < compareB ? -1 : compareA > compareB ? 1 : 0;
      return compareA > compareB ? -1 : compareA < compareB ? 1 : 0;
    }), [formattedInvoices, filter, searchTerm, dateRange, sortColumn, sortDirection]);

  const kpis = useMemo(() => {
    const totalInvoices = filteredInvoices.length;
    const totalOutstanding = filteredInvoices.reduce((sum, inv) => inv.paymentStatus === 'niet betaald' ? sum + inv.price : sum, 0);
    const totalPaid = filteredInvoices.reduce((sum, inv) => inv.paymentStatus === 'betaald' ? sum + inv.price : sum, 0);
    const overdueCount = filteredInvoices.filter((inv) => inv.paymentStatus === 'niet betaald' && inv.dueDate < new Date()).length;
    const averageInvoiceValue = totalInvoices ? (totalOutstanding + totalPaid) / totalInvoices : 0;

    return { totalInvoices, totalOutstanding, totalPaid, overdueCount, averageInvoiceValue };
  }, [filteredInvoices]);

  const lineChartData = useMemo(() => ({
    labels: filteredInvoices.map((invoice) => invoice.dueDate ? invoice.dueDate.toLocaleDateString('nl-NL') : ''),
    datasets: [
      {
        label: 'Uitstaand Bedrag',
        data: filteredInvoices.map((invoice) => invoice.price),
        borderColor: 'blue',
        backgroundColor: 'lightblue',
        fill: true,
        tension: 0.4,
      },
    ],
  }), [filteredInvoices]);

  const pieChartData = useMemo(() => ({
    labels: ['Betaald', 'Niet Betaald'],
    datasets: [
      {
        data: [
          filteredInvoices.filter((inv) => inv.paymentStatus === 'betaald').length,
          filteredInvoices.filter((inv) => inv.paymentStatus === 'niet betaald').length,
        ],
        backgroundColor: ['green', 'red'],
      },
    ],
  }), [filteredInvoices]);

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
        backgroundColor: 'red',
      },
    ],
  }), [filteredInvoices]);

  const handleToggleColumn = (column) => {
    setVisibleColumns((prev) =>
      prev.includes(column) ? prev.filter((col) => col !== column) : [...prev, column]
    );
  };

  const handleExpandRow = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    const value = event.target.value;
    setRowsPerPage(value === 'all' ? filteredInvoices.length : parseInt(value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 4, maxWidth: '95vw', margin: '0 auto' }}>
      <Grid container spacing={4}>
        {[
          { label: 'Totaal Facturen', value: kpis.totalInvoices, trend: 5 },
          { label: 'Uitstaand Bedrag', value: `€${kpis.totalOutstanding.toFixed(2)}`, trend: -3 },
          { label: 'Totaal Betaald', value: `€${kpis.totalPaid.toFixed(2)}`, trend: 2 },
          { label: 'Overtijd Betalingen', value: kpis.overdueCount, trend: 1 },
          { label: 'Gemiddelde Factuurwaarde', value: `€${kpis.averageInvoiceValue.toFixed(2)}`, trend: 0 },
        ].map(({ label, value, trend }) => (
          <Grid item xs={12} sm={6} md={2.4} key={label}>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{value}</Typography>
              <Typography variant="caption">
                {trend > 0 ? <ArrowUpward color="success" /> : <ArrowDownward color="error" />} {trend}%
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              renderValue={(selected) => selected.join(', ')}
              startAdornment={<FilterListIcon />}
            >
              <MenuItem value="betaald">Betaald</MenuItem>
              <MenuItem value="niet betaald">Niet Betaald</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <DateRangePicker
            startText="Van"
            endText="Tot"
            value={dateRange}
            onChange={(newValue) => setDateRange(newValue)}
            renderInput={(startProps, endProps) => (
              <>
                <TextField {...startProps} fullWidth variant="outlined" />
                <Box sx={{ mx: 1 }}> tot </Box>
                <TextField {...endProps} fullWidth variant="outlined" />
              </>
            )}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ mt: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              {['Naam', 'Bedrag', 'Status', 'Vervaldatum', 'Acties'].map((header) => (
                visibleColumns.includes(header.toLowerCase()) && (
                  <TableCell key={header}>
                    <TableSortLabel
                      active={sortColumn === header.toLowerCase()}
                      direction={sortDirection}
                      onClick={() => {
                        setSortColumn(header.toLowerCase());
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      {header}
                    </TableSortLabel>
                  </TableCell>
                )
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((invoice, index) => (
              <>
                <TableRow key={index} onClick={() => handleExpandRow(index)}>
                  {visibleColumns.includes('name') && <TableCell>{invoice.name}</TableCell>}
                  {visibleColumns.includes('price') && <TableCell>€{invoice.price.toFixed(2)}</TableCell>}
                  {visibleColumns.includes('status') && <TableCell>{invoice.paymentStatus}</TableCell>}
                  {visibleColumns.includes('dueDate') && <TableCell>{invoice.dueDate.toLocaleDateString()}</TableCell>}
                  {visibleColumns.includes('actions') && (
                    <TableCell>
                      <Tooltip title="Download">
                        <IconButton href={`http://localhost:5000/${invoice.file}`} target="_blank">
                          <DescriptionIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
                  <TableCell colSpan={5} style={{ paddingBottom: 0, paddingTop: 0 }}>
                    <Collapse in={expandedRows[index]} timeout="auto" unmountOnExit>
                      <Box margin={2}>
                        <Typography variant="body1">{invoice.additionalInfo}</Typography>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, { label: 'Alle', value: -1 }]}
          component="div"
          count={filteredInvoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Box sx={{ mt: 4 }}>
        {['name', 'price', 'status', 'dueDate', 'actions'].map((column) => (
          <FormControlLabel
            control={<Checkbox checked={visibleColumns.includes(column)} onChange={() => handleToggleColumn(column)} />}
            label={column.charAt(0).toUpperCase() + column.slice(1)}
            key={column}
          />
        ))}
      </Box>
    </Box>
  );
};

export default InvoiceDashboard;
