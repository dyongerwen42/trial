// Sidebar.jsx
import React, { useMemo } from 'react';
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
import { useMjopContext } from './MjopContext';

const Sidebar = () => {
  const {
    state,
    toggleElementSelection, // You'll need to implement these functions in context
    toggleSelectAll,        // Or handle them within Sidebar if appropriate
    openAddDialog,          // Similarly, ensure these functions are available
    handleOpenInfoDialog,   // via context or define them here
    taskGroupsMap,          // If not in context, you'll need to handle taskGroups differently
  } = useMjopContext();

  // Compute categorizedElements using useMemo
  const categorizedElements = useMemo(() => {
    return state.globalElements.reduce((acc, element) => {
      const elementCategories = element.categories || [];
      const spaceName =
        state.globalSpaces.find((space) => space.id === element.spaceId)?.name ||
        'Onbekende Ruimte';

      elementCategories.forEach((category) => {
        if (!acc[category]) {
          acc[category] = {};
        }
        if (!acc[category][spaceName]) {
          acc[category][spaceName] = [];
        }
        acc[category][spaceName].push({
          ...element,
          spaceName,
        });
      });
      return acc;
    }, {});
  }, [state.globalElements, state.globalSpaces]);

  // Safeguard to ensure categorizedElements is an object
  if (!categorizedElements || typeof categorizedElements !== 'object') {
    return <Typography>No data available</Typography>;
  }

  return (
    <Paper
      elevation={5}
      sx={{
        height: '100%',
        p: 2,
        overflowY: 'auto',
        borderRadius: 3,
        background: 'linear-gradient(to bottom, #f8fafc, #ffffff)',
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
      }}
    >
      {/* Header */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1.1rem', color: '#1e293b' }}>
        Elementen
      </Typography>

      {/* Categorized Elements */}
      {Object.entries(categorizedElements).map(([category, spaces]) => {
        const allElementIds = Object.values(spaces).flat().map((el) => el.id);
        const selected = state.selectedElementsByCategory[category] || [];
        const isAllSelected = selected.length === allElementIds.length;

        return (
          <Accordion
            key={category}
            disableGutters
            sx={{
              mb: 2,
              borderRadius: 2,
              backgroundColor: '#ffffff',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Accordion Summary */}
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#64748b', fontSize: '1rem' }} />}
              sx={{
                backgroundColor: '#f1f5f9',
                px: 2,
                py: 1,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              {/* Checkbox with stopPropagation */}
              <Checkbox
                checked={isAllSelected}
                indeterminate={selected.length > 0 && !isAllSelected}
                onChange={() => toggleSelectAll(category)}
                sx={{ p: 0.5 }} // Smaller padding for compactness
                color="secondary"
                onClick={(e) => e.stopPropagation()} // Prevents accordion toggle
              />
              {/* Title */}
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: '#1e293b',
                  flex: 1, // Ensures consistent text alignment
                }}
              >
                {category}
              </Typography>
            </AccordionSummary>

            {/* Accordion Details */}
            <AccordionDetails sx={{ px: 2, py: 1 }}>
              {Object.entries(spaces).map(([spaceName, elements]) => (
                <Box key={spaceName} sx={{ mb: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 500,
                      mb: 0.5,
                      fontSize: '0.85rem',
                      color: '#475569',
                      textTransform: 'uppercase',
                    }}
                  >
                    {spaceName}
                  </Typography>
                  {elements.map((element) => {
                    const plannedYears = Array.from(
                      new Set(
                        (element.tasks || [])
                          .filter(
                            (task) =>
                              task.endDate &&
                              state.taskGroupsMap[task.groupId]?.name === category
                          )
                          .map((task) => new Date(task.endDate).getFullYear())
                      )
                    ).sort((a, b) => a - b);

                    // Debugging: Log plannedYears for each element
                    console.log(`Element: ${element.name}, Planned Years:`, plannedYears);

                    return (
                      <Card
                        key={element.id}
                        variant="outlined"
                        sx={{
                          mb: 1,
                          borderRadius: 2,
                          backgroundColor: selected.includes(element.id)
                            ? '#fff7ed'
                            : '#ffffff',
                          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)',
                          '&:hover': {
                            backgroundColor: '#fff1e6',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        <CardHeader
                          avatar={
                            <Checkbox
                              checked={selected.includes(element.id)}
                              onChange={() => toggleElementSelection(category, element.id)}
                              color="secondary"
                              size="small"
                              onClick={(e) => e.stopPropagation()} // Prevents accordion toggle
                            />
                          }
                          action={
                            <Tooltip title="Details bekijken" arrow>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevents accordion toggle
                                  handleOpenInfoDialog(element);
                                }}
                                sx={{
                                  color: '#f97316',
                                }}
                              >
                                <InfoOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          }
                          title={
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: '#1e293b',
                              }}
                            >
                              {element.name}
                            </Typography>
                          }
                          subheader={
                            <Typography
                              variant="caption"
                              sx={{ color: '#64748b', fontSize: '0.75rem' }}
                            >
                              {element.spaceName}
                            </Typography>
                          }
                          sx={{ py: 0.5, px: 1.5 }}
                        />
                        <CardContent sx={{ py: 0.5, px: 1.5 }}>
                          {plannedYears.length > 0 && (
                            <Box
                              display="flex"
                              flexWrap="nowrap" // Prevent wrapping to keep all years on one line
                              gap={0.5}
                              overflowX="auto" // Enable horizontal scrolling
                              sx={{
                                '&::-webkit-scrollbar': {
                                  height: '6px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                  backgroundColor: '#cbd5e1',
                                  borderRadius: '3px',
                                },
                                '&::-webkit-scrollbar-track': {
                                  backgroundColor: '#f1f5f9',
                                  borderRadius: '3px',
                                },
                                paddingBottom: '4px', // Prevent scrollbar overlapping content
                              }}
                            >
                              {plannedYears.map((year) => (
                                <Chip
                                  key={year}
                                  label={year}
                                  size="small"
                                  sx={{
                                    fontSize: '0.75rem',
                                    backgroundColor: '#f97316',
                                    color: '#ffffff',
                                    height: '20px',
                                    borderRadius: '5px',
                                    flexShrink: 0, // Prevent chips from shrinking
                                  }}
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
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                fullWidth
                sx={{
                  mt: 1,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  backgroundColor: '#f97316',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#ea580c',
                  },
                  boxShadow: '0px 4px 12px rgba(249, 115, 22, 0.2)',
                }}
                onClick={() => openAddDialog(category)}
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

export default Sidebar;
