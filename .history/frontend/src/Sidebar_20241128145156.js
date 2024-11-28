// components/Sidebar.jsx

import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  Button,
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';

const Sidebar = ({
  categorizedElements,
  selectedElementsByCategory,
  toggleElementSelection,
  toggleSelectAll,
  openAddDialog,
  handleOpenInfoDialog,
  taskGroupsMap,
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        height: '100%',
        p: 4,
        overflowY: 'auto',
        borderRadius: 3,
        backgroundColor: '#ffffff',
      }}
    >
      {/* Elements Header */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
        Elementen
      </Typography>

      {/* Weergave van Elementen per Categorie en Ruimte */}
      {Object.entries(categorizedElements).map(([category, spaces]) => {
        const allElementIds = Object.values(spaces).flat().map((el) => el.id);
        const selected = selectedElementsByCategory[category] || [];
        const isAllSelected = selected.length === allElementIds.length;

        return (
          <Accordion key={category} sx={{ mb: 3, boxShadow: 'none' }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: '#f0f0f0',
                borderRadius: 1,
                '&:hover': { backgroundColor: '#e0e0e0' },
                px: 2,
                py: 1,
              }}
            >
              {/* Select All Checkbox */}
              <Checkbox
                checked={isAllSelected}
                indeterminate={selected.length > 0 && !isAllSelected}
                onChange={() => toggleSelectAll(category)}
                sx={{ mr: 1 }}
                color="primary"
                onClick={(e) => e.stopPropagation()} // Voorkom Accordion toggle
                inputProps={{ 'aria-label': `Selecteer alle elementen in ${category}` }}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {category}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, py: 1 }}>
              {/* Ruimtes binnen de categorie */}
              {Object.entries(spaces).map(([spaceName, elements]) => (
                <Box key={spaceName} sx={{ mb: 2 }}>
                  {/* Ruimte Header */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    {spaceName}
                  </Typography>
                  {/* Elementen binnen de ruimte */}
                  {elements.map((element) => {
                    // Bereken geplande jaren per element binnen de huidige categorie
                    const plannedYears = Array.from(
                      new Set(
                        (element.tasks || [])
                          .filter(
                            (task) =>
                              task.endDate &&
                              taskGroupsMap[task.groupId]?.name === category
                          )
                          .map((task) => new Date(task.endDate).getFullYear())
                      )
                    ).sort((a, b) => a - b); // Sorteer jaren oplopend

                    return (
                      <Card
                        key={element.id}
                        variant="outlined"
                        sx={{
                          mb: 2,
                          borderRadius: 2,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                          backgroundColor: selected.includes(element.id)
                            ? '#e3f2fd'
                            : '#ffffff',
                          transition: 'background-color 0.3s',
                        }}
                      >
                        <CardHeader
                          avatar={
                            <Checkbox
                              checked={selected.includes(element.id)}
                              onChange={() => toggleElementSelection(category, element.id)}
                              color="primary"
                              size="small"
                              inputProps={{ 'aria-label': `Selecteer ${element.name}` }}
                            />
                          }
                          action={
                            <Tooltip title="Details bekijken" arrow>
                              <IconButton
                                aria-label={`Bekijk details van ${element.name}`}
                                onClick={() => handleOpenInfoDialog(element)}
                                size="small"
                              >
                                <InfoOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          }
                          title={
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {element.name}
                            </Typography>
                          }
                          subheader={
                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                              {element.spaceName}
                            </Typography>
                          }
                        />
                        <CardContent>
                          {/* Foto's weergeven in Sidebar */}
                          {element.photos && element.photos.length > 0 && (
                            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                              {element.photos.map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo.replace(/\\/g, '/')}
                                  alt={`${element.name} ${index + 1}`}
                                  style={{
                                    width: '80px',
                                    height: '80px',
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                          {/* Voorwaardelijke Jaar Tags */}
                          {plannedYears.length > 0 && (
                            <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                              {plannedYears.map((year) => (
                                <Chip
                                  key={year}
                                  label={year}
                                  size="small"
                                  color="secondary"
                                  sx={{ mt: 0.5 }}
                                />
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              ))}
              {/* Voeg Button voor deze categorie */}
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<AddIcon fontSize="small" />}
                fullWidth
                sx={{
                  mt: 1,
                  textTransform: 'none',
                  borderRadius: 1,
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#115293',
                  },
                }}
                onClick={() => openAddDialog(category)}
                aria-label={`Voeg taakgroep toe aan ${category}`}
              >
                Taakgroep Toevoegen
              </Button>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Paper>
  );
};

Sidebar.propTypes = {
  categorizedElements: PropTypes.object.isRequired,
  selectedElementsByCategory: PropTypes.object.isRequired,
  toggleElementSelection: PropTypes.func.isRequired,
  toggleSelectAll: PropTypes.func.isRequired,
  openAddDialog: PropTypes.func.isRequired,
  handleOpenInfoDialog: PropTypes.func.isRequired,
  taskGroupsMap: PropTypes.object.isRequired,
};

export default Sidebar;
