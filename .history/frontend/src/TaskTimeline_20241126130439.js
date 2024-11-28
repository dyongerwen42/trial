// TaskTimeline.jsx

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import YearCard from './YearCard'; // Zorg ervoor dat YearCard correct is geïmporteerd

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
        p: 4,
        borderRadius: 3,
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Tijdlijn Header */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Tijdlijn
      </Typography>
      <Box
        display="flex"
        flexWrap="nowrap"
        gap={4}
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
