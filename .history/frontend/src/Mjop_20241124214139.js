import React, { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Checkbox,
  Chip,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon, Info as InfoIcon } from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";

const StyledComponent = () => {
  const [yearRange, setYearRange] = useState(10);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTaskDetails, setNewTaskDetails] = useState({
    name: "",
    description: "",
    urgency: 3,
  });
  const [selectedTasks, setSelectedTasks] = useState([]);

  const years = Array.from({ length: yearRange }, (_, i) => startYear + i);

  const handleYearRangeChange = (event) => setYearRange(event.target.value);
  const handleOpenAddDialog = () => setIsAddDialogOpen(true);
  const handleCloseAddDialog = () => setIsAddDialogOpen(false);
  const handleAddTask = () => setIsAddDialogOpen(false);
  const handleFieldChange = (field, value) =>
    setNewTaskDetails((prev) => ({ ...prev, [field]: value }));

  return (
    <Grid container spacing={2} sx={{ height: "100vh", backgroundColor: "#f0f4f8" }}>
      {/* Sidebar */}
      <Grid item xs={4}>
        <Paper
          elevation={3}
          sx={{
            height: "100%",
            p: 3,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            background: "linear-gradient(135deg, #ffffff, #f7f8fa)",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
            borderRadius: 4,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "#34495e", marginBottom: 2 }}
          >
            Taken Overzicht
          </Typography>
          {/* Example Accordion */}
          <Accordion elevation={2} sx={{ marginBottom: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: "#eaf0f6" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Voorbeeld Item
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
                <Checkbox />
                <Typography flex={1} sx={{ fontSize: 16 }}>
                  Voorbeeld Taak
                </Typography>
                <Chip label="Urgentie 3" size="small" color="warning" />
              </Box>
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Grid>

      {/* Timeline */}
      <Grid item xs={8}>
        <Paper
          elevation={3}
          sx={{
            height: "100%",
            p: 3,
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(135deg, #f7f8fa, #eaf0f6)",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
            borderRadius: 4,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 3,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#34495e" }}>
              Tijdlijn Overzicht
            </Typography>
            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel>Jaren</InputLabel>
              <Select value={yearRange} onChange={handleYearRangeChange}>
                <MenuItem value={10}>10 Jaar</MenuItem>
                <MenuItem value={15}>15 Jaar</MenuItem>
                <MenuItem value={20}>20 Jaar</MenuItem>
                <MenuItem value={25}>25 Jaar</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "nowrap",
              overflowX: "auto",
              gap: 2,
              padding: 2,
            }}
          >
            {years.map((year) => (
              <Paper
                key={year}
                elevation={1}
                sx={{
                  minWidth: 200,
                  padding: 2,
                  borderRadius: 4,
                  textAlign: "center",
                  background: "#ffffff",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "#34495e" }}>
                  {year}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Paper>
      </Grid>

      {/* Add Task Button */}
      <Button
        variant="contained"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          background: "linear-gradient(135deg, #1e88e5, #42a5f5)",
          color: "#fff",
          fontWeight: "bold",
          borderRadius: 8,
          boxShadow: "0px 4px 20px rgba(0,0,0,0.2)",
          "&:hover": {
            background: "linear-gradient(135deg, #42a5f5, #64b5f6)",
          },
        }}
        onClick={handleOpenAddDialog}
      >
        Toevoegen
      </Button>

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onClose={handleCloseAddDialog}>
        <DialogTitle sx={{ backgroundColor: "#eaf0f6", fontWeight: "bold" }}>
          Nieuwe Taak Toevoegen
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Taaknaam"
            fullWidth
            margin="dense"
            variant="outlined"
            value={newTaskDetails.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label="Beschrijving"
            fullWidth
            margin="dense"
            variant="outlined"
            multiline
            rows={3}
            value={newTaskDetails.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label="Urgentie"
            select
            fullWidth
            value={newTaskDetails.urgency}
            onChange={(e) => handleFieldChange("urgency", e.target.value)}
          >
            {[1, 2, 3, 4, 5].map((urgency) => (
              <MenuItem key={urgency} value={urgency}>
                {urgency}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Annuleren</Button>
          <Button
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #1e88e5, #42a5f5)",
              color: "#fff",
              "&:hover": {
                background: "linear-gradient(135deg, #42a5f5, #64b5f6)",
              },
            }}
            onClick={handleAddTask}
          >
            Toevoegen
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default StyledComponent;
