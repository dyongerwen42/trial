import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Modal,
  TextField,
  Select,
  MenuItem,
  Chip,
  FormControl,
  InputLabel,
} from '@mui/material';
import { red, green, blue, grey } from '@mui/material/colors';

// Initial data for projects with tags and fake date
const fakeProjects = [
    { id: '1', projectName: 'Dakonderhoud', startDate: '2023-01-01', endDate: '2023-06-01', price: 5000, status: 'Ongepland', tags: ['Schilderwerk', 'Reiniging'] },
    { id: '2', projectName: 'Schilderwerk buiten', startDate: '2023-02-01', endDate: '2023-08-01', price: 15000, status: 'Gepland', tags: ['Schilderwerk', 'Periodiek Onderhoud'] },
    { id: '3', projectName: 'Verlichting vervangen', startDate: '2023-04-01', endDate: '2023-07-01', price: 3000, status: 'Offerte Geaccepteerd', tags: ['Verlichting', 'Reiniging'] },
    { id: '4', projectName: 'Riolering inspectie', startDate: '2023-03-15', endDate: '2023-05-20', price: 2000, status: 'Factuur Geaccepteerd', tags: ['Inspectie', 'Reiniging'] },
    { id: '5', projectName: 'Gevelrenovatie', startDate: '2023-05-01', endDate: '2023-10-01', price: 22000, status: 'Gepland', tags: ['Renovatie', 'Reiniging'] },
    { id: '6', projectName: 'Tuinonderhoud', startDate: '2023-06-01', endDate: '2023-09-01', price: 7000, status: 'Ongepland', tags: ['Tuinwerk', 'Periodiek Onderhoud'] },
    { id: '7', projectName: 'Dakgoot vervanging', startDate: '2023-03-10', endDate: '2023-06-15', price: 5000, status: 'Factuur Geaccepteerd', tags: ['Vervanging', 'Dakwerk'] },
    { id: '8', projectName: 'Schilderwerk binnen', startDate: '2023-07-01', endDate: '2023-09-01', price: 12000, status: 'Offerte Geaccepteerd', tags: ['Schilderwerk', 'Interieur'] },
    { id: '9', projectName: 'Vloeronderhoud', startDate: '2023-04-01', endDate: '2023-06-01', price: 8000, status: 'Gepland', tags: ['Vloerwerk', 'Reiniging'] },
    { id: '10', projectName: 'Glasbewassing', startDate: '2023-08-01', endDate: '2023-10-01', price: 4000, status: 'Gepland', tags: ['Reiniging', 'Periodiek Onderhoud'] },
    { id: '11', projectName: 'Loodgieterswerk', startDate: '2023-09-15', endDate: '2023-11-15', price: 2500, status: 'Ongepland', tags: ['Reparatie', 'Onderhoud'] },
    { id: '12', projectName: 'Isolatie project', startDate: '2023-10-01', endDate: '2024-01-01', price: 35000, status: 'Gepland', tags: ['Verduurzaming', 'Isolatie'] },
    { id: '13', projectName: 'Parkeerplaats renovatie', startDate: '2023-07-15', endDate: '2023-10-15', price: 15000, status: 'Factuur Geaccepteerd', tags: ['Renovatie', 'Buitenwerk'] },
    { id: '14', projectName: 'Ventilatiesysteem onderhoud', startDate: '2023-08-01', endDate: '2023-10-01', price: 5000, status: 'Offerte Geaccepteerd', tags: ['Onderhoud', 'Ventilatie'] },
    { id: '15', projectName: 'Ramen vervangen', startDate: '2023-09-01', endDate: '2023-12-01', price: 10000, status: 'Gepland', tags: ['Vervanging', 'Ramen'] },
  ];
  

const fakeUsers = [
  { id: '1', firstName: 'John', lastName: 'Doe' },
  { id: '2', firstName: 'Jane', lastName: 'Smith' },
];

const statuses = ['Ongepland', 'Gepland', 'Offerte Geaccepteerd', 'Factuur Geaccepteerd'];

// Card Component
const KanbanCard = ({ id, projectName, startDate, endDate, price, status, tags, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useDraggable({
    id,
    data: { id, projectName, status },
  });

  const style = {
    transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0)`,
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={onClick}>
      <Card
        sx={{
          mb: 3,
          boxShadow: 6,
          borderRadius: 2,
          backgroundColor: grey[100],
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <CardHeader
          title={projectName}
          subheader={`Status: ${status}`}
          sx={{ backgroundColor: status === 'Ongepland' ? red[100] : status === 'Gepland' ? blue[100] : green[100] }}
        />
        <CardContent>
          <Typography variant="body2">Startdatum: {new Date(startDate).toLocaleDateString()}</Typography>
          <Typography variant="body2">Einddatum: {endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}</Typography>
          <Typography variant="body2">Prijs: €{price}</Typography>
          <Box sx={{ mt: 2 }}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                sx={{ mr: 1, mb: 1, backgroundColor: blue[50], color: blue[800], fontWeight: 'bold' }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

// Kanban Lane Component
const KanbanLane = ({ title, items, onCardClick }) => {
  const { setNodeRef } = useDroppable({ id: title });

  return (
    <Box ref={setNodeRef} sx={{ p: 3, backgroundColor: grey[200], borderRadius: 3, minHeight: '450px' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: blue[800] }}>{title}</Typography>
      {items.map((item) => (
        <KanbanCard key={item.id} {...item} onClick={() => onCardClick(item)} />
      ))}
    </Box>
  );
};

// Main Kanban View Component
const KanbanView = () => {
  const [projects, setProjects] = useState(fakeProjects);
  const [columns, setColumns] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    const groupedProjects = statuses.reduce((acc, status) => {
      acc[status] = projects.filter(project => project.status === status);
      return acc;
    }, {});
    setColumns(groupedProjects);
  }, [projects]);

  const handleCardClick = (project) => {
    setSelectedProject(project);
    setComments([]);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedProject(null);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments([...comments, newComment]);
      setNewComment('');
    }
  };

  const handleFilter = () => {
    const filteredProjects = fakeProjects.filter(project => {
      const projectStartDate = new Date(project.startDate);
      const filterStartDate = new Date(filterDate);
      return (!filterDate || projectStartDate >= filterStartDate) &&
        (!selectedTag || project.tags.includes(selectedTag));
    });
    setProjects(filteredProjects);
  };

  return (
    <Box sx={{ p: 6, backgroundColor: grey[100], minHeight: '100vh' }}>
 
      {/* Filters */}
      <Box sx={{ mb: 10, display: 'flex', justifyContent: 'center', gap: 3 }}>
        <TextField
          label="Filter op Startdatum"
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: '200px' }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter op Tag</InputLabel>
          <Select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <MenuItem value=""><em>Geen</em></MenuItem>
            <MenuItem value="Schilderwerk">Schilderwerk</MenuItem>
            <MenuItem value="Periodiek Onderhoud">Periodiek Onderhoud</MenuItem>
            <MenuItem value="Reiniging">Reiniging</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" onClick={handleFilter} sx={{ px: 4, py: 1 }}>
          Filteren
        </Button>
      </Box>

      <DndContext collisionDetection={closestCenter}>
        <Grid container spacing={4}>
          {statuses.map(status => (
            <Grid item xs={12} sm={6} md={3} key={status}>
              <KanbanLane title={status} items={columns[status] || []} onCardClick={handleCardClick} />
            </Grid>
          ))}
        </Grid>
      </DndContext>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={handleModalClose}
        aria-labelledby="project-modal-title"
        aria-describedby="project-modal-description"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Card sx={{ p: 4, maxWidth: '600px', borderRadius: 4, boxShadow: 12, backgroundColor: grey[50] }}>
          {selectedProject && (
            <>
              <Typography variant="h5" sx={{ mb: 3 }}>{selectedProject.projectName}</Typography>
              <Typography variant="body1">Status: {selectedProject.status}</Typography>
              <Typography variant="body1">Startdatum: {new Date(selectedProject.startDate).toLocaleDateString()}</Typography>
              <Typography variant="body1">Einddatum: {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'N/A'}</Typography>
              <Typography variant="body1">Prijs: €{selectedProject.price}</Typography>

              {/* Users Section */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6">Gebruikers Toewijzen</Typography>
                <FormControl fullWidth>
                  <InputLabel>Gebruikers</InputLabel>
                  <Select
                    multiple
                    value={selectedUsers}
                    onChange={(e) => setSelectedUsers(e.target.value)}
                    renderValue={(selected) => selected.join(', ')}
                  >
                    {fakeUsers.map((user) => (
                      <MenuItem key={user.id} value={`${user.firstName} ${user.lastName}`}>
                        {`${user.firstName} ${user.lastName}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Comments Section */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6">Opmerkingen</Typography>
                <TextField
                  label="Nieuwe opmerking"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                />
                <Button variant="contained" onClick={handleAddComment} sx={{ mt: 2 }}>
                  Opmerking Toevoegen
                </Button>
                {comments.map((comment, index) => (
                  <Chip key={index} label={comment} sx={{ mt: 1 }} />
                ))}
              </Box>

              <Button onClick={handleModalClose} variant="contained" color="secondary" sx={{ mt: 3 }}>
                Sluiten
              </Button>
            </>
          )}
        </Card>
      </Modal>
    </Box>
  );
};

export default KanbanView;
