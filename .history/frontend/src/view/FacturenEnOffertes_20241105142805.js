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
    return fakeData.flatMap((element) =>
      (element.tasks || []).flatMap((task) => {
        return (task.planned?.invoiceFiles || []).map((file) => ({
          type: 'invoice',
          name: task.name,
          elementName: element.name,
          file,
          date: task.planned?.invoiceDate || null,
          paymentStatus: task.planned?.paymentStatus || 'Onbekend',
          price: task.planned?.price || 0,
        }));
      })
    );
  }, [filter]);

  return (
    <Box
      sx={{
        p: 4,
        bgcolor: theme.palette.background.default,
        borderRadius: 2,
        boxShadow: theme.shadows[2],
        maxWidth: '85%',
        margin: '0 auto',
        mt: 6,
        mb: 6,
      }}
    >
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Grid item>
          <FormControl variant="outlined" sx={{ minWidth: 220 }}>
            <InputLabel id="filter-select-label">Filteren op status</InputLabel>
            <Select
              labelId="filter-select-label"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label="Filteren op status"
              startAdornment={<FilterListIcon sx={{ mr: 1, color: theme.palette.primary.main }} />}
              sx={{
                bgcolor: theme.palette.background.paper,
                borderRadius: 2,
                py: 1,
                boxShadow: theme.shadows[1],
                '& .MuiSvgIcon-root': { color: theme.palette.secondary.main },
                '&:hover': { boxShadow: theme.shadows[3] },
              }}
            >
              <MenuItem value="all">Alle</MenuItem>
              <MenuItem value="betaald">Betaald</MenuItem>
              <MenuItem value="niet betaald">Niet Betaald</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: theme.shadows[2] }}>
        <Table sx={{ minWidth: 700 }}>
          <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
            <TableRow>
              {['Type', 'Naam van Taak', 'Element', 'Bestand', 'Datum', 'Prijs (€)', 'Betaalstatus'].map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    fontWeight: 'bold',
                    color: theme.palette.common.white,
                    py: 2,
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
                  '&:nth-of-type(odd)': { bgcolor: theme.palette.action.hover },
                  '&:hover': { bgcolor: theme.palette.secondary.light, transform: 'scale(1.01)' },
                  transition: 'transform 0.3s ease, background-color 0.3s ease',
                }}
              >
                <TableCell sx={{ py: 1.5, px: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.info.main, textTransform: 'capitalize' }}>
                    Factuur
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1.5, px: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                    {item.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1.5, px: 3 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {item.elementName}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1.5, px: 3 }}>
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
                <TableCell sx={{ py: 1.5, px: 3 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                    {item.date ? new Date(item.date).toLocaleDateString('nl-NL') : 'Geen datum'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1.5, px: 3 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                    €{item.price.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1.5, px: 3 }}>
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

export default Facturen;
