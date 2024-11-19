import React, { useState } from 'react';
import {
  Box, Typography, Button, Grid, Card, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Collapse,
  IconButton,
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme } from '@mui/material/styles';

// Updated budget data with subtasks
const budgetData = [
  {
    id: 1,
    category: 'Onderhoud',
    amount: 25000,
    year: 2022,
    subtasks: [
      { name: 'Dakreparatie', amount: 12000 },
      { name: 'Schilderwerk', amount: 8000 },
      { name: 'Loodgieter', amount: 5000 },
    ],
  },
  {
    id: 2,
    category: 'Energie',
    amount: 18000,
    year: 2022,
    subtasks: [
      { name: 'Elektriciteit', amount: 10000 },
      { name: 'Water', amount: 5000 },
      { name: 'Gas', amount: 3000 },
    ],
  },
  {
    id: 3,
    category: 'Administratie',
    amount: 12000,
    year: 2023,
    subtasks: [
      { name: 'Boekhouding', amount: 6000 },
      { name: 'Juridisch Advies', amount: 4000 },
      { name: 'Kantoorartikelen', amount: 2000 },
    ],
  },
];

const BudgetOverzicht = () => {
  const theme = useTheme();
  const [year, setYear] = useState('all');
  const [openSubtasks, setOpenSubtasks] = useState({});

  const handleYearChange = (event) => {
    setYear(event.target.value);
  };

  const handleToggleSubtasks = (id) => {
    setOpenSubtasks((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  // Filter data by year or show all
  const filteredData = year === 'all' ? budgetData : budgetData.filter(item => item.year.toString() === year);

  // Total calculation
  const totalAmount = filteredData.reduce((acc, item) => acc + item.amount, 0);

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}
          gutterBottom
        >
          Begrotingsoverzicht
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
          Bekijk de begrotingscategorieën en subtaken en exporteer deze naar Excel of PDF voor verder gebruik.
        </Typography>
      </Box>

      {/* Year Selector */}
      <Grid container justifyContent="center" sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Jaar Filter</InputLabel>
            <Select
              value={year}
              onChange={handleYearChange}
              label="Jaar Filter"
              sx={{
                backgroundColor: theme.palette.background.paper,
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
              }}
            >
              <MenuItem value="all">Alle Jaren</MenuItem>
              <MenuItem value="2022">2022</MenuItem>
              <MenuItem value="2023">2023</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Export Buttons */}
      <Grid container justifyContent="center" spacing={2} sx={{ mb: 4 }}>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<GetAppIcon />}
            sx={{
              padding: '10px 20px',
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            Export naar Excel
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PictureAsPdfIcon />}
            sx={{
              padding: '10px 20px',
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            Export naar PDF
          </Button>
        </Grid>
      </Grid>

      {/* Budget Table */}
      <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)' }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: theme.palette.secondary.light }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', padding: '16px', color: theme.palette.primary.main }}>Categorie</TableCell>
                <TableCell sx={{ fontWeight: 'bold', padding: '16px', color: theme.palette.primary.main }}>Jaar</TableCell>
                <TableCell sx={{ fontWeight: 'bold', padding: '16px', color: theme.palette.primary.main }}>Bedrag (€)</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map(item => (
                <React.Fragment key={item.id}>
                  <TableRow>
                    <TableCell sx={{ padding: '16px' }}>{item.category}</TableCell>
                    <TableCell sx={{ padding: '16px' }}>{item.year}</TableCell>
                    <TableCell sx={{ padding: '16px' }}>{item.amount.toLocaleString()}</TableCell>
                    <TableCell sx={{ padding: '16px' }}>
                      <IconButton onClick={() => handleToggleSubtasks(item.id)}>
                        <ExpandMoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ padding: 0 }} colSpan={4}>
                      <Collapse in={openSubtasks[item.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                          <Typography variant="h6" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
                            Subtaken
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Subtaak</TableCell>
                                <TableCell>Bedrag (€)</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {item.subtasks.map((subtask, index) => (
                                <TableRow key={index}>
                                  <TableCell>{subtask.name}</TableCell>
                                  <TableCell>{subtask.amount.toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
              <TableRow>
                <TableCell colSpan={2} sx={{ fontWeight: 'bold', padding: '16px' }}>Totaal</TableCell>
                <TableCell sx={{ fontWeight: 'bold', padding: '16px' }}>{totalAmount.toLocaleString()} €</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default BudgetOverzicht;
