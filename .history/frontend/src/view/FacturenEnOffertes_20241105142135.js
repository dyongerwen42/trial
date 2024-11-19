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
  useTheme,
  Card,
  CardContent,
} from '@mui/material';
import { Description as DescriptionIcon, FilterList as FilterListIcon } from '@mui/icons-material';

const fakeData = [
  // ... (same data as before)
];

const FacturenEnOffertes = () => {
  const [filter, setFilter] = useState('all');
  const theme = useTheme();

  // Calculate KPIs
  const kpis = useMemo(() => {
    let totalTasks = 0;
    let totalInvoices = 0;
    let totalOffers = 0;
    let paidInvoices = 0;
    let unpaidInvoices = 0;

    fakeData.forEach((element) => {
      element.tasks.forEach((task) => {
        const { invoiceFiles = [], offerFiles = [], paymentStatus } = task.planned || {};

        totalTasks += 1;
        totalInvoices += invoiceFiles.length;
        totalOffers += offerFiles.length;
        if (paymentStatus === 'betaald') {
          paidInvoices += 1;
        } else if (paymentStatus === 'niet betaald') {
          unpaidInvoices += 1;
        }
      });
    });

    return {
      totalTasks,
      totalInvoices,
      totalOffers,
      paidInvoices,
      unpaidInvoices,
    };
  }, [fakeData]);

  const filteredItems = useMemo(() => {
    const filteredTasks = fakeData.flatMap((element) =>
      (element.tasks || []).flatMap((task) => {
        const invoices = (task.planned?.invoiceFiles || []).map((file) => ({
          type: 'invoice',
          name: task.name,
          elementName: element.name,
          file,
          date: task.planned?.invoiceDate || null,
          paymentStatus: task.planned?.paymentStatus || 'Onbekend',
        }));
        const offers = (task.planned?.offerFiles || []).map((file) => ({
          type: 'offer',
          name: task.name,
          elementName: element.name,
          file,
          date: task.planned?.offerDate || null,
        }));
        return [...invoices, ...offers];
      })
    );

    return filter === 'all'
      ? filteredTasks
      : filteredTasks.filter((item) => item.type === filter);
  }, [filter]);

  return (
    <Box
      sx={{
        p: 6,
        px: 10,
        bgcolor: theme.palette.background.default,
        borderRadius: 4,
        boxShadow: theme.shadows[4],
        maxWidth: '85%',
        margin: '0 auto',
        mt: 8,
        mb: 8,
      }}
    >
      {/* KPI Section */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}>
            <CardContent>
              <Typography variant="h6">Totaal Taken</Typography>
              <Typography variant="h4" fontWeight="bold">
                {kpis.totalTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: theme.palette.success.main, color: 'white' }}>
            <CardContent>
              <Typography variant="h6">Betaalde Facturen</Typography>
              <Typography variant="h4" fontWeight="bold">
                {kpis.paidInvoices}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: theme.palette.error.main, color: 'white' }}>
            <CardContent>
              <Typography variant="h6">Onbetaalde Facturen</Typography>
              <Typography variant="h4" fontWeight="bold">
                {kpis.unpaidInvoices}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter dropdown section */}
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Grid item>
          <FormControl variant="outlined" sx={{ minWidth: 240 }}>
            <InputLabel id="filter-select-label" sx={{ color: theme.palette.text.primary }}>
              Filteren op type
            </InputLabel>
            <Select
              labelId="filter-select-label"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label="Filteren op type"
              startAdornment={<FilterListIcon sx={{ mr: 1, color: theme.palette.primary.main }} />}
              sx={{
                bgcolor: theme.palette.background.paper,
                borderRadius: 3,
                boxShadow: theme.shadows[2],
                py: 1.5,
                px: 3,
                '& .MuiSvgIcon-root': {
                  color: theme.palette.secondary.main,
                },
                '&:hover': {
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <MenuItem value="all">Alle</MenuItem>
              <MenuItem value="invoice">Alleen Facturen</MenuItem>
              <MenuItem value="offer">Alleen Offertes</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
  
      {/* Table Section */}
      <TableContainer component={Paper} sx={{ borderRadius: 6, boxShadow: theme.shadows[5], overflow: 'hidden' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: theme.palette.primary.dark }}>
            <TableRow>
              {['Type', 'Naam van Taak', 'Element', 'Bestand', 'Datum', 'Betaalstatus'].map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    fontWeight: 'bold',
                    color: theme.palette.common.white,
                    py: 2.5,
                    px: 3,
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    borderBottom: `2px solid ${theme.palette.primary.light}`,
                    letterSpacing: '0.05em',
                  }}
                >
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
                  '&:nth-of-type(odd)': {
                    bgcolor: theme.palette.action.hover,
                  },
                  '&:hover': {
                    bgcolor: theme.palette.secondary.light,
                    transform: 'scale(1.01)',
                  },
                  transition: 'transform 0.3s ease, background-color 0.3s ease',
                }}
              >
                <TableCell sx={{ py: 2, px: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      color: item.type === 'invoice' ? theme.palette.success.main : theme.palette.info.main,
                      textTransform: 'capitalize',
                    }}
                  >
                    {item.type === 'invoice' ? 'Factuur' : 'Offerte'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3 }}>{item.name}</TableCell>
                <TableCell sx={{ py: 2, px: 3 }}>{item.elementName}</TableCell>
                <TableCell sx={{ py: 2, px: 3 }}>
                  <Tooltip title="Download Bestand" arrow>
                    <IconButton
                      component="a"
                      href={`http://localhost:5000/${item.file}`}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: theme.palette.primary.main,
                        '&:hover': {
                          color: theme.palette.primary.dark,
                        },
                        transition: 'color 0.3s ease',
                      }}
                    >
                      <DescriptionIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3 }}>
                  {item.date ? new Date(item.date).toLocaleDateString('nl-NL') : 'Geen datum'}
                </TableCell>
                <TableCell sx={{ py: 2, px: 3 }}>
                  <Typography
                    variant="body2"
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

export default FacturenEnOffertes;
