import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
  Box, Button, Select, MenuItem, FormControl, InputLabel, Card, Grid
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '@mui/material/styles';

// Mock contract data
const initialContracts = [
    { id: 1, company: 'Van Dijk Bouw', startDate: '2022-01-15', endDate: '2024-01-15', price: 5600, status: 'active' },
    { id: 2, company: 'Jansen Installaties', startDate: '2021-07-01', endDate: '2023-06-30', price: 7600, status: 'active' },
    { id: 3, company: 'Tech Innovators', startDate: '2023-05-10', endDate: '2025-05-10', price: 9800, status: 'active' },
    { id: 4, company: 'Groen Energie', startDate: '2020-09-20', endDate: '2022-09-19', price: 14000, status: 'expired' },
    { id: 5, company: 'Van Dijk Bouw', startDate: '2021-03-01', endDate: '2023-03-01', price: 15000, status: 'active' },
    { id: 6, company: 'Jansen Installaties', startDate: '2018-01-01', endDate: '2020-12-31', price: 5000, status: 'expired' },
    { id: 7, company: 'EcoTech Nederland', startDate: '2017-05-15', endDate: '2020-05-15', price: 10000, status: 'expired' },
    { id: 8, company: 'Waterbeheer BV', startDate: '2015-02-10', endDate: '2018-02-10', price: 11500, status: 'expired' },
    { id: 9, company: 'Tech Innovators', startDate: '2019-11-05', endDate: '2022-11-05', price: 10500, status: 'expired' },
    { id: 10, company: 'Van Dijk Bouw', startDate: '2020-06-15', endDate: '2022-06-15', price: 13000, status: 'active' },
    { id: 11, company: 'Groen Energie', startDate: '2016-08-01', endDate: '2019-08-01', price: 7500, status: 'expired' },
    { id: 12, company: 'Jansen Installaties', startDate: '2015-10-10', endDate: '2018-10-10', price: 16000, status: 'expired' },
    { id: 13, company: 'Smart Homes BV', startDate: '2021-01-01', endDate: '2023-01-01', price: 16500, status: 'active' },
    { id: 14, company: 'EcoTech Nederland', startDate: '2019-03-20', endDate: '2022-03-20', price: 11800, status: 'active' },
    { id: 15, company: 'Van Dijk Bouw', startDate: '2020-12-05', endDate: '2023-12-05', price: 9600, status: 'active' },
    { id: 16, company: 'Jansen Installaties', startDate: '2015-06-25', endDate: '2018-06-25', price: 11000, status: 'expired' },
    { id: 17, company: 'Groen Energie', startDate: '2017-04-12', endDate: '2020-04-12', price: 10200, status: 'expired' },
    { id: 18, company: 'Waterbeheer BV', startDate: '2016-09-18', endDate: '2019-09-18', price: 8300, status: 'expired' },
    { id: 19, company: 'EcoTech Nederland', startDate: '2018-02-28', endDate: '2021-02-28', price: 10900, status: 'active' },
    { id: 20, company: 'Van Dijk Bouw', startDate: '2020-08-15', endDate: '2022-08-15', price: 13000, status: 'active' },
];



// Function to check if the contract is about to expire
const isExpiringSoon = (endDate) => {
  const today = new Date();
  const contractEnd = new Date(endDate);
  const timeDiff = contractEnd.getTime() - today.getTime();
  const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysLeft <= 30;
};

// Function to calculate total contract price per company
const calculateTotalPricePerCompany = (contracts) => {
  const companyPrices = {};
  contracts.forEach((contract) => {
    if (companyPrices[contract.company]) {
      companyPrices[contract.company] += contract.price;
    } else {
      companyPrices[contract.company] = contract.price;
    }
  });
  return companyPrices;
};

const ContractsTable = () => {
  const theme = useTheme();
  const [contracts, setContracts] = useState(initialContracts);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired
  const [sortField, setSortField] = useState('startDate'); // startDate, endDate

  // Filter contracts based on status (active, expired, or all)
  const filteredContracts = contracts.filter((contract) => {
    if (filterStatus === 'all') return true;
    return filterStatus === 'active' ? contract.status === 'active' : contract.status === 'expired';
  });

  // Sort contracts based on selected date (start or end date)
  const sortedContracts = filteredContracts.sort((a, b) => {
    return new Date(a[sortField]) - new Date(b[sortField]);
  });

  // Calculate total prices per company
  const totalPrices = calculateTotalPricePerCompany(contracts);

  // Prepare data for the bar chart
  const chartData = {
    labels: Object.keys(totalPrices),
    datasets: [
      {
        label: 'Totaal Prijs per Bedrijf (€)',
        data: Object.values(totalPrices),
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.dark,
        borderWidth: 1,
      },
    ],
  };

  // Handle sorting field change
  const handleSortChange = (event) => {
    setSortField(event.target.value);
  };

  // Handle filter status change
  const handleFilterChange = (event) => {
    setFilterStatus(event.target.value);
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Total Price Bar Chart */}
      <Card
        sx={{
          mb: 4,
          p: 3,
          backgroundColor: theme.palette.background.default,
          borderRadius: 3,
          boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            textAlign: 'center',
            color: theme.palette.primary.main,
          }}
        >
          Totaal Prijs per Bedrijf
        </Typography>
        <Box sx={{ height: '250px', mt: 3 }}>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { display: true },
                  ticks: { font: { weight: 'bold' } },
                },
                x: {
                  grid: { display: false },
                  ticks: { font: { weight: 'bold' } },
                },
              },
            }}
          />
        </Box>
      </Card>

      <Typography variant="h4" gutterBottom>
        Contracten Overzicht
      </Typography>

      {/* Filter and Sort Controls */}
      <Card
        sx={{
          mb: 4,
          p: 3,
          backgroundColor: theme.palette.background.paper,
          boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
          borderRadius: 3,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={filterStatus}
                onChange={handleFilterChange}
                label="Status Filter"
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="active">Actief</MenuItem>
                <MenuItem value="expired">Verlopen</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Sorteer op</InputLabel>
              <Select
                value={sortField}
                onChange={handleSortChange}
                label="Sorteer op"
              >
                <MenuItem value="startDate">Startdatum</MenuItem>
                <MenuItem value="endDate">Einddatum</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Contracts Table */}
      <TableContainer
        component={Paper}
        sx={{
          boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)',
          borderRadius: 3,
          mb: 4,
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: theme.palette.secondary.light }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', padding: '16px', color: theme.palette.primary.main }}>Bedrijf</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '16px', color: theme.palette.primary.main }}>Startdatum</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '16px', color: theme.palette.primary.main }}>Einddatum</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '16px', color: theme.palette.primary.main }}>Prijs (€)</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '16px', color: theme.palette.primary.main }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '16px', color: theme.palette.primary.main }}>Actie</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedContracts.map((contract) => (
              <TableRow
                key={contract.id}
                hover
                sx={{
                  '&:hover': { backgroundColor: theme.palette.action.hover },
                }}
              >
                <TableCell sx={{ padding: '16px' }}>{contract.company}</TableCell>
                <TableCell sx={{ padding: '16px' }}>{contract.startDate}</TableCell>
                <TableCell sx={{ padding: '16px' }}>
                  {contract.endDate}
                  {isExpiringSoon(contract.endDate) && (
                    <Typography sx={{ color: theme.palette.error.main, fontWeight: 'bold' }}>
                      (Bijna verlopen)
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ padding: '16px' }}>{contract.price}</TableCell>
                <TableCell sx={{ padding: '16px' }}>
                  <Typography
                    sx={{
                      color: contract.status === 'active' ? theme.palette.success.main : theme.palette.error.main,
                    }}
                  >
                    {contract.status === 'active' ? 'Actief' : 'Verlopen'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ padding: '16px' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => alert(`Bekijk contract: ${contract.company}`)}
                  >
                    Bekijk
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ContractsTable;
