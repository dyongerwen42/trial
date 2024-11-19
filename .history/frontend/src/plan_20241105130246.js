import React, { useState } from 'react';
import { Tab, Tabs, Box, Card, Typography, Divider } from '@mui/material';
import TaskCreationForm from './TaskCreationForm';
import Planning from './Planning';

const TaskAndPlanningTabs = () => {
  const [activeTab, setActiveTab] = useState(0); // Default to Planning tab

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%', backgroundColor: '#f7f9fc', minHeight: '100vh', p: 4 }}>
      {/* Header Section */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Maintenance & Planning Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Manage tasks and view planning schedules all in one place.
      </Typography>

      {/* Tabs Section */}
      <Card
        sx={{
          boxShadow: 5,
          borderRadius: 3,
          p: 3,
          backgroundColor: '#ffffff',
          minWidth: { xs: '100%', sm: '80%', md: '70%' },
          mx: 'auto',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'medium',
              fontSize: '1.1rem',
              color: '#555',
              transition: 'color 0.3s',
              '&:hover': {
                color: '#0073e6',
              },
            },
            '& .Mui-selected': {
              color: '#0073e6',
              fontWeight: 'bold',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#0073e6',
              height: 4,
              borderRadius: 2,
            },
          }}
        >
          <Tab label="Planning" />
          <Tab label="Task Creation" />
        </Tabs>
        <Divider sx={{ my: 2 }} />

        {/* Content Section */}
        <Box
          sx={{
            mt: 4,
            p: 3,
            backgroundColor: '#f3f6fb',
            borderRadius: 3,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease-in-out',
          }}
        >
          {activeTab === 0 && <Planning />}
          {activeTab === 1 && <TaskCreationForm />}
        </Box>
      </Card>
    </Box>
  );
};

export default TaskAndPlanningTabs;
