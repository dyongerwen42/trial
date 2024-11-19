import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Card, CardContent, Avatar, Tooltip, Grid } from '@mui/material';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { green, orange, yellow, red, blue, grey } from '@mui/material/colors';

// Sustainability measures data
const sustainabilityMeasures = [
    { id: 1, measure: 'Isolatie van muren', executed: true, date: '2023-05-12', co2Saving: 3000 }, // 100 kg per appartement x 30 appartementen
    { id: 2, measure: 'Zonnepanelen plaatsen', executed: false, date: '2024-04-10', co2Saving: 15000 }, // 500 kg per appartement x 30 appartementen
    { id: 3, measure: 'Dubbel glas installeren', executed: true, date: '2022-11-20', co2Saving: 6000 }, // 200 kg per appartement x 30 appartementen
    { id: 4, measure: 'Warmtepomp installatie', executed: false, date: '2024-07-01', co2Saving: 30000 }, // 1000 kg per appartement x 30 appartementen
    { id: 5, measure: 'LED-verlichting', executed: true, date: '2023-02-15', co2Saving: 1500 }, // 50 kg per appartement x 30 appartementen
    { id: 6, measure: 'Dakisolatie', executed: true, date: '2021-06-20', co2Saving: 4500 }, // 150 kg per appartement x 30 appartementen
    { id: 7, measure: 'Vloerisolatie', executed: false, date: '2025-03-12', co2Saving: 3000 }, // 100 kg per appartement x 30 appartementen
    { id: 8, measure: 'Gevelisolatie', executed: true, date: '2022-07-14', co2Saving: 3600 }, // 120 kg per appartement x 30 appartementen
    { id: 9, measure: 'HR++ Ketels', executed: true, date: '2020-11-10', co2Saving: 12000 }, // 400 kg per appartement x 30 appartementen
    { id: 10, measure: 'Vervangen van oude radiatoren', executed: false, date: '2024-12-01', co2Saving: 3000 }, // 100 kg per appartement x 30 appartementen
    { id: 11, measure: 'Waterzijdig inregelen van CV-installatie', executed: true, date: '2021-09-10', co2Saving: 2700 }, // 90 kg per appartement x 30 appartementen
    { id: 12, measure: 'Warmteterugwinningssysteem (WTW)', executed: true, date: '2023-03-18', co2Saving: 5000 }, // 166 kg per appartement x 30 appartementen
    { id: 13, measure: 'Groene daken', executed: false, date: '2025-05-01', co2Saving: 3000 }, // 100 kg per appartement x 30 appartementen
    { id: 14, measure: 'Grijswatersysteem voor hergebruik water', executed: false, date: '2024-08-18', co2Saving: 2000 }, // 66 kg per appartement x 30 appartementen
    { id: 15, measure: 'Mechanische ventilatie met CO2-sturing', executed: true, date: '2023-10-22', co2Saving: 4500 }, // 150 kg per appartement x 30 appartementen
    { id: 16, measure: 'Warmte-koude opslag (WKO)', executed: false, date: '2025-11-11', co2Saving: 18000 }, // 600 kg per appartement x 30 appartementen
    { id: 17, measure: 'Installatie van warmtepompen', executed: true, date: '2021-04-15', co2Saving: 30000 }, // 1000 kg per appartement x 30 appartementen
    { id: 18, measure: 'Verwarming op lage temperatuur (LTV)', executed: false, date: '2026-01-01', co2Saving: 9000 }, // 300 kg per appartement x 30 appartementen
    { id: 19, measure: 'Zonwering voor ramen', executed: true, date: '2023-05-12', co2Saving: 1500 }, // 50 kg per appartement x 30 appartementen
    { id: 20, measure: 'Bodemisolatie', executed: false, date: '2024-06-01', co2Saving: 2700 }, // 90 kg per appartement x 30 appartementen
    { id: 21, measure: 'Installatie van smart thermostaten', executed: true, date: '2022-02-28', co2Saving: 4500 }, // 150 kg per appartement x 30 appartementen
    { id: 22, measure: 'Efficiënte boilers plaatsen', executed: false, date: '2024-10-10', co2Saving: 1800 }, // 60 kg per appartement x 30 appartementen
    { id: 23, measure: 'Plaatsing van slimme meters', executed: true, date: '2020-12-15', co2Saving: 1200 }, // 40 kg per appartement x 30 appartementen
    { id: 24, measure: 'Elektrische auto-oplaadpunten', executed: false, date: '2024-09-20', co2Saving: 9000 }, // 300 kg per appartement x 30 appartementen
    { id: 25, measure: 'Vervangen van keukenapparatuur met A++ labels', executed: true, date: '2021-06-05', co2Saving: 3000 }, // 100 kg per appartement x 30 appartementen
  ];

// Helper function to calculate cumulative CO2 savings per year
const calculateCumulativeCo2SavingsPerYear = (measures) => {
  const co2SavingsPerYear = {};
  measures.forEach((measure) => {
    const year = new Date(measure.date).getFullYear();
    if (!co2SavingsPerYear[year]) {
      co2SavingsPerYear[year] = 0;
    }
    co2SavingsPerYear[year] += measure.co2Saving;
  });

  // Calculate cumulative savings
  const sortedYears = Object.keys(co2SavingsPerYear).sort();
  let cumulativeSaving = 0;
  return sortedYears.reduce((acc, year) => {
    cumulativeSaving += co2SavingsPerYear[year];
    acc[year] = cumulativeSaving;
    return acc;
  }, {});
};

// Chart data
const co2SavingsPerYear = calculateCumulativeCo2SavingsPerYear(sustainabilityMeasures);
const years = Object.keys(co2SavingsPerYear);
const co2Savings = years.map((year) => co2SavingsPerYear[year]);

const chartData = {
  labels: years,
  datasets: [
    {
      label: 'Cumulatieve CO2 Besparing (kg)',
      data: co2Savings,
      fill: false,
      backgroundColor: 'rgba(33, 150, 243, 0.2)',
      borderColor: '#2196F3',
      tension: 0.3,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: '#2196F3',
    },
  ],
};

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // Disable aspect ratio to control height
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

// Function to calculate Dutch energy label based on CO2 savings
const getEnergyLabel = (totalSaving) => {
  if (totalSaving >= 30000) return { label: 'A', color: green[500] };
  if (totalSaving >= 20000) return { label: 'B', color: blue[500] };
  if (totalSaving >= 10000) return { label: 'C', color: yellow[500] };
  return { label: 'D', color: red[500] };
};

const SustainabilityWidget = () => {
  const [totalCo2Savings, setTotalCo2Savings] = useState(0);

  useEffect(() => {
    const total = sustainabilityMeasures
      .filter((measure) => measure.executed)
      .reduce((total, measure) => total + measure.co2Saving, 0);
    setTotalCo2Savings(total);
  }, []);

  const executedMeasures = sustainabilityMeasures.filter((measure) => measure.executed);
  const notExecutedMeasures = sustainabilityMeasures.filter((measure) => !measure.executed);

  const energyLabel = getEnergyLabel(totalCo2Savings);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Verduurzamingsmaatregelen en CO2 Besparingen
      </Typography>

      {/* CO2 Savings Widget */}
      <Card
        sx={{
          mb: 3,
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f0f4f8',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={`Energie Label ${energyLabel.label}`} arrow>
            <Avatar
              sx={{
                bgcolor: energyLabel.color,
                width: 64,
                height: 64,
                fontSize: '2rem',
                mr: 3,
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              {energyLabel.label}
            </Avatar>
          </Tooltip>
          <Box>
            <Typography variant="h6">Totale CO2 Besparing</Typography>
            <Typography variant="body2" color="textSecondary">
              Gebaseerd op uitgevoerde maatregelen
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6">CO2 Besparing</Typography>
          <Typography
            variant="h3"
            sx={{ color: energyLabel.color, fontWeight: 'bold' }}
          >
            {totalCo2Savings} kg
          </Typography>
        </Box>
      </Card>

      {/* CO2 Savings Line Chart */}
      <Card sx={{ mb: 3, p: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cumulatieve CO2 Besparingen door de Jaren Heen
          </Typography>
          <Box sx={{ height: '300px' }}>
            <Line data={chartData} options={chartOptions} />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Executed Measures Table */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6">Uitgevoerde Maatregelen</Typography>
          <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden', mt: 2, border: `1px solid ${grey[300]}` }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: blue[50] }}>
                  <TableCell sx={{ fontWeight: 'bold', color: blue[800] }}>Maatregel</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: blue[800] }}>Datum</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: blue[800] }}>CO2 Besparing (kg)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {executedMeasures.map((measure) => (
                  <TableRow key={measure.id} hover sx={{ '&:hover': { backgroundColor: blue[50] } }}>
                    <TableCell>{measure.measure}</TableCell>
                    <TableCell>{measure.date}</TableCell>
                    <TableCell>{measure.co2Saving}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Not Executed Measures Table */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6">Nog Niet Uitgevoerde Maatregelen</Typography>
          <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden', mt: 2, border: `1px solid ${grey[300]}` }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: orange[50] }}>
                  <TableCell sx={{ fontWeight: 'bold', color: orange[800] }}>Maatregel</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: orange[800] }}>Geplande Datum</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: orange[800] }}>Verwachte CO2 Besparing (kg)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notExecutedMeasures.map((measure) => (
                  <TableRow key={measure.id} hover sx={{ '&:hover': { backgroundColor: orange[50] } }}>
                    <TableCell>{measure.measure}</TableCell>
                    <TableCell>{measure.date}</TableCell>
                    <TableCell>{measure.co2Saving}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SustainabilityWidget;
