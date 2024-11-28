// TaskTimeline.js

import React from 'react';
import {
  Paper,
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Assignment as AssignmentIcon, // Correcte import en hernoeming
} from '@mui/icons-material';

// YearCard Component
const YearCard = ({ year, totalCost, taskGroups, handleOpenTaskGroupInfoDialog }) => {
  const hasTasks = taskGroups && taskGroups.length > 0;

  return (
    <Card
      variant="outlined"
      sx={{
        minWidth: 200, // Verkleind van 220 naar 200 voor compactheid
        textAlign: 'center',
        backgroundColor: hasTasks ? '#ffffff' : '#f5f5f5',
        borderRadius: 2,
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        cursor: hasTasks ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: hasTasks ? 'scale(1.02)' : 'none',
          boxShadow: hasTasks
            ? '0 4px 10px rgba(0,0,0,0.15)'
            : '0 2px 5px rgba(0,0,0,0.1)',
        },
        position: 'relative',
      }}
      onClick={() => {
        if (hasTasks) {
          handleOpenTaskGroupInfoDialog(taskGroups);
        }
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: '#1976d2', width: 28, height: 28 }}>
            <CalendarTodayIcon fontSize="small" />
          </Avatar>
        }
        title={
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            {year}
          </Typography>
        }
      />
      <CardContent>
        {/* Totale Kosten Weergave */}
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
          Totale Kosten: €{totalCost || 0}
        </Typography>
        {/* Taakgroepen of Geen Taken Bericht */}
        {hasTasks ? (
          taskGroups.map((group) => (
            <Box key={group.id} sx={{ mb: 1 }}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Voorkom dat de ouder onClick wordt getriggerd
                  handleOpenTaskGroupInfoDialog(group);
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: '#ff9800', width: 24, height: 24 }}>
                      <AssignmentIcon fontSize="small" />
                    </Avatar>
                  }
                  title={
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {group.name}
                    </Typography>
                  }
                  subheader={
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                      Kosten: €{group.assignPricesIndividually ? 'Variabel' : group.cost}
                    </Typography>
                  }
                />
              </Card>
            </Box>
          ))
        ) : (
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
            Geen taken voor dit jaar.
          </Typography>
        )}
      </CardContent>
      {/* Tooltip voor Niet-Klikbare Jaren */}
      {!hasTasks && (
        <Tooltip title="Geen taakgroepen beschikbaar voor dit jaar" placement="top">
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          />
        </Tooltip>
      )}
    </Card>
  );
};

// TaskTimeline Component
const TaskTimeline = ({
  years,
  taskGroupsByYear,
  totalCostPerYear,
  handleOpenTaskGroupInfoDialog,
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        height: '100%',
        p: 3, // Verminderd van 4 naar 3 voor minder padding
        borderRadius: 3,
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Tijdlijn Header */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 2, fontSize: '1.25rem' }}>
        Tijdlijn
      </Typography>
      <Box
        display="flex"
        flexWrap="nowrap"
        gap={2} // Verminderd van 4 naar 2 voor minder marge tussen kolommen
        overflow="auto"
        sx={{ flexGrow: 1, mt: 1, pb: 2 }}
      >
        {years.map((year) => {
          const hasTasks = taskGroupsByYear[year] && taskGroupsByYear[year].length > 0;
          return (
            <YearCard
              key={year}
              year={year}
              totalCost={totalCostPerYear[year]}
              taskGroups={taskGroupsByYear[year]}
              handleOpenTaskGroupInfoDialog={handleOpenTaskGroupInfoDialog}
            />
          );
        })}
      </Box>
    </Paper>
  );
};

export default TaskTimeline;
