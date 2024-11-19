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
          offerFiles: ['offer1.pdf'],
          invoiceDate: '2024-08-20',
          offerDate: '2024-07-15',
          paymentStatus: 'betaald',
        },
      },
      {
        name: 'Reparatie dakgoot',
        planned: {
          invoiceFiles: ['invoice4.pdf'],
          offerFiles: ['offer4.pdf'],
          invoiceDate: '2024-09-05',
          offerDate: '2024-08-30',
          paymentStatus: 'niet betaald',
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
          offerFiles: ['offer2.pdf'],
          invoiceDate: '2024-09-10',
          offerDate: '2024-08-01',
          paymentStatus: 'niet betaald',
        },
      },
      {
        name: 'Schilderwerk binnenkant',
        planned: {
          invoiceFiles: ['invoice5.pdf'],
          offerFiles: ['offer5.pdf'],
          invoiceDate: '2024-09-20',
          offerDate: '2024-08-10',
          paymentStatus: 'betaald',
        },
      },
    ],
  },
  {
    name: 'Tuinonderhoud',
    elementName: 'Gebouw C',
    tasks: [
      {
        name: 'Maaiwerkzaamheden',
        planned: {
          invoiceFiles: ['invoice3.pdf'],
          offerFiles: ['offer3.pdf'],
          invoiceDate: '2024-09-15',
          offerDate: '2024-08-20',
          paymentStatus: 'betaald',
        },
      },
      {
        name: 'Snoeiwerkzaamheden',
        planned: {
          invoiceFiles: ['invoice6.pdf'],
          offerFiles: ['offer6.pdf'],
          invoiceDate: '2024-10-01',
          offerDate: '2024-09-05',
          paymentStatus: 'niet betaald',
        },
      },
    ],
  },
  {
    name: 'Elektrisch onderhoud',
    elementName: 'Gebouw D',
    tasks: [
      {
        name: 'Controle noodverlichting',
        planned: {
          invoiceFiles: ['invoice7.pdf'],
          offerFiles: ['offer7.pdf'],
          invoiceDate: '2024-09-25',
          offerDate: '2024-09-01',
          paymentStatus: 'betaald',
        },
      },
      {
        name: 'Installatie zonnepanelen',
        planned: {
          invoiceFiles: ['invoice8.pdf'],
          offerFiles: ['offer8.pdf'],
          invoiceDate: '2024-10-10',
          offerDate: '2024-09-15',
          paymentStatus: 'niet betaald',
        },
      },
    ],
  },
  {
    name: 'Lift Onderhoud',
    elementName: 'Gebouw E',
    tasks: [
      {
        name: 'Jaarlijkse controle',
        planned: {
          invoiceFiles: ['invoice9.pdf'],
          offerFiles: ['offer9.pdf'],
          invoiceDate: '2024-08-12',
          offerDate: '2024-07-25',
          paymentStatus: 'betaald',
        },
      },
      {
        name: 'Modernisering lift',
        planned: {
          invoiceFiles: ['invoice10.pdf'],
          offerFiles: ['offer10.pdf'],
          invoiceDate: '2024-10-05',
          offerDate: '2024-09-10',
          paymentStatus: 'niet betaald',
        },
      },
    ],
  },
];


const FacturenEnOffertes = () => {
  const [filter, setFilter] = useState('all');
  const theme = useTheme();

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
                <TableCell sx={{ py: 2, px: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.text.primary }}>
                    {item.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.text.secondary }}>
                    {item.elementName}
                  </Typography>
                </TableCell>
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
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                    {item.date ? new Date(item.date).toLocaleDateString('nl-NL') : 'Geen datum'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'medium',
                      color: item.paymentStatus === 'betaald' ? theme.palette.success.main : theme.palette.error.main,
                    }}
                  >
                    {item.paymentStatus ? item.paymentStatus : 'Onbekend'}
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
