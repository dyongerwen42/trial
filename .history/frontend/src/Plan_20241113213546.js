import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Card } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddTaskIcon from '@mui/icons-material/AddTask';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TaskCreationForm from './TaskCreationForm';
import Planning from './Planning';

const TaskAndPlanningAccordion = () => {
  const [expandedPanels, setExpandedPanels] = useState(['planning']); // Planning is open by default

  const handleChange = (panel) => (event, isExpanded) => {
    setExpandedPanels((prev) =>
      isExpanded ? [...prev, panel] : prev.filter((p) => p !== panel)
    );
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', p: 4, bgcolor: '#f4f6f8' }}>
      <Card
        sx={{
          boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.15)',
          borderRadius: 4,
          width: '100%',
          mx: 'auto',
          bgcolor: 'background.paper',
          p: 3,
        }}
      >
        {/* Task Creation Accordion */}
        <Accordion
          expanded={expandedPanels.includes('taskCreation')}
          onChange={handleChange('taskCreation')}
          sx={{
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            mb: 3,
            transition: 'all 0.3s ease',
            '&:hover': { boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.15)' },
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
            sx={{
              bgcolor: 'linear-gradient(135deg, #2196f3, #21cbf3)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              py: 2,
              px: 3,
              borderRadius: '8px',
              minHeight: '56px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              '& .MuiAccordionSummary-content': {
                margin: 0,
                alignItems: 'center',
              },
            }}
          >
            <AddTaskIcon sx={{ color: 'white', fontSize: '1.6rem' }} />
            <Typography variant="h6">Taak Creatie</Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              p: 3,
              bgcolor: 'background.default',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0px 0px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <TaskCreationForm />
          </AccordionDetails>
        </Accordion>

        {/* Planning Overview Accordion */}
        <Accordion
          expanded={expandedPanels.includes('planning')}
          onChange={handleChange('planning')}
          sx={{
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            mb: 3,
            transition: 'all 0.3s ease',
            '&:hover': { boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.15)' },
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
            sx={{
              bgcolor: 'linear-gradient(135deg, #ff9800, #ffc107)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              py: 2,
              px: 3,
              borderRadius: '8px',
              minHeight: '56px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              '& .MuiAccordionSummary-content': {
                margin: 0,
                alignItems: 'center',
              },
            }}
          >
            <CalendarTodayIcon sx={{ color: 'white', fontSize: '1.6rem' }} />
            <Typography variant="h6">Planning Overzicht</Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              p: 3,
              bgcolor: 'background.default',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0px 0px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Planning />
          </AccordionDetails>
        </Accordion>
      </Card>
    </Box>
  );
};

export default TaskAndPlanningAccordion;
