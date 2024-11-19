import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  CheckCircle,
  CheckCircleOutline,
  Error,
  Warning,
  Search as SearchIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
} from '@mui/icons-material';

const truncateDescription = (description, maxLength) => {
  return description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
};

const InspectionTableView = ({
  filteredItems,
  handleOpenModal,
  handleOpenImageAnnotationModal,
  lastModifiedReportId,
}) => {
  const theme = useTheme();

  const sortedItems = useMemo(() => {
    return filteredItems.sort((a, b) => new Date(a.inspectionDate) - new Date(b.inspectionDate));
  }, [filteredItems]);

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
    if (monthDiff <= 0) {
      return (
        <Tooltip title="Inspectie is achterstallig">
          <Error style={{ color: theme.palette.error.main }} />
        </Tooltip>
      );
    } else if (monthDiff <= 1) {
      return (
        <Tooltip title="Inspectie binnenkort vereist">
          <Warning style={{ color: theme.palette.warning.main }} />
        </Tooltip>
      );
    }
    return (
      <Tooltip title="Inspectie up-to-date">
        <CheckCircleOutline style={{ color: theme.palette.success.main }} />
      </Tooltip>
    );
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main }}>
        Inspectie Overzicht
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 4, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', p: 2 }}>Naam</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', p: 2 }}>Beschrijving</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', p: 2 }}>Inspectiedatum</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', p: 2, textAlign: 'center' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', p: 2 }}>Acties</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedItems.map((report) => (
              <TableRow 
                key={report.id} 
                hover
                sx={{
                  backgroundColor: report.id === lastModifiedReportId ? theme.palette.action.hover : 'inherit',
                  transition: 'background-color 0.3s ease',
                }}
              >
                <TableCell sx={{ p: 2 }}>{report.elementName}</TableCell>
                <TableCell sx={{ p: 2 }}>{truncateDescription(report.elementDescription, 50)}</TableCell>
                <TableCell sx={{ p: 2 }}>{report.inspectionDate ? new Date(report.inspectionDate).toLocaleDateString() : 'Nog niet gepland'}</TableCell>
                <TableCell sx={{ p: 2, textAlign: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center">
                    {getStatusIcon(report.inspectionDone, report.inspectionDate)}
                    <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'medium' }}>
                      {report.inspectionDone ? 'Voltooid' : 'Niet voltooid'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1 }}>
                    <Tooltip title="Inspectie bekijken">
                      <IconButton
                        onClick={() => handleOpenModal(report.elementId, report)}
                        color="primary"
                        size="small"
                      >
                        <SearchIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Annotatie toevoegen">
                      <IconButton
                        onClick={() => handleOpenImageAnnotationModal(report)}
                        color="primary"
                        size="small"
                      >
                        <AddPhotoAlternateIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InspectionTableView;
