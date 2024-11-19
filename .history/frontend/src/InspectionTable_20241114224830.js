import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  Paper,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
  IconButton,
  Typography,
  Tooltip,
  Grid,
  Button,
  useTheme,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  CheckCircle,
  CheckCircleOutline,
  Error as ErrorIcon,
  Warning as WarningIcon,
  RequestPage as RequestPageIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const InspectionTable = ({
  filteredItems,
  filter,
  setFilter,
  handleInspectionChange,
  handleInspectionDoneChange,
  handleOpenModal,
  handleDeleteInspection,
  handleRequestInspection,
  handleDeleteElement,
  handleOpenImageAnnotationModal,
  handleRequestInspectionForAll,
  lastModifiedReportId,
}) => {
  const theme = useTheme();
  const [selectedRows, setSelectedRows] = useState([]);

  // Enhanced truncateDescription function within the component
  const truncateDescription = (description = '', maxLength = 100) => {
    if (typeof description !== 'string') {
      return ''; // Return empty string if description is not a string
    }

    if (description.length > maxLength) {
      return description.substring(0, maxLength) + '...';
    }
    return description;
  };

  // Sort items by inspection date
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort(
      (a, b) => new Date(a.inspectionDate) - new Date(b.inspectionDate)
    );
  }, [filteredItems]);

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAllRows = (event) => {
    if (event.target.checked) {
      const allIds = sortedItems.map((item) => item.id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  const getStatusIcon = (inspectionDone, inspectionDate) => {
    const currentDate = new Date();
    const inspectionDateObj = inspectionDate ? new Date(inspectionDate) : null;
    const monthDiff =
      inspectionDateObj
        ? (inspectionDateObj.getFullYear() - currentDate.getFullYear()) * 12 +
          (inspectionDateObj.getMonth() - currentDate.getMonth())
        : null;

    if (inspectionDone) {
      return <CheckCircle style={{ color: theme.palette.success.main }} />;
    }
    if (monthDiff !== null && monthDiff <= 0) {
      return (
        <Tooltip title="Inspectie is achterstallig">
          <ErrorIcon style={{ color: theme.palette.error.main, fontSize: '1.6rem' }} />
        </Tooltip>
      );
    } else if (monthDiff !== null && monthDiff <= 1) {
      return (
        <Tooltip title="Inspectie binnenkort vereist">
          <WarningIcon style={{ color: theme.palette.warning.main, fontSize: '1.6rem' }} />
        </Tooltip>
      );
    }
    return (
      <Tooltip title="Inspectie up-to-date">
        <CheckCircleOutline style={{ color: theme.palette.success.main, fontSize: '1.6rem' }} />
      </Tooltip>
    );
  };

  return (
    <Box>
      <Grid container spacing={2} alignItems="center" mb={2} sx={{ justifyContent: 'flex-start' }}>
        <Grid item>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            Filter
          </Typography>
        </Grid>
        <Grid item>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            displayEmpty
            inputProps={{ 'aria-label': 'Filteropties' }}
            variant="outlined"
            size="medium"
            sx={{
              minWidth: 240,
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <MenuItem value="todo">Te doen</MenuItem>
            <MenuItem value="done">Gedaan</MenuItem>
            <MenuItem value="all">Alles</MenuItem>
          </Select>
        </Grid>
        <Grid item>
          {selectedRows.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleRequestInspectionForAll(selectedRows)}
              sx={{
                ml: 2,
                borderRadius: 4,
                px: 3,
                py: 1.5,
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0px 4px 18px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              Verzoek om inspectie
            </Button>
          )}
        </Grid>
      </Grid>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 4,
          boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ padding: '16px' }}>
                <Checkbox
                  indeterminate={selectedRows.length > 0 && selectedRows.length < sortedItems.length}
                  checked={sortedItems.length > 0 && selectedRows.length === sortedItems.length}
                  onChange={handleSelectAllRows}
                  inputProps={{ 'aria-label': 'Selecteer alle rijen' }}
                />
              </TableCell>
              <TableCell sx={{ padding: '16px', fontWeight: 'bold' }}>Naam</TableCell>
              <TableCell sx={{ padding: '16px', fontWeight: 'bold' }}>Beschrijving</TableCell>
              <TableCell sx={{ padding: '16px', fontWeight: 'bold' }}>Inspectiedatum</TableCell>
              <TableCell sx={{ padding: '16px', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ padding: '16px', fontWeight: 'bold' }}>Acties</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedItems.map((report) => (
              <TableRow
                key={report.id}
                hover
                sx={{
                  backgroundColor:
                    report.id === lastModifiedReportId ? 'rgba(0, 0, 0, 0.05)' : 'inherit',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  },
                  transition: 'background-color 0.3s',
                }}
              >
                <TableCell padding="checkbox" sx={{ padding: '16px' }}>
                  <Checkbox
                    checked={selectedRows.includes(report.id)}
                    onChange={() => handleSelectRow(report.id)}
                    inputProps={{ 'aria-label': `Selecteer rij voor ${report.elementName}` }}
                  />
                </TableCell>
                <TableCell sx={{ padding: '16px', fontSize: '1rem' }}>{report.elementName}</TableCell>
                <TableCell sx={{ padding: '16px', fontSize: '1rem' }}>
                  <Typography>
                    {truncateDescription(report.elementDescription, 50)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ padding: '16px', fontSize: '1rem' }}>
                  <TextField
                    type="date"
                    value={
                      report.inspectionDate
                        ? new Date(report.inspectionDate).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      handleInspectionChange(
                        report.elementId,
                        report.id,
                        'inspectionDate',
                        e.target.value
                      )
                    }
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{
                      style: {
                        color: report.inspectionDate
                          ? theme.palette.text.primary
                          : theme.palette.text.disabled,
                        fontWeight: report.inspectionDate ? 'bold' : 'normal',
                        fontSize: report.inspectionDate ? '1.1rem' : '1rem',
                        backgroundColor: report.inspectionDate
                          ? 'rgba(76, 175, 80, 0.1)'
                          : 'inherit',
                        borderRadius: 2,
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ padding: '16px' }}>
                  <Box display="flex" alignItems="center">
                    {getStatusIcon(report.inspectionDone, report.inspectionDate)}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={report.inspectionDone}
                          onChange={(e) =>
                            handleInspectionDoneChange(
                              report.elementId,
                              report.id,
                              e.target.checked
                            )
                          }
                          color="primary"
                        />
                      }
                      label="Voltooid"
                      sx={{ ml: 2, fontSize: '1rem' }}
                    />
                  </Box>
                </TableCell>
                <TableCell sx={{ padding: '16px' }}>
                  <Box display="flex" gap={2}>
                    <Tooltip title="Inspectie bekijken">
                      <IconButton
                        onClick={() =>
                          handleOpenModal(
                            report.elementId,
                            report || { id: uuidv4(), mistakes: [] }
                          )
                        }
                        color="primary"
                      >
                        <SearchIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Verwijderen">
                      <IconButton
                        onClick={() => handleDeleteElement(report.elementId)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Annotatie toevoegen">
                      <IconButton
                        onClick={() => handleOpenImageAnnotationModal(report)}
                        color="primary"
                      >
                        <AddPhotoAlternateIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Verzoek Inspectie">
                      <IconButton
                        onClick={() => handleRequestInspection(report.id)}
                        color="secondary"
                      >
                        <RequestPageIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {sortedItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" color="textSecondary">
                    Geen inspecties gevonden.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

InspectionTable.propTypes = {
  filteredItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      elementId: PropTypes.string.isRequired,
      elementName: PropTypes.string.isRequired,
      elementDescription: PropTypes.string,
      inspectionDate: PropTypes.string,
      inspectionDone: PropTypes.bool.isRequired,
      // Add other fields as necessary
    })
  ).isRequired,
  filter: PropTypes.string.isRequired,
  setFilter: PropTypes.func.isRequired,
  handleInspectionChange: PropTypes.func.isRequired,
  handleInspectionDoneChange: PropTypes.func.isRequired,
  handleOpenModal: PropTypes.func.isRequired,
  handleDeleteInspection: PropTypes.func,
  handleRequestInspection: PropTypes.func.isRequired,
  handleDeleteElement: PropTypes.func.isRequired,
  handleOpenImageAnnotationModal: PropTypes.func.isRequired,
  handleRequestInspectionForAll: PropTypes.func.isRequired,
  lastModifiedReportId: PropTypes.string,
};

InspectionTable.defaultProps = {
  handleDeleteInspection: () => {},
  lastModifiedReportId: null,
};

export default InspectionTable;
