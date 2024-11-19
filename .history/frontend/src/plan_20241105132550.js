import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Card, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
    <Box sx={{ width: '100%', minHeight: '100vh', p: 4, bgcolor: 'background.default' }}>
      {/* Header Section */}
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: 'primary.main',
          mb: 2,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Onderhoud & Planning Dashboard
      </Typography>
      <Typography
        variant="body1"
        color="textSecondary"
        align="center"
        sx={{
          mb: 4,
          fontSize: '1.1rem',
        }}
      >
        Beheer taken en bekijk planningsschema's in een overzichtelijke indeling.
      </Typography>

      <Card
        sx={{
          boxShadow: 4,
          borderRadius: 2,
          width: '100%',
          maxWidth: '100%',
          mx: 'auto',
          bgcolor: 'background.paper',
        }}
      >
        {/* Task Creation Accordion */}
        <Accordion
          expanded={expandedPanels.includes('taskCreation')}
          onChange={handleChange('taskCreation')}
          sx={{
            '&.MuiAccordion-root': { boxShadow: 3, mb: 2, borderRadius: 2 },
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
            sx={{
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              '& .MuiAccordionSummary-content': {
                my: 1,
              },
            }}
          >
            <Typography>Taak Creatie</Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              p: 3,
              bgcolor: 'background.default',
              borderRadius: 1,
              boxShadow: 'inset 0px 0px 5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <TaskCreationForm />
          </AccordionDetails>
        </Accordion>

        {/* Divider for visual separation */}
        <Divider variant="middle" />

        {/* Planning Overview Accordion */}
        <Accordion
          expanded={expandedPanels.includes('planning')}
          onChange={handleChange('planning')}
          sx={{
            '&.MuiAccordion-root': { boxShadow: 3, mb: 2, borderRadius: 2 },
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
            sx={{
              backgroundColor: 'secondary.light',
              color: 'secondary.contrastText',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              '& .MuiAccordionSummary-content': {
                my: 1,
              },
            }}
          >
            <Typography>Planning Overzicht</Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              p: 3,
              bgcolor: 'background.default',
              borderRadius: 1,
              boxShadow: 'inset 0px 0px 5px rgba(0, 0, 0, 0.1)',
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
