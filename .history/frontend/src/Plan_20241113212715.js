// TaskAndPlanningAccordion.jsx
import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Card,
  useTheme,
  styled,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TaskCreationForm from './TaskCreationForm';
import Planning from './Planning';

const StyledAccordion = styled(Accordion)(({ theme, bgcolor }) => ({
  boxShadow: theme.shadows[1],
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  '&:before': { display: 'none' },
  '& .MuiAccordionSummary-root': {
    backgroundColor: bgcolor || theme.palette.primary.main,
    color: theme.palette.getContrastText(bgcolor || theme.palette.primary.main),
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.pxToRem(16),
    minHeight: 48,
    '& .MuiAccordionSummary-content': {
      margin: 0,
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.getContrastText(bgcolor || theme.palette.primary.main),
    },
  },
  '& .MuiAccordionDetails-root': {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    boxShadow: 'inset 0px 0px 5px rgba(0, 0, 0, 0.05)',
  },
}));

const TaskAndPlanningAccordion = () => {
  const theme = useTheme();
  const [expandedPanels, setExpandedPanels] = useState(['planning']); // Planning is open by default

  const handleChange = (panel) => (event, isExpanded) => {
    setExpandedPanels((prev) =>
      isExpanded ? [...prev, panel] : prev.filter((p) => p !== panel)
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        p: { xs: 2, md: 4 },
        bgcolor: 'background.default',
      }}
    >
      <Card
        sx={{
          boxShadow: theme.shadows[4],
          borderRadius: theme.shape.borderRadius * 2,
          width: '100%',
          maxWidth: 1200,
          mx: 'auto',
          bgcolor: 'background.paper',
          p: { xs: 2, md: 4 },
        }}
      >
        {/* Task Creation Accordion */}
        <StyledAccordion
          expanded={expandedPanels.includes('taskCreation')}
          onChange={handleChange('taskCreation')}
          bgcolor={theme.palette.primary.main}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="taskCreation-content"
            id="taskCreation-header"
          >
            <Typography variant="subtitle1">
              Taak Creatie
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TaskCreationForm />
          </AccordionDetails>
        </StyledAccordion>

        {/* Planning Overview Accordion */}
        <StyledAccordion
          expanded={expandedPanels.includes('planning')}
          onChange={handleChange('planning')}
          bgcolor={theme.palette.secondary.main}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="planning-content"
            id="planning-header"
          >
            <Typography variant="subtitle1">
              Planning Overzicht
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Planning />
          </AccordionDetails>
        </StyledAccordion>
      </Card>
    </Box>
  );
};

export default TaskAndPlanningAccordion;
