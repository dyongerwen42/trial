// TaskTable.jsx

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
  Typography,
} from '@mui/material';

const TaskTable = ({ tasks, title }) => (
  <Paper elevation={3} sx={{ mt: 4, p: 2 }}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Taak Naam</TableCell>
            <TableCell>Beschrijving</TableCell>
            <TableCell>Urgentie</TableCell>
            <TableCell>Startdatum</TableCell>
            <TableCell>Einddatum</TableCell>
            <TableCell>Element</TableCell>
            <TableCell>Ruimte</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task, index) => (
            <TableRow key={index}>
              <TableCell>{task.name}</TableCell>
              <TableCell>{task.description}</TableCell>
              <TableCell>{task.urgency}</TableCell>
              <TableCell>
                {task.planned?.startDate
                  ? new Date(task.planned.startDate).toLocaleDateString()
                  : '-'}
              </TableCell>
              <TableCell>
                {task.planned?.endDate
                  ? new Date(task.planned.endDate).toLocaleDateString()
                  : new Date(task.ultimateDate).toLocaleDateString()}
              </TableCell>
              <TableCell>{task.elementName}</TableCell>
              <TableCell>{task.spaceName}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

export default TaskTable;
