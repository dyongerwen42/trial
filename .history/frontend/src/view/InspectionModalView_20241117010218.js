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

      // Define severity mapping
      const severityMapping = {
        "Gering gebrek": "minor",
        "Serieus gebrek": "significant",
        "Ernstig gebrek": "serious",
      };

      // Define condition matrices as per Table 5 in NEN 2767
      const conditionMatrices = {
        minor: [
          [1, 1, 1, 1, 2], // Intensity 1
          [1, 1, 1, 2, 3], // Intensity 2
          [1, 1, 2, 3, 4], // Intensity 3
        ],
        significant: [
          [1, 1, 1, 2, 3],
          [1, 1, 2, 3, 4],
          [1, 2, 3, 4, 5],
        ],
        serious: [
          [1, 1, 2, 3, 4],
          [1, 2, 3, 4, 5],
          [2, 3, 4, 5, 6],
        ],
      };

      // Function to get extent score from percentage
      const getExtentScore = (percentage) => {
        const value = parseFloat(percentage);
        if (value < 2) return 1;
        if (value >= 2 && value < 10) return 2;
        if (value >= 10 && value < 30) return 3;
        if (value >= 30 && value < 70) return 4;
        return 5; // For 70% and above
      };

      // Function to get condition score from matrix
      const getConditionScore = (severity, intensityScore, extentScore) => {
        const severityKey = severityMapping[severity];
        const matrix = conditionMatrices[severityKey];
        if (!matrix) {
          throw new Error(`Invalid severity: ${severity}`);
        }
        const intensityIndex = intensityScore - 1;
        const extentIndex = extentScore - 1;
        const conditionScore = matrix[intensityIndex][extentIndex];
        return conditionScore;
      };

      // Function to aggregate condition scores as per Annex B (Section 5.5)
      const aggregateConditionScores = (sections) => {
        const correctionFactors = {
          1: 0.0,
          2: 0.1,
          3: 0.2,
          4: 0.3,
          5: 0.4,
          6: 0.5,
        };
        let totalAdjustedValue = 0;
        let totalReplacementValue = 0;

        sections.forEach((section) => {
          const { conditionScore, replacementValue } = section;
          const correctionFactor = correctionFactors[conditionScore];
          const adjustedValue = replacementValue * correctionFactor;
          totalAdjustedValue += adjustedValue;
          totalReplacementValue += replacementValue;
        });

        const overallConditionIndex = totalAdjustedValue / totalReplacementValue;
        // Map the index back to a condition score
        const overallConditionScore = Math.round(overallConditionIndex * 10) + 1;
        return overallConditionScore > 6 ? 6 : overallConditionScore;
      };

      // Initialize condition score calculation
      let overallConditionScore = 1; // Default condition score if no defects

      if (currentInspection.mistakes && currentInspection.mistakes.length > 0) {
        const mistakes = currentInspection.mistakes;
        let sections = [];

        // Group defects by severity and intensity for Situation 2
        const situation2Groups = {};
        const situation3Defects = [];

        mistakes.forEach((mistake) => {
          const { severity, intensity, omvang, replacementValue } = mistake;
          const severityKey = severityMapping[severity];
          const intensityScore = parseInt(intensity, 10);
          const extentPercentage = parseFloat(omvang) || 0;

          // Key for grouping (Situation 2)
          const key = `${severityKey}-${intensityScore}`;

          if (!situation2Groups[key]) {
            situation2Groups[key] = [];
          }

          situation2Groups[key].push({
            extentPercentage,
            replacementValue: parseFloat(replacementValue) || 1, // Default to 1 if not provided
            severity,
            intensityScore,
          });
        });

        // Process Situation 2 groups
        Object.keys(situation2Groups).forEach((key) => {
          const defects = situation2Groups[key];
          if (defects.length > 1) {
            // Situation 2 applies
            const { severity, intensityScore } = defects[0];
            // Sum extents
            let totalExtentPercentage = defects.reduce(
              (sum, defect) => sum + defect.extentPercentage,
              0
            );
            if (totalExtentPercentage > 100) {
              totalExtentPercentage = 100; // Cap at 100%
            }
            const extentScore = getExtentScore(totalExtentPercentage);
            const conditionScore = getConditionScore(
              severity,
              intensityScore,
              extentScore
            );
            const totalReplacementValue = defects.reduce(
              (sum, defect) => sum + defect.replacementValue,
              0
            );
            sections.push({
              conditionScore,
              replacementValue: totalReplacementValue,
            });
          } else {
            // Only one defect in this group, may fall under Situation 3
            situation3Defects.push(defects[0]);
          }
        });

        // Process Situation 3 defects
        situation3Defects.forEach((defect) => {
          const { severity, intensityScore, replacementValue } = defect;
          const extentScore = 5; // Assign extent score of 5 (100%)
          const conditionScore = getConditionScore(
            severity,
            intensityScore,
            extentScore
          );
          sections.push({
            conditionScore,
            replacementValue,
          });
        });

        // Determine if there is a remaining part without defects (Situation 3)
        const totalReplacementValueWithDefects = sections.reduce(
          (sum, section) => sum + section.replacementValue,
          0
        );
        const elementReplacementValue = parseFloat(element.replacementValue) || 1; // Total replacement value of the element

        if (elementReplacementValue > totalReplacementValueWithDefects) {
          const remainingReplacementValue =
            elementReplacementValue - totalReplacementValueWithDefects;
          sections.push({
            conditionScore: 1, // No defects
            replacementValue: remainingReplacementValue,
          });
        }

        // Aggregate condition scores
        overallConditionScore = aggregateConditionScores(sections);
      }

      // Update inspection data with calculated condition score
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
        overallConditionScore,
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
        {/* Header Section */}
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

        {/* Inspection Details */}
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
            <Typography
              variant="body1"
              sx={{ color: "#7F8C8D", marginBottom: "8px" }}
            >
              <strong>Naam:</strong> {inspectionData.name}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography
              variant="body1"
              sx={{ color: "#7F8C8D", marginBottom: "8px" }}
            >
              <strong>Inspectie Datum:</strong>{" "}
              {new Date(inspectionData.inspectionDate).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography
              variant="body1"
              sx={{ color: "#7F8C8D", marginBottom: "8px" }}
            >
              <strong>Beschrijving:</strong> {inspectionData.description}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography
              variant="body1"
              sx={{ color: "#7F8C8D", marginBottom: "8px" }}
            >
              <strong>Conditie Score:</strong>{" "}
              {inspectionData.overallConditionScore}
            </Typography>
          </Grid>
          {currentInspection.remarks && (
            <Grid item xs={12}>
              <Typography
                variant="body1"
                sx={{ color: "#7F8C8D", marginBottom: "8px" }}
              >
                <strong>Opmerkingen:</strong> {currentInspection.remarks}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 4, borderColor: "#BDC3C7" }} />

        {/* Images Section */}
        {inspectionData.images.length > 0 && (
          <>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#2C3E50",
                marginBottom: "12px",
              }}
            >
              Foto's
            </Typography>
            <Grid container spacing={3}>
              {inspectionData.images.map((src, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <img
                    src={`http://localhost:5000/${src}`}
                    alt={`Inspectie foto ${index + 1}`}
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

        {/* Documents Section */}
        {inspectionData.documents.length > 0 && (
          <>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#2C3E50",
                marginBottom: "12px",
              }}
            >
              Documenten
            </Typography>
            <Grid container spacing={2}>
              {inspectionData.documents.map((doc, index) => (
                <Grid item xs={12} key={index}>
                  <Typography variant="body1" sx={{ color: "#7F8C8D" }}>
                    {doc}
                  </Typography>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 4, borderColor: "#BDC3C7" }} />
          </>
        )}

        {/* Mistakes (Gebreken) Section */}
        {inspectionData.mistakes.length > 0 && (
          <>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#2C3E50",
                marginBottom: "12px",
              }}
            >
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
                    <Typography
                      variant="body1"
                      sx={{ color: "#34495E", marginBottom: "8px" }}
                    >
                      <strong>Categorie:</strong> {mistake.category}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#34495E", marginBottom: "8px" }}
                    >
                      <strong>Ernst:</strong> {mistake.severity}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#34495E", marginBottom: "8px" }}
                    >
                      <strong>Omvang:</strong> {mistake.omvang}%
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#34495E", marginBottom: "8px" }}
                    >
                      <strong>Beschrijving:</strong> {mistake.description}
                    </Typography>
                    {mistake.images.length > 0 && (
                      <Grid container spacing={2} sx={{ marginTop: 2 }}>
                        {mistake.images.map((image, imageIndex) => (
                          <Grid item xs={6} sm={4} md={3} key={imageIndex}>
                            <img
                              src={`http://localhost:5000/${image}`}
                              alt={`Gebrek foto ${imageIndex + 1}`}
                              style={{
                                width: "100%",
                                borderRadius: "8px",
                                border: "1px solid #ddd",
                                boxShadow:
                                  "0px 4px 8px rgba(0, 0, 0, 0.1)",
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

        {/* Tasks (Taken) Section */}
        {tasks.length > 0 && (
          <>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#2C3E50",
                marginBottom: "12px",
              }}
            >
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
                    <Typography
                      variant="body1"
                      sx={{ color: "#34495E", marginBottom: "8px" }}
                    >
                      <strong>Naam:</strong> {task.name}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#34495E", marginBottom: "8px" }}
                    >
                      <strong>Beschrijving:</strong> {task.description}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#34495E", marginBottom: "8px" }}
                    >
                      <strong>Geschatte Prijs:</strong> {task.estimatedPrice}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#34495E", marginBottom: "8px" }}
                    >
                      <strong>Uiterste Datum:</strong> {task.ultimateDate}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#34495E", marginBottom: "8px" }}
                    >
                      <strong>Urgentie:</strong> {task.urgency}
                    </Typography>
                    {task.images.length > 0 && (
                      <Grid container spacing={2} sx={{ marginTop: 2 }}>
                        {task.images.map((image, imageIndex) => (
                          <Grid item xs={6} sm={4} md={3} key={imageIndex}>
                            <img
                              src={`http://localhost:5000/${image}`}
                              alt={`Taak foto ${imageIndex + 1}`}
                              style={{
                                width: "100%",
                                borderRadius: "8px",
                                border: "1px solid #ddd",
                                boxShadow:
                                  "0px 4px 8px rgba(0, 0, 0, 0.1)",
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

        {/* Close Button */}
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
