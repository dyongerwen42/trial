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
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import { Description as DescriptionIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, Legend);

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
  {
    name: 'Schilderwerk',
    elementName: 'Gebouw B',
    tasks: [
      {
        name: 'Schilderwerk buitenkant',
        planned: {
          invoiceFiles: ['invoice2.pdf'],
          invoiceDate: '2024-09-10',
          paymentStatus: 'niet betaald',
          price: 1200,
        },
      },
      {
        name: 'Schilderwerk binnenkant',
        planned: {
          invoiceFiles: ['invoice5.pdf'],
          invoiceDate: '2024-09-20',
          paymentStatus: 'betaald',
          price: 800,
        },
      },
    ],
  },
  // Additional entries as needed...
];


const Facturen = () => {
  const [filter, setFilter] = useState('all');
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

  const kpiData = useMemo(() => {
    const totalAmount = filteredItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const paidAmount = filteredItems.reduce((sum, item) => sum + (item.paymentStatus === 'betaald' ? item.price : 0), 0);
    const openAmount = totalAmount - paidAmount;

    return { totalAmount, paidAmount, openAmount };
  }, [filteredItems]);

  const chartData = {
    labels: ['Betaald', 'Niet Betaald'],
    datasets: [
      {
        label: 'Betaalstatus',
        data: [
          filteredItems.filter((item) => item.paymentStatus === 'betaald').length,
          filteredItems.filter((item) => item.paymentStatus === 'niet betaald').length,
        ],
        backgroundColor: [theme.palette.success.main, theme.palette.error.main],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <Box sx={{ p: 6, maxWidth: '95%', mx: 'auto' }}>
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Totaal Bedrag', value: kpiData.totalAmount, color: theme.palette.primary.main },
          { label: 'Betaald Bedrag', value: kpiData.paidAmount, color: theme.palette.success.main },
          { label: 'Openstaand Bedrag', value: kpiData.openAmount, color: theme.palette.error.main },
        ].map((kpi) => (
          <Grid item xs={12} sm={4} key={kpi.label}>
            <Card sx={{ boxShadow: 4, borderRadius: 2, textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: kpi.color, fontWeight: 'bold' }}>
                  €{kpi.value.toFixed(2)}
                </Typography>
                <Typography color="textSecondary">{kpi.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Payment Status Chart */}
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Betaalstatus Verdeling</Typography>
        <Pie data={chartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
      </Box>

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
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: theme.shadows[5], overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
            <TableRow>
              {['Naam van Taak', 'Element', 'Bestand', 'Datum', 'Prijs (€)', 'Betaalstatus'].map((header) => (
                <TableCell key={header} sx={{ fontWeight: 'bold', color: theme.palette.common.white }}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item, index) => (
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
