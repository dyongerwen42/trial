import React, { useState, useMemo } from "react";
import axios from "axios";
import {
  FormControlLabel,
  Checkbox,
  Card,
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  useTheme,
  IconButton,
  Modal,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ClearIcon from "@mui/icons-material/Clear";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import UndoIcon from "@mui/icons-material/Undo";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import SaveIcon from "@mui/icons-material/Save";
import { useTable } from "react-table";
import { v4 as uuidv4 } from "uuid";
import { useMjopContext } from "./MjopContext";
import inspectionTasks from "./inspectionTasks.json"; // Importing inspectionTasks.json
import taken from "./taken.json";
import ImageAnnotation from "./ImageAnnotation";

const GlobalElements = () => {
  const {
    state: { globalElements, globalSpaces, newElement },
    handleAddElement,
    handleEditElement,
    handleDeleteElement,
    resetNewElement,
    setNewElement,
    addGebrek,
    removeGebrek,
    saveData,
  } = useMjopContext();

  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [customGebrek, setCustomGebrek] = useState("");
  const [customGebrekSeverity, setCustomGebrekSeverity] = useState("gering");

  const theme = useTheme();

  const handleAddCustomGebrek = () => {
    if (customGebrek.trim() === "") return;
    addGebrek(customGebrekSeverity, customGebrek.trim());
    setCustomGebrek("");
    setCustomGebrekSeverity("gering");
  };

  const renderGebreken = () => {
    return (
      <Box>
        {["ernstig", "serieus", "gering"].map((severity) => (
          <Box key={severity} mb={2}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                textTransform: "capitalize",
                color:
                  severity === "ernstig"
                    ? theme.palette.error.main
                    : severity === "serieus"
                    ? theme.palette.warning.main
                    : theme.palette.success.main,
              }}
            >
              Ernst: {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </Typography>
            <List>
              {(newElement.gebreken[severity] || []).map((gebrek, index) => (
                <ListItem key={index}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newElement.gebreken[severity].includes(
                          gebrek
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addGebrek(severity, gebrek);
                          } else {
                            removeGebrek(severity, gebrek);
                          }
                        }}
                      />
                    }
                    label={gebrek}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>
    );
  };

  const handleNext = () => {
    if (activeStep === 4) {
      saveData();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  return (
    <Box>
      <Stepper activeStep={activeStep}>
        {["Details", "Ruimte", "Bestanden", "Gebreken", "Opslaan"].map(
          (label, index) => (
            <Step key={index}>
              <StepLabel>{label}</StepLabel>
            </Step>
          )
        )}
      </Stepper>
      {activeStep === 3 && (
        <Box>
          {renderGebreken()}
          <Box mt={4}>
            <Typography variant="h6">Voeg Aangepaste Gebreken Toe</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  value={customGebrek}
                  onChange={(e) => setCustomGebrek(e.target.value)}
                  label="Aangepast gebrek"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <Select
                  value={customGebrekSeverity}
                  onChange={(e) => setCustomGebrekSeverity(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="ernstig">Ernstig</MenuItem>
                  <MenuItem value="serieus">Serieus</MenuItem>
                  <MenuItem value="gering">Gering</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleAddCustomGebrek}
                  disabled={!customGebrek}
                >
                  Voeg Toe
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}
      <Box mt={2} display="flex" justifyContent="space-between">
        <Button onClick={handleBack} disabled={activeStep === 0}>
          Terug
        </Button>
        <Button variant="contained" onClick={handleNext}>
          {activeStep === 4 ? "Opslaan" : "Volgende"}
        </Button>
      </Box>
    </Box>
  );
};

export default GlobalElements;
