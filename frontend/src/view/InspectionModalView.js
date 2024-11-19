import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Divider,
} from "@mui/material";

const InspectionModalView = ({
  currentElementId,
  currentInspection,
  handleCloseModal,
  globalElements,
}) => {
  const [inspectionData, setInspectionData] = useState({
    name: "",
    description: "",
    inspectionDate: "",
    images: [],
    documents: [],
    mistakes: [],
    overallConditionScore: 1,
  });

  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (currentInspection) {
      const element = globalElements.find((el) => el.id === currentElementId);
      setInspectionData({
        name: currentInspection.name || currentInspection.elementName || "",
        description:
          currentInspection.description ||
          currentInspection.elementDescription ||
          "",
        inspectionDate: currentInspection.inspectionDate || "",
        images: currentInspection.images || [],
        documents: currentInspection.documents || [],
        mistakes: currentInspection.mistakes || [],
        overallConditionScore: currentInspection.overallConditionScore || 1,
      });

      setTasks(element?.tasks || []);
    }
  }, [currentInspection, currentElementId, globalElements]);

  if (!currentInspection) {
    return null;
  }

  return (
    <Modal
      open={!!currentInspection}
      onClose={handleCloseModal}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.75)", // Darker background for better focus on modal
        padding: "20px",
      }}
    >
      <Paper
        sx={{
          width: "80vw",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "32px",
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.3)",
          borderRadius: "12px",
          backgroundColor: "#fff", // Pure white for contrast
        }}
      >
        <Box mb={4}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              textAlign: "center",
              color: "#2C3E50", // Dark blue for strong contrast
              marginBottom: "8px",
              letterSpacing: "1.2px",
            }}
          >
            Inspectie Rapport
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 500,
              textAlign: "center",
              color: "#34495E", // Slightly lighter shade for subtitle
              marginBottom: "24px",
            }}
          >
            {inspectionData.name}
          </Typography>
          <Divider sx={{ borderColor: "#BDC3C7" }} />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "#2C3E50", marginBottom: "12px" }}
            >
              Inspectie Details
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" sx={{ color: "#7F8C8D", marginBottom: "8px" }}>
              <strong>Naam:</strong> {inspectionData.name}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" sx={{ color: "#7F8C8D", marginBottom: "8px" }}>
              <strong>Inspectie Datum:</strong> {new Date(inspectionData.inspectionDate).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1" sx={{ color: "#7F8C8D", marginBottom: "8px" }}>
              <strong>Beschrijving:</strong> {inspectionData.description}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" sx={{ color: "#7F8C8D", marginBottom: "8px" }}>
              <strong>Conditie Score:</strong> {inspectionData.overallConditionScore}
            </Typography>
          </Grid>
          {currentInspection.remarks && (
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ color: "#7F8C8D", marginBottom: "8px" }}>
                <strong>Opmerkingen:</strong> {currentInspection.remarks}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 4, borderColor: "#BDC3C7" }} />

        {inspectionData.images.length > 0 && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#2C3E50", marginBottom: "12px" }}>
              Foto's
            </Typography>
            <Grid container spacing={3}>
              {inspectionData.images.map((src, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <img
                    src={`http://34.34.100.96:5000/${src}`}
                    alt={`Inspectie foto ${index}`}
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 4, borderColor: "#BDC3C7" }} />
          </>
        )}

        {inspectionData.documents.length > 0 && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#2C3E50", marginBottom: "12px" }}>
              Documenten
            </Typography>
            <Grid container spacing={2}>
              {inspectionData.documents.map((src, index) => (
                <Grid item xs={12} key={index}>
                  <Typography variant="body1" sx={{ color: "#7F8C8D" }}>
                    {src}
                  </Typography>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 4, borderColor: "#BDC3C7" }} />
          </>
        )}

        {inspectionData.mistakes.length > 0 && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#2C3E50", marginBottom: "12px" }}>
              Gebreken
            </Typography>
            <Grid container spacing={3}>
              {inspectionData.mistakes.map((mistake, index) => (
                <Grid item xs={12} key={index}>
                  <Box
                    sx={{
                      padding: "16px",
                      borderRadius: "8px",
                      backgroundColor: "#FDFEFE",
                      border: "1px solid #ECF0F1",
                      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.05)",
                      marginBottom: "16px",
                    }}
                  >
                    <Typography variant="body1" sx={{ color: "#34495E", marginBottom: "8px" }}>
                      <strong>Categorie:</strong> {mistake.category}
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#34495E", marginBottom: "8px" }}>
                      <strong>Ernst:</strong> {mistake.severity}
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#34495E", marginBottom: "8px" }}>
                      <strong>Omvang:</strong> {mistake.omvang}
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#34495E", marginBottom: "8px" }}>
                      <strong>Beschrijving:</strong> {mistake.description}
                    </Typography>
                    {mistake.images.length > 0 && (
                      <Grid container spacing={2} sx={{ marginTop: 2 }}>
                        {mistake.images.map((image, imageIndex) => (
                          <Grid item xs={6} sm={4} md={3} key={imageIndex}>
                            <img
                              src={`http://34.34.100.96:5000/${image}`}
                              alt={`Gebrek foto ${imageIndex}`}
                              style={{
                                width: "100%",
                                borderRadius: "8px",
                                border: "1px solid #ddd",
                                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 4, borderColor: "#BDC3C7" }} />
          </>
        )}

        {tasks.length > 0 && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#2C3E50", marginBottom: "12px" }}>
              Taken
            </Typography>
            <Grid container spacing={3}>
              {tasks.map((task, index) => (
                <Grid item xs={12} key={index}>
                  <Box
                    sx={{
                      padding: "16px",
                      borderRadius: "8px",
                      backgroundColor: "#FDFEFE",
                      border: "1px solid #ECF0F1",
                      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.05)",
                      marginBottom: "16px",
                    }}
                  >
                    <Typography variant="body1" sx={{ color: "#34495E", marginBottom: "8px" }}>
                      <strong>Naam:</strong> {task.name}
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#34495E", marginBottom: "8px" }}>
                      <strong>Beschrijving:</strong> {task.description}
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#34495E", marginBottom: "8px" }}>
                      <strong>Geschatte Prijs:</strong> {task.estimatedPrice}
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#34495E", marginBottom: "8px" }}>
                      <strong>Uiterste Datum:</strong> {task.ultimateDate}
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#34495E", marginBottom: "8px" }}>
                      <strong>Urgentie:</strong> {task.urgency}
                    </Typography>
                    {task.images.length > 0 && (
                      <Grid container spacing={2} sx={{ marginTop: 2 }}>
                        {task.images.map((image, imageIndex) => (
                          <Grid item xs={6} sm={4} md={3} key={imageIndex}>
                            <img
                              src={`http://34.34.100.96:5000/${image}`}
                              alt={`Taak foto ${imageIndex}`}
                              style={{
                                width: "100%",
                                borderRadius: "8px",
                                border: "1px solid #ddd",
                                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 4, borderColor: "#BDC3C7" }} />
          </>
        )}

        <Box mt={4} display="flex" justifyContent="center">
          <Button
            onClick={handleCloseModal}
            variant="contained"
            sx={{
              padding: "12px 36px",
              backgroundColor: "#2980B9",
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "1px",
              borderRadius: "8px",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
              "&:hover": {
                backgroundColor: "#3498DB",
              },
            }}
          >
            Sluiten
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
};

export default InspectionModalView;
