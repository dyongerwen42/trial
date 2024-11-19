import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Card } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TaskCreationForm from './TaskCreationForm';
import Planning from './Planning';

const TaskAndPlanningAccordion = () => {
  const [expanded, setExpanded] = useState('taskCreation'); // Default to Task Creation expanded

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#f5f6fa', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 500, color: '#333', textAlign: 'center', mb: 3 }}>
        Maintenance & Planning Dashboard
      </Typography>

      <Card
        sx={{
          boxShadow: 3,
          borderRadius: 2,
          width: { xs: '100%', sm: '80%', md: '70%' },
          bgcolor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Task Creation Accordion */}
        <Accordion
          expanded={expanded === 'taskCreation'}
          onChange={handleChange('taskCreation')}
          sx={{
            '&.MuiAccordion-root': { boxShadow: 1, mb: 1 },
            '&.Mui-expanded': { mt: 1 },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#666' }} />}
            sx={{
              backgroundColor: '#f9fafc',
              color: '#333',
              fontWeight: 500,
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <Typography>Task Creation</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: '#fafbfc', p: 2 }}>
            <TaskCreationForm />
          </AccordionDetails>
        </Accordion>

        {/* Planning Section (always open) */}
        <Accordion expanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#666' }} />}
            sx={{
              backgroundColor: '#f4f5f7',
              color: '#333',
              fontWeight: 500,
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <Typography>Planning Overview</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: '#fafbfc', p: 2 }}>
            <Planning />
          </AccordionDetails>
        </Accordion>
      </Card>
    </Box>
  );
};

export default TaskAndPlanningAccordion;
