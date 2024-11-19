import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  TableSortLabel,
  useTheme,
} from '@mui/material';
import { Description as DescriptionIcon, FilterList as FilterListIcon } from '@mui/icons-material';

const fakeData = [
  {
    name: 'Dak Onderhoud',
    elementName: 'Gebouw A',
    tasks: [
      {
        name: 'Dakbedekking inspectie',
        planned: {
          invoiceFiles: ['invoice1.pdf'],
          invoiceDate: '2024-08-20',
          paymentStatus: 'betaald',
          price: 500,
        },
      },
      {
        name: 'Reparatie dakgoot',
        planned: {
          invoiceFiles: ['invoice4.pdf'],
          invoiceDate: '2024-09-05',
          paymentStatus: 'niet betaald',
          price: 300,
        },
      },
    ],
  },
  // Additional fake data entries
];

const Facturen = () => {
  const [filter, setFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const theme = useTheme();

  const filteredItems = useMemo(() => {
    const tasks = fakeData.flatMap((element) =>
      (element.tasks || []).flatMap((task) => ({
        name: task.name,
        elementName: element.name,
        file: task.planned.invoiceFiles[0],
        date: task.planned.invoiceDate,
        paymentStatus: task.planned.paymentStatus,
        price: task.planned.price,
      }))
    );

    return tasks.filter((item) =>
      filter === 'all' ? true : item.paymentStatus === filter
    );
  }, [filter]);

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredItems, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.direction === 'asc' && prevConfig.key === key ? 'desc' : 'asc',
    }));
  };

  const kpiData = useMemo(() => {
    const totalAmount = filteredItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const paidAmount = filteredItems.reduce((sum, item) => sum + (item.paymentStatus === 'betaald' ? item.price : 0), 0);
    const openAmount = totalAmount - paidAmount;

    return { totalAmount, paidAmount, openAmount };
  }, [filteredItems]);

  return (
    <Box sx={{ p: 4, bgcolor: theme.palette.background.default, borderRadius: 2, maxWidth: '85%', margin: '0 auto', mt: 6 }}>
      {/* KPI Section */}
      <Grid container spacing={2} justifyContent="space-between" sx={{ mb: 4 }}>
        <Grid item>
          <Typography variant="h6">Totaal Bedrag: €{kpiData.totalAmount.toFixed(2)}</Typography>
        </Grid>
        <Grid item>
          <Typography variant="h6">Betaald Bedrag: €{kpiData.paidAmount.toFixed(2)}</Typography>
        </Grid>
        <Grid item>
          <Typography variant="h6">Openstaand Bedrag: €{kpiData.openAmount.toFixed(2)}</Typography>
        </Grid>
      </Grid>

      {/* Filter Section */}
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Grid item xs={4}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Filter op Betaalstatus</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              startAdornment={<FilterListIcon sx={{ mr: 1, color: theme.palette.primary.main }} />}
            >
              <MenuItem value="all">Alle</MenuItem>
              <MenuItem value="betaald">Betaald</MenuItem>
              <MenuItem value="niet betaald">Niet Betaald</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Table Section */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: theme.shadows[2] }}>
        <Table>
          <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
            <TableRow>
              {['Naam van Taak', 'Element', 'Bestand', 'Datum', 'Prijs (€)', 'Betaalstatus'].map((header, index) => (
                <TableCell
                  key={header}
                  sortDirection={sortConfig.key === header ? sortConfig.direction : false}
                  onClick={() => handleSort(header.toLowerCase().replace(' ', ''))}
                >
                  <TableSortLabel
                    active={sortConfig.key === header.toLowerCase().replace(' ', '')}
                    direction={sortConfig.direction}
                    sx={{
                      fontWeight: 'bold',
                      color: theme.palette.common.white,
                      '&:hover': { color: theme.palette.common.white },
                    }}
                  >
                    {header}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedItems.map((item, index) => (
              <TableRow
                key={index}
                sx={{
                  '&:nth-of-type(odd)': { bgcolor: theme.palette.action.hover },
                  '&:hover': { bgcolor: theme.palette.secondary.light, transform: 'scale(1.01)' },
                  transition: 'transform 0.3s ease, background-color 0.3s ease',
                }}
              >
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.elementName}</TableCell>
                <TableCell>
                  <Tooltip title="Download Bestand" arrow>
                    <IconButton
                      component="a"
                      href={`http://localhost:5000/${item.file}`}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: theme.palette.primary.main,
                        '&:hover': { color: theme.palette.primary.dark },
                        transition: 'color 0.3s ease',
                      }}
                    >
                      <DescriptionIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>{item.date ? new Date(item.date).toLocaleDateString('nl-NL') : 'Geen datum'}</TableCell>
                <TableCell>€{item.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      fontWeight: 'medium',
                      color: item.paymentStatus === 'betaald' ? theme.palette.success.main : theme.palette.error.main,
                    }}
                  >
                    {item.paymentStatus || 'Onbekend'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Facturen;
