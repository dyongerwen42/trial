import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tooltip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
} from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'chart.js/auto';
import { useMjopContext } from "../MjopContext";

// Helper function to check if a date is valid
const isValidDate = (date) => date instanceof Date && !isNaN(date);

const calculateRemainingCash = (
  initialCash,
  monthlyContribution,
  tasks = [],
  now = new Date(),
  budgetStartDate,
  offerGroups = []
) => {
  const logs = [];
  const logAction = (action, details) => {
    logs.push({ action, ...details });
  };

  const startDate = new Date(budgetStartDate);
  let monthsPassed =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth());

  if (now.getDate() < startDate.getDate()) {
    monthsPassed -= 1;
  }

  let remainingCash = initialCash + monthsPassed * monthlyContribution;
  logAction("Initial cash available", { remainingCash });

  const remainingCashList = [];

  // Group tasks based on offerGroupId
  const groupedTasks = tasks.reduce((groups, task) => {
    const groupId = task.offerGroupId || "ungrouped";
    if (!groups[groupId]) {
      groups[groupId] = [];
    }
    groups[groupId].push(task);
    return groups;
  }, {});

  Object.keys(groupedTasks).forEach((groupId) => {
    const taskGroup = groupedTasks[groupId];
    let groupPrice = 0;

    if (groupId !== "ungrouped") {
      const group = offerGroups.find((g) => g.offerGroupId === groupId);
      if (group) {
        groupPrice = parseFloat(group.invoicePrice || group.offerPrice || 0);
      }

      if (!groupPrice) {
        groupPrice = taskGroup.reduce(
          (sum, task) => sum + parseFloat(task.estimatedPrice || 0),
          0
        );
      }

      const taskWorkDate = new Date(taskGroup[0]?.planned?.workDate);

      if (!isValidDate(taskWorkDate)) {
        return; // Skip groups with invalid dates
      }

      let futureMonths =
        (taskWorkDate.getFullYear() - startDate.getFullYear()) * 12 +
        (taskWorkDate.getMonth() - startDate.getMonth());

      if (taskWorkDate.getDate() < startDate.getDate()) {
        futureMonths -= 1;
      }

      if (futureMonths > 0) {
        remainingCash += futureMonths * monthlyContribution;
        startDate.setFullYear(taskWorkDate.getFullYear());
        startDate.setMonth(taskWorkDate.getMonth());
      }

      remainingCash -= groupPrice;
      remainingCashList.push({
        name: group.name || `Group ${groupId}`,
        date: taskWorkDate.toLocaleDateString('nl-NL', {
          month: 'short',
          year: 'numeric',
        }),
        price: groupPrice,
        balanceBefore: remainingCash + groupPrice,
        balanceAfter: remainingCash,
      });
      logAction("Processed group", { groupId, groupPrice, remainingCash });
    } else {
      taskGroup.forEach((task) => {
        const taskWorkDate = new Date(task?.planned?.workDate);

        if (!isValidDate(taskWorkDate)) {
          return; // Skip tasks with invalid dates
        }

        let taskPrice = parseFloat(
          task?.planned?.invoicePrice ||
          task?.planned?.offerPrice ||
          task.estimatedPrice ||
          0
        );

        let futureMonths =
          (taskWorkDate.getFullYear() - startDate.getFullYear()) * 12 +
          (taskWorkDate.getMonth() - startDate.getMonth());

        if (taskWorkDate.getDate() < startDate.getDate()) {
          futureMonths -= 1;
        }

        if (futureMonths > 0) {
          remainingCash += futureMonths * monthlyContribution;
          startDate.setFullYear(taskWorkDate.getFullYear());
          startDate.setMonth(taskWorkDate.getMonth());
        }

        remainingCash -= taskPrice;
        remainingCashList.push({
          name: task.name,
          date: taskWorkDate.toLocaleDateString('nl-NL', {
            month: 'short',
            year: 'numeric',
          }),
          price: taskPrice,
          balanceBefore: remainingCash + taskPrice,
          balanceAfter: remainingCash,
        });
        logAction("Processed ungrouped task", {
          taskId: task.id,
          taskPrice,
          remainingCash,
        });
      });
    }
  });

  logAction("Final remaining cash list", { remainingCashList });
  console.log("logs", JSON.stringify(logs));

  return remainingCashList;
};

const CashFlowChart = () => {

  const { state } = useMjopContext(); // Access the context state
  const { cashInfo, globalElements, offerGroups } = state; // Destructure required data

  const [dataPoints, setDataPoints] = useState([]);
  const [taskDetails, setTaskDetails] = useState([]);
  const [summary, setSummary] = useState({ totaalInkomsten: 0, totaalUitgaven: 0 });
  const [chartLabels, setChartLabels] = useState([]);
  const [selectedYears, setSelectedYears] = useState(1);
  const [startDate, setStartDate] = useState(null);

  const calculateSummary = useCallback((cashFlowData) => {
    if (!cashFlowData || cashFlowData.length === 0) return;

    const totalIncome =
      cashFlowData[cashFlowData.length - 1] - cashFlowData[0] + parseFloat(cashInfo.currentCash || 0);
    const totalExpenses =
      parseFloat(cashInfo.currentCash || 0) - cashFlowData[cashFlowData.length - 1];

    setSummary({
      totaalInkomsten: totalIncome.toFixed(2),
      totaalUitgaven: totalExpenses.toFixed(2),
    });
  }, [cashInfo.currentCash]);

  useEffect(() => {
    const now = new Date();
  
    // Filter out tasks without a valid workDate immediately
    const tasks = globalElements.flatMap((element) => element.tasks || []).filter(
      (task) => task?.planned?.workDate && isValidDate(new Date(task?.planned?.workDate))
    );
  
    const remainingCashList = calculateRemainingCash(
      parseFloat(cashInfo.currentCash || 0),
      parseFloat(cashInfo.monthlyContribution || 0),
      tasks,
      now,
      cashInfo.reserveDate,
      offerGroups
    );
  
    const labels = remainingCashList.map(item => item.date);
    const cashFlowData = remainingCashList.map(item => item.balanceAfter);
  
    setChartLabels(labels);
    setDataPoints(cashFlowData);
    setTaskDetails(remainingCashList);
  
    calculateSummary(cashFlowData);
  }, [cashInfo, globalElements, selectedYears, startDate, calculateSummary, offerGroups]);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Resterend Kapitaal (€)',
        data: dataPoints,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: (context) => {
          const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(75, 192, 192, 0.5)');
          gradient.addColorStop(1, 'rgba(75, 192, 192, 0)');
          return gradient;
        },
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgba(75, 192, 192, 1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Datum',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#333',
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Resterend Kapitaal (€)',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#333',
        },
        beginAtZero: true,
        grid: {
          color: '#e0e0e0',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `€${tooltipItem.raw.toLocaleString('nl-NL')}`;
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 3, borderRadius: 2, backgroundColor: '#f9f9f9' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
          Overzicht Cashflow
        </Typography>
     
      </Box>
      <Box sx={{ height: 400 }}>
        <Line data={chartData} options={chartOptions} />
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>Samenvatting</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1" sx={{ color: '#555' }}>
              <strong>Totaal Inkomsten:</strong> €{summary.totaalInkomsten}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1" sx={{ color: '#555' }}>
              <strong>Totaal Uitgaven:</strong> €{summary.totaalUitgaven}
            </Typography>
          </Grid>
        </Grid>
        <Tooltip title="Bekijk gedetailleerd rapport">
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2, backgroundColor: '#1976d2' }}
            onClick={() => alert('Gedetailleerd rapport nog niet geïmplementeerd')}
          >
            Gedetailleerd Rapport
          </Button>
        </Tooltip>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
          Taakdetails met Negatieve Bedragen
        </Typography>
        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table aria-label="task details table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }}>Taak Naam</TableCell>
                <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }}>Datum</TableCell>
                <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }}>Prijs (€)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }}>Saldo Voor (€)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }}>Saldo Na (€)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {taskDetails.length > 0 ? (
                taskDetails.map((task, index) => (
                  <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
                    <TableCell sx={{ padding: '12px 16px' }}>{task.name || 'Onbekende taak'}</TableCell>
                    <TableCell sx={{ padding: '12px 16px' }}>{task.date || 'Onbekende datum'}</TableCell>
                    <TableCell sx={{ padding: '12px 16px' }}>{task.price !== undefined ? task.price.toFixed(2) : '0.00'}</TableCell>
                    <TableCell sx={{ padding: '12px 16px' }}>{task.balanceBefore !== undefined ? task.balanceBefore.toFixed(2) : '0.00'}</TableCell>
                    <TableCell sx={{ padding: '12px 16px' }}>{task.balanceAfter !== undefined ? task.balanceAfter.toFixed(2) : '0.00'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ padding: '12px 16px' }}>
                    Geen taken met negatieve bedragen.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Paper>
  );
};

export default CashFlowChart;
