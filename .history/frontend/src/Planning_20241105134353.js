import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Modal,
  TextField,
  Table,
  TableBody,
  TableContainer,
  Paper,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Collapse,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ErrorOutline as ErrorOutlineIcon,
  Download as DownloadIcon,
  RequestPage as RequestPageIcon,
} from "@mui/icons-material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import ImageAnnotation from "./ImageAnnotation";
import { generatePdf } from "./utils"; // Ensure this import is correct based on your file structure
import { useMjopContext } from './MjopContext';

// Utility function to determine urgency color based on level
const getUrgencyColor = (urgency) => {
  console.log(urgency)

  switch (urgency) {
    case "1":
    case 1:
      return "#4caf50";
    case "2":
    case 2:
      return "#8bc34a";
    case "3":
    case 3:
      return "#ffc107";
    case "4":
    case 4:
      return "#ff9800";
    case "5":
    case 5:
      return "#ff5722";
    case "6":
    case 6:
      return "#f44336";
    default:
      return "#9e9e9e";
  }
};

// Utility function to group tasks by offerGroupId
const getGroupedTasks = (
  allTasks,
  remainingCashList,
  showDoneTasks,
  offerGroups
) => {
  const filteredTasks = allTasks.filter(
    (task) => showDoneTasks || !task.isDone
  );

  const groupedTasks = filteredTasks.reduce((acc, task, index) => {
    const groupId = task.offerGroupId;
    if (groupId) {
      if (!acc[groupId]) {
        acc[groupId] = { tasks: [], remainingCash: [], groupData: {} };
        const groupData = offerGroups.find((g) => g.offerGroupId === groupId);
        if (groupData) {
          acc[groupId].groupData = groupData;
          acc[groupId].groupName = groupData.name;
        }
      }
      acc[groupId].tasks.push(task);
      acc[groupId].remainingCash.push(remainingCashList[index]);
    }
    return acc;
  }, {});

  const filteredGroups = Object.entries(groupedTasks)
    .filter(
      ([_, group]) => showDoneTasks || group.tasks.some((task) => !task.isDone)
    )
    .reduce((acc, [groupId, group]) => {
      acc[groupId] = group;
      return acc;
    }, {});

  return filteredGroups;
};

// Utility function to get ungrouped tasks
const getUngroupedTasks = (allTasks, showDoneTasks) => {
  return (
    showDoneTasks ? allTasks : allTasks.filter((task) => !task.isDone)
  ).filter((task) => !task.offerGroupId);
};

// Utility function to calculate remaining cash after tasks

const TaskRow = ({
  task,
  toggleItem,
  openItems,
  handleSelectTask,
  selectedTasks,
  handleOpenImageAnnotationModal,
  handleTaskDelete,
  handleFileChange,
  handleFileDelete,
  offerGroups = [],
  setGlobalElements,
  cashInfo = {},
  relatedSpace = {},
  relatedElement = {},
}) => {
  if (!task) {
    return null;
  }

  const isGrouped = !!task.offerGroupId;

  const currentCash = cashInfo.currentCash || 0;
  const monthlyContribution = cashInfo.monthlyContribution || 0;
  const reserveDate = cashInfo.reserveDate || new Date();

  const remainingCashList = calculateRemainingCash(
    parseFloat(currentCash),
    parseFloat(monthlyContribution),
    [task],
    new Date(),
    reserveDate,
    offerGroups
  );

  const remainingCash = remainingCashList.length > 0 ? remainingCashList[0] : 0;

  const handleTaskFieldChange = (taskId, elementId, value, field) => {
    setGlobalElements((prevElements) =>
      prevElements.map((element) =>
        element.id === elementId
          ? {
              ...element,
              tasks: element.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      planned: {
                        ...t.planned,
                        [field]: value,
                      },
                    }
                  : t
              ),
            }
          : element
      )
    );
  };

  const handleGroupSelectionChange = (taskId, elementId, groupId) => {
    handleTaskFieldChange(taskId, elementId, groupId, "offerGroupId");
  };

  const handleGenerateOfferPdf = () => {
    const taskDetails = {
      name: task.name || "Unnamed Task",
      description: task.description || "No description available",
    };

    const images = [
      {
        title: task.name || "Task Image",
        data: task.imageUrl || "",
        annotations: task.annotations || [],
      },
    ];

    generatePdf(taskDetails, images, `Offer_Request_${task.id}`);
  };

  const renderImagesAndDocuments = (photos = [], documents = []) => (
    <>
      {photos.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "bold",
              color: "#424242",
              textTransform: "uppercase",
              mb: 1,
            }}
          >
            Images
          </Typography>
          <Box display="flex" flexDirection="row" flexWrap="wrap" gap={2} mb={2}>
            {photos.map((photo, index) => (
              <Box
                key={index}
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                  transition: "transform 0.2s",
                  width: "100px",
                  height: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f0f0f0",
                  marginBottom: 2, 
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                <img
                  src={`http://localhost:5000/${photo}`}
                  alt={`Task Image ${index + 1}`}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover" }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}
      {documents.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "bold",
              color: "#424242",
              textTransform: "uppercase",
              mb: 1,
            }}
          >
            Documents
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            {documents.map((document, index) => (
              <Box
                key={index}
                sx={{
                  backgroundColor: "#f5f5f5",
                  padding: "8px",
                  borderRadius: 2,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                  "&:hover": {
                    backgroundColor: "#e0e0e0",
                  },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <a
                  href={`http://localhost:5000/${document}`}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: "none",
                    color: "#1976d2",
                    fontWeight: "bold",
                    flex: 1,
                  }}
                >
                  {document.split("/").pop()}
                </a>
                <IconButton
                  size="small"
                  sx={{ color: "#1976d2" }}
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `http://localhost:5000/${document}`;
                    link.download = document.split("/").pop();
                    link.click();
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </>
  );

  return (
    <>
      <TableRow
        hover
        sx={{
          "&:hover": { backgroundColor: "#f5f5f5" },
          borderLeft: task.isSubtask ? "4px solid #1976d2" : "none",
          backgroundColor: task.isSubtask ? "#e3f2fd" : "#ffffff",
        }}
      >
        <TableCell
          sx={{
            padding: "8px",
            verticalAlign: "middle",
            width: "5%",
          }}
        >
          <Box display="flex" alignItems="center" sx={{ width: "100%" }}>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => toggleItem(`task-${task.id}`)}
            >
              {openItems[`task-${task.id}`] ? (
                <ExpandLessIcon />
              ) : (
                <ExpandMoreIcon />
              )}
            </IconButton>
            <Checkbox
              checked={selectedTasks.includes(task.id)}
              onChange={() => handleSelectTask(task.id)}
            />
          </Box>
        </TableCell>
        <TableCell
          sx={{
            padding: "8px",
            verticalAlign: "middle",
            alignItems: "center",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          <Tooltip
            title={`${task.spaceName || "Unknown Space"} > ${
              task.elementName || "Unknown Element"
            } > ${task.name || "Unnamed Task"}`}
            arrow
          >
            <Typography
              variant="body2"
              sx={{
                color: "#1a237e",
                cursor: "pointer",
                fontWeight: "bold",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
              onClick={() =>
                handleOpenImageAnnotationModal({
                  elementId: task.elementId,
                  taskId: task.id,
                })
              }
            >
              {task.name || "Unnamed Task"}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell
          sx={{
            padding: "8px",
            verticalAlign: "middle",
            width: "15%",
          }}
        >
          <DatePicker
            selected={
              task.planned?.workDate ? new Date(task.planned.workDate) : null
            }
            onChange={(date) =>
              handleTaskFieldChange(task.id, task.elementId, date, "workDate")
            }
            dateFormat="dd/MM/yyyy"
            customInput={
              <TextField
                fullWidth
                variant="outlined"
                value={
                  task.planned?.workDate
                    ? new Date(task.planned.workDate).toLocaleDateString()
                    : "Niet ingesteld"
                }
                sx={{
                  backgroundColor: "#fff",
                  borderRadius: 2,
                }}
                InputLabelProps={{
                  style: { color: "#3f51b5" },
                }}
              />
            }
          />
        </TableCell>
        <TableCell
          sx={{
            padding: "8px",
            textAlign: "center",
            verticalAlign: "middle",
            width: "5%",
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: getUrgencyColor(task.urgency),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            {task.urgency}
          </Box>
        </TableCell>
        <TableCell
          sx={{
            padding: "8px",
            verticalAlign: "middle",
            width: "15%",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#757575",
              fontStyle: "italic",
            }}
          >
            Einddatum:{" "}
            {task.ultimateDate
              ? new Date(task.ultimateDate).toLocaleDateString()
              : "Niet ingesteld"}
          </Typography>
        </TableCell>
        <TableCell
          sx={{
            padding: "8px",
            textAlign: "center",
            verticalAlign: "middle",
            width: "5%",
          }}
        >
          {task.weeksRemaining <= 12 && !task.planned?.offerAccepted && (
            <Tooltip
              title="Taak loopt af binnen 12 weken en de offerte is niet geaccepteerd"
              arrow
            >
              <ErrorOutlineIcon color="error" sx={{ fontSize: 24 }} />
            </Tooltip>
          )}
        </TableCell>
        <TableCell
          sx={{
            padding: "8px",
            verticalAlign: "middle",
            width: "20%",
          }}
        >
          <Typography
            variant="body2"
            color="primary"
            sx={{ fontWeight: "bold" }}
          >
            Resterend: €
            {remainingCash !== undefined && !isNaN(remainingCash)
              ? remainingCash.toFixed(2)
              : "0.00"}
          </Typography>
        </TableCell>
        <TableCell
          sx={{
            padding: "8px",
            verticalAlign: "middle",
            width: "10%",
          }}
        >
          <Box display="flex" alignItems="center">
            <IconButton
              onClick={() => handleGenerateOfferPdf()} // Trigger PDF generation
              sx={{
                color: "#1976d2",
                "&:hover": {
                  backgroundColor: "#e3f2fd",
                },
              }}
            >
              <RequestPageIcon />
            </IconButton>
            <IconButton
              onClick={() => handleTaskDelete(task.id, task.elementId)}
              sx={{
                color: "#d32f2f",
                "&:hover": {
                  backgroundColor: "#ffebee",
                },
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse
            in={openItems[`task-${task.id}`]}
            timeout="auto"
            unmountOnExit
          >
            <Box
              sx={{
                margin: 2,
                padding: 3,
                backgroundColor: "#fafafa",
                borderRadius: 2,
                boxShadow: "inset 0 2px 5px rgba(0,0,0,0.1)",
                borderLeft: task.isSubtask ? "4px solid #1976d2" : "none",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  mb: 3,
                  fontWeight: "bold",
                  color: "primary.main",
                }}
              >
                {task.description || "Geen beschrijving beschikbaar"}
              </Typography>

              {/* Input fields and group selection */}
              {task.isSubtask ? (
                <>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id={`group-select-label-${task.id}`}>
                      Selecteer groep
                    </InputLabel>
                    <Select
                      labelId={`group-select-label-${task.id}`}
                      value={task.offerGroupId || ""}
                      onChange={(e) =>
                        handleGroupSelectionChange(
                          task.id,
                          task.elementId,
                          e.target.value
                        )
                      }
                      label="Selecteer groep"
                      sx={{ backgroundColor: "#fff", borderRadius: 2 }}
                    >
                      <MenuItem value="">
                        <em>Geen groep</em>
                      </MenuItem>
                      {offerGroups.map((group) => (
                        <MenuItem
                          key={group.offerGroupId}
                          value={group.offerGroupId}
                        >
                          {group.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    type="number"
                    label="Geschatte prijs"
                    value={task.estimatedPrice || ""}
                    onChange={(e) =>
                      handleTaskFieldChange(
                        task.id,
                        task.elementId,
                        parseFloat(e.target.value),
                        "estimatedPrice"
                      )
                    }
                    variant="outlined"
                    sx={{
                      marginBottom: 3,
                      backgroundColor: "#fff",
                      borderRadius: 2,
                    }}
                    InputLabelProps={{ style: { color: "#3f51b5" } }}
                  />
                  <Divider sx={{ mb: 3 }} />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={task.isDone || false}
                        onChange={(e) =>
                          handleTaskFieldChange(
                            task.id,
                            task.elementId,
                            e.target.checked,
                            "isDone"
                          )
                        }
                        sx={{ color: "#1976d2" }}
                      />
                    }
                    label="Taak voltooid"
                    sx={{
                      mb: 2,
                      "& .MuiFormControlLabel-label": { fontSize: 14 },
                    }}
                  />
                </>
              ) : (
                <>
                  <TextField
                    fullWidth
                    type="number"
                    label="Geschatte prijs"
                    value={task.estimatedPrice || ""}
                    onChange={(e) =>
                      handleTaskFieldChange(
                        task.id,
                        task.elementId,
                        parseFloat(e.target.value),
                        "estimatedPrice"
                      )
                    }
                    variant="outlined"
                    sx={{
                      marginBottom: 3,
                      backgroundColor: "#fff",
                      borderRadius: 2,
                    }}
                    InputLabelProps={{ style: { color: "#3f51b5" } }}
                  />

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id={`group-select-label-${task.id}`}>
                      Selecteer groep
                    </InputLabel>
                    <Select
                      labelId={`group-select-label-${task.id}`}
                      value={task.offerGroupId || ""}
                      onChange={(e) =>
                        handleGroupSelectionChange(
                          task.id,
                          task.elementId,
                          e.target.value
                        )
                      }
                      label="Selecteer groep"
                      sx={{ backgroundColor: "#fff", borderRadius: 2 }}
                    >
                      <MenuItem value="">
                        <em>Geen groep</em>
                      </MenuItem>
                      {offerGroups.map((group) => (
                        <MenuItem
                          key={group.offerGroupId}
                          value={group.offerGroupId}
                        >
                          {group.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {!isGrouped && (
                    <>
                      <TextField
                        fullWidth
                        type="number"
                        label="Offerteprijs"
                        value={task.planned?.offerPrice || ""}
                        onChange={(e) =>
                          handleTaskFieldChange(
                            task.id,
                            task.elementId,
                            e.target.value,
                            "offerPrice"
                          )
                        }
                        variant="outlined"
                        sx={{
                          mb: 3,
                          backgroundColor: "#fff",
                          borderRadius: 2,
                        }}
                        InputLabelProps={{ style: { color: "#3f51b5" } }}
                      />
                      <TextField
                        fullWidth
                        type="number"
                        label="Factuurprijs"
                        value={task.planned?.invoicePrice || ""}
                        onChange={(e) =>
                          handleTaskFieldChange(
                            task.id,
                            task.elementId,
                            e.target.value,
                            "invoicePrice"
                          )
                        }
                        variant="outlined"
                        sx={{
                          mb: 3,
                          backgroundColor: "#fff",
                          borderRadius: 2,
                        }}
                        InputLabelProps={{ style: { color: "#3f51b5" } }}
                      />

                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 1,
                            fontWeight: "bold",
                            color: "#424242",
                          }}
                        >
                          Upload offerte
                        </Typography>
                        <input
                          type="file"
                          multiple
                          onChange={(e) =>
                            handleFileChange(
                              task.id,
                              task.elementId,
                              e.target.files,
                              "taskOffer"
                            )
                          }
                          style={{ marginBottom: "12px", display: "block" }}
                        />
                        {task.planned?.offerFiles &&
                          task.planned.offerFiles.map((file, fileIndex) => (
                            <Box
                              display="flex"
                              alignItems="center"
                              sx={{
                                mb: 1,
                                backgroundColor: "#e3f2fd",
                                borderRadius: 2,
                                p: 1,
                              }}
                              key={fileIndex}
                            >
                              <a
                                href={`http://localhost:5000/${file}`}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  marginRight: "8px",
                                  textDecoration: "none",
                                  flex: 1,
                                }}
                              >
                                <Typography variant="body2">
                                  {file.split("/").pop()}
                                </Typography>
                              </a>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = `http://localhost:5000/${file}`;
                                  link.download = file;
                                  link.click();
                                }}
                              >
                                <DownloadIcon sx={{ color: "#3f51b5" }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleFileDelete(
                                    task.id,
                                    task.elementId,
                                    file,
                                    "taskOffer"
                                  )
                                }
                              >
                                <DeleteIcon sx={{ color: "#d32f2f" }} />
                              </IconButton>
                            </Box>
                          ))}
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 1,
                            fontWeight: "bold",
                            color: "#424242",
                          }}
                        >
                          Upload factuur
                        </Typography>
                        <input
                          type="file"
                          multiple
                          onChange={(e) =>
                            handleFileChange(
                              task.id,
                              task.elementId,
                              e.target.files,
                              "taskInvoice"
                            )
                          }
                          style={{ marginBottom: "12px", display: "block" }}
                        />
                        {task.planned?.invoiceFiles &&
                          task.planned.invoiceFiles.map((file, fileIndex) => (
                            <Box
                              display="flex"
                              alignItems="center"
                              sx={{
                                mb: 1,
                                backgroundColor: "#fce4ec",
                                borderRadius: 2,
                                p: 1,
                              }}
                              key={fileIndex}
                            >
                              <a
                                href={`http://localhost:5000/${file}`}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  marginRight: "8px",
                                  textDecoration: "none",
                                  flex: 1,
                                }}
                              >
                                <Typography variant="body2">
                                  {file.split("/").pop()}
                                </Typography>
                              </a>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = `http://localhost:5000/${file}`;
                                  link.download = file;
                                  link.click();
                                }}
                              >
                                <DownloadIcon sx={{ color: "#3f51b5" }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleFileDelete(
                                    task.id,
                                    task.elementId,
                                    file,
                                    "taskInvoice"
                                  )
                                }
                              >
                                <DeleteIcon sx={{ color: "#d32f2f" }} />
                              </IconButton>
                            </Box>
                          ))}
                      </Box>

                      {task.planned?.offerAccepted && (
                        <>
                          <Box sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                mb: 1,
                                fontWeight: "bold",
                                color: "#424242",
                              }}
                            >
                              Startdatum
                            </Typography>
                            <DatePicker
                              selected={
                                task.planned?.startDate
                                  ? new Date(task.planned.startDate)
                                  : null
                              }
                              onChange={(date) =>
                                handleTaskFieldChange(
                                  task.id,
                                  task.elementId,
                                  date,
                                  "startDate"
                                )
                              }
                              dateFormat="dd/MM/yyyy"
                              customInput={
                                <TextField
                                  variant="outlined"
                                  fullWidth
                                  value={
                                    task.planned?.startDate
                                      ? new Date(
                                          task.planned.startDate
                                        ).toLocaleDateString()
                                      : "Niet ingesteld"
                                  }
                                  sx={{
                                    backgroundColor: "#fff",
                                    borderRadius: 2,
                                  }}
                                  InputLabelProps={{
                                    style: { color: "#3f51b5" },
                                  }}
                                />
                              }
                            />
                          </Box>
                          <Box sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                mb: 1,
                                fontWeight: "bold",
                                color: "#424242",
                              }}
                            >
                              Einddatum
                            </Typography>
                            <DatePicker
                              selected={
                                task.planned?.endDate
                                  ? new Date(task.planned.endDate)
                                  : null
                              }
                              onChange={(date) =>
                                handleTaskFieldChange(
                                  task.id,
                                  task.elementId,
                                  date,
                                  "endDate"
                                )
                              }
                              dateFormat="dd/MM/yyyy"
                              customInput={
                                <TextField
                                  variant="outlined"
                                  fullWidth
                                  value={
                                    task.planned?.endDate
                                      ? new Date(
                                          task.planned.endDate
                                        ).toLocaleDateString()
                                      : "Niet ingesteld"
                                  }
                                  sx={{
                                    backgroundColor: "#fff",
                                    borderRadius: 2,
                                  }}
                                  InputLabelProps={{
                                    style: { color: "#3f51b5" },
                                  }}
                                />
                              }
                            />
                          </Box>
                        </>
                      )}

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={task.planned?.offerAccepted || false}
                            onChange={(e) =>
                              handleTaskFieldChange(
                                task.id,
                                task.elementId,
                                e.target.checked,
                                "offerAccepted"
                              )
                            }
                            sx={{ color: "#1976d2" }}
                          />
                        }
                        label="Offerte geaccepteerd"
                        sx={{
                          mb: 3,
                          "& .MuiFormControlLabel-label": { fontSize: 14 },
                        }}
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={task.isDone || false}
                            onChange={(e) =>
                              handleTaskFieldChange(
                                task.id,
                                task.elementId,
                                e.target.checked,
                                "isDone"
                              )
                            }
                            sx={{ color: "#1976d2" }}
                          />
                        }
                        label="Taak voltooid"
                        sx={{
                          mb: 2,
                          "& .MuiFormControlLabel-label": { fontSize: 14 },
                        }}
                      />
                    </>
                  )}
                </>
              )}

              {/* Render images and documents related to the task, element, and space */}
              {renderImagesAndDocuments(task.images, task.documents)}
              {renderImagesAndDocuments(
                relatedElement.photos,
                relatedElement.documents
              )}
              {renderImagesAndDocuments(
                relatedSpace.photos,
                relatedSpace.documents
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};










// GroupRow component: Represents a group of tasks in the table
const GroupRow = ({
  groupId,
  group,
  toggleItem,
  openItems,
  handleSelectTask,
  selectedTasks,
  handleGroupWorkDateChange,
  handleTaskDelete,
  handleFileChange,
  handleFileDelete,
  setGlobalElements,
  offerGroups,
  handleOpenImageAnnotationModal,
  handleChange,
}) => {
  const [totalEstimatedPrice, setTotalEstimatedPrice] = useState(0);

  useEffect(() => {
    if (openItems[`group-${groupId}`]) {
      const calculatedTotal = group.tasks.reduce((total, task) => {
        const price = parseFloat(task?.estimatedPrice) || 0;
        return total + price;
      }, 0);
      setTotalEstimatedPrice(calculatedTotal);
    }
  }, [openItems, groupId, group.tasks]);

  return (
    <>
      <TableRow>
        <TableCell colSpan={8} sx={{ padding: 0 }}>
          <Box
            sx={{
              border: "4px solid #0f2644",
              borderRadius: 2,
              marginBottom: 2,
            }}
          >
            <TableRow
              hover
              sx={{
                backgroundColor: "#e0e0e0",
                "&:hover": { backgroundColor: "#d6d6d6" },
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
              }}
            >
              <TableCell
                sx={{ padding: "8px", verticalAlign: "middle", width: "5%" }}
              >
                <Box display="flex" alignItems="center" sx={{ width: "100%" }}>
                  <IconButton
                    aria-label="expand group"
                    size="small"
                    onClick={() => toggleItem(`group-${groupId}`)}
                  >
                    {openItems[`group-${groupId}`] ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </IconButton>
                  <Checkbox
                    checked={selectedTasks.includes(groupId)}
                    onChange={() => handleSelectTask(groupId)}
                    sx={{ visibility: "hidden" }}
                  />
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  padding: "8px",
                  verticalAlign: "center",
                  fontWeight: "bold",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {group.groupName}
              </TableCell>
              <TableCell
                sx={{
                  padding: "8px",
                  verticalAlign: "middle",
                  width: "15%",
                }}
              >
                <DatePicker
                  selected={
                    group.groupData.groupWorkDate
                      ? new Date(group.groupData.groupWorkDate)
                      : null
                  }
                  onChange={(date) => handleGroupWorkDateChange(groupId, date)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  customInput={
                    <TextField
                      variant="outlined"
                      fullWidth
                      value={
                        group.groupData.groupWorkDate
                          ? new Date(
                              group.groupData.groupWorkDate
                            ).toLocaleDateString()
                          : "Niet ingesteld"
                      }
                      sx={{
                        backgroundColor: "#fff",
                        borderRadius: 2,
                      }}
                      InputLabelProps={{
                        style: { color: "#3f51b5" },
                      }}
                    />
                  }
                />
              </TableCell>
              <TableCell
                sx={{
                  padding: "8px",
                  textAlign: "center",
                  verticalAlign: "middle",
                  width: "5%",
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: getUrgencyColor(group.groupData.urgency),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  {group.groupData.urgency}
                </Box>
              </TableCell>
              <TableCell
                sx={{ padding: "8px", verticalAlign: "middle", width: "15%" }}
              />
              <TableCell
                sx={{
                  padding: "8px",
                  textAlign: "center",
                  verticalAlign: "middle",
                  width: "5%",
                }}
              >
                {group.groupData.urgency >= 4 && (
                  <Tooltip
                    title="Er is een hoge urgentietaak in deze groep"
                    arrow
                  >
                    <ErrorOutlineIcon color="error" sx={{ fontSize: 24 }} />
                  </Tooltip>
                )}
              </TableCell>
              <TableCell
                sx={{
                  padding: "8px",
                  fontWeight: "bold",
                  verticalAlign: "middle",
                  width: "20%",
                }}
              >
                Resterend: €
                {(group.remainingCash.length > 0
                  ? group.remainingCash[0]
                  : 0
                ).toFixed(2)}
              </TableCell>
              <TableCell
                sx={{ padding: "8px", verticalAlign: "middle", width: "10%" }}
              >
                <Box display="flex" alignItems="center">
                  <IconButton
                    onClick={() => alert("Request Offer Clicked")}
                    sx={{
                      color: "#1976d2",
                      "&:hover": {
                        backgroundColor: "#e3f2fd",
                      },
                      marginRight: 1,
                    }}
                  >
                    <RequestPageIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleTaskDelete(groupId, null, null, true)}
                    sx={{
                      color: "#d32f2f",
                      "&:hover": {
                        backgroundColor: "#ffebee",
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                style={{ paddingBottom: 0, paddingTop: 0 }}
                colSpan={8}
              >
                <Collapse
                  in={openItems[`group-${groupId}`]}
                  timeout="auto"
                  unmountOnExit
                >
                  <Box
                    sx={{
                      margin: 2,
                      padding: 2,
                      backgroundColor: "#f0f0f0",
                      borderRadius: 2,
                      boxShadow: "inset 0 2px 5px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 2,
                        fontWeight: "bold",
                        color: "primary.main",
                      }}
                    >
                      Groep Details
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        mb: 2,
                        fontWeight: "bold",
                        color: "#424242",
                      }}
                    >
                      Totale geschatte prijs: €{totalEstimatedPrice.toFixed(2)}
                    </Typography>

                    {/* Group Details */}
                    <TextField
                      fullWidth
                      type="number"
                      label="Offerteprijs"
                      value={group.groupData.offerPrice || ""}
                      onChange={(e) =>
                        handleChange(
                          groupId,
                          null,
                          e.target.value,
                          "offerPrice",
                          true
                        )
                      }
                      variant="outlined"
                      sx={{
                        mb: 2,
                        backgroundColor: "#fff",
                        borderRadius: 2,
                      }}
                      InputLabelProps={{ style: { color: "#3f51b5" } }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="Factuurprijs"
                      value={group.groupData.invoicePrice || ""}
                      onChange={(e) =>
                        handleChange(
                          groupId,
                          null,
                          e.target.value,
                          "invoicePrice",
                          true
                        )
                      }
                      variant="outlined"
                      sx={{
                        mb: 2,
                        backgroundColor: "#fff",
                        borderRadius: 2,
                      }}
                      InputLabelProps={{ style: { color: "#3f51b5" } }}
                    />

                    {/* Group Files */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          color: "#424242",
                        }}
                      >
                        Upload offerte
                      </Typography>
                      <input
                        type="file"
                        multiple
                        onChange={(e) =>
                          handleFileChange(
                            groupId,
                            null,
                            e.target.files,
                            "offerFiles"
                          )
                        }
                        style={{ marginBottom: "12px", display: "block" }}
                      />
                      {group.groupData.offerFiles &&
                        group.groupData.offerFiles.map((file, fileIndex) => (
                          <Box
                            display="flex"
                            alignItems="center"
                            sx={{
                              mb: 1,
                              backgroundColor: "#e3f2fd",
                              borderRadius: 2,
                              p: 1,
                              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                            }}
                            key={fileIndex}
                          >
                            <a
                              href={`http://localhost:5000/${file}`}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                marginRight: "8px",
                                textDecoration: "none",
                                flex: 1,
                              }}
                            >
                              <Typography variant="body2">
                                {file.split("/").pop()}
                              </Typography>
                            </a>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = `http://localhost:5000/${file}`;
                                link.download = file;
                                link.click();
                              }}
                            >
                              <DownloadIcon sx={{ color: "#3f51b5" }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleFileDelete(
                                  groupId,
                                  null,
                                  file,
                                  "offerFiles"
                                )
                              }
                            >
                              <DeleteIcon sx={{ color: "#d32f2f" }} />
                            </IconButton>
                          </Box>
                        ))}
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          color: "#424242",
                        }}
                      >
                        Upload factuur
                      </Typography>
                      <input
                        type="file"
                        multiple
                        onChange={(e) =>
                          handleFileChange(
                            groupId,
                            null,
                            e.target.files,
                            "invoiceFiles"
                          )
                        }
                        style={{ marginBottom: "12px", display: "block" }}
                      />
                      {group.groupData.invoiceFiles &&
                        group.groupData.invoiceFiles.map((file, fileIndex) => (
                          <Box
                            display="flex"
                            alignItems="center"
                            sx={{
                              mb: 1,
                              backgroundColor: "#fce4ec",
                              borderRadius: 2,
                              p: 1,
                              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                            }}
                            key={fileIndex}
                          >
                            <a
                              href={`http://localhost:5000/${file}`}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                marginRight: "8px",
                                textDecoration: "none",
                                flex: 1,
                              }}
                            >
                              <Typography variant="body2">
                                {file.split("/").pop()}
                              </Typography>
                            </a>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = `http://localhost:5000/${file}`;
                                link.download = file;
                                link.click();
                              }}
                            >
                              <DownloadIcon sx={{ color: "#3f51b5" }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleFileDelete(
                                  groupId,
                                  null,
                                  file,
                                  "invoiceFiles"
                                )
                              }
                            >
                              <DeleteIcon sx={{ color: "#d32f2f" }} />
                            </IconButton>
                          </Box>
                        ))}
                    </Box>

                    {/* Start and End Date */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          color: "#424242",
                        }}
                      >
                        Startdatum
                      </Typography>
                      <DatePicker
                        selected={
                          group.groupData.startDate
                            ? new Date(group.groupData.startDate)
                            : null
                        }
                        onChange={(date) =>
                          handleChange(groupId, null, date, "startDate", true)
                        }
                        dateFormat="dd/MM/yyyy"
                        customInput={
                          <TextField
                            variant="outlined"
                            fullWidth
                            value={
                              group.groupData.startDate
                                ? new Date(
                                    group.groupData.startDate
                                  ).toLocaleDateString()
                                : "Niet ingesteld"
                            }
                            sx={{
                              backgroundColor: "#fff",
                              borderRadius: 2,
                            }}
                            InputLabelProps={{
                              style: { color: "#3f51b5" },
                            }}
                          />
                        }
                      />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          color: "#424242",
                        }}
                      >
                        Einddatum
                      </Typography>
                      <DatePicker
                        selected={
                          group.groupData.endDate
                            ? new Date(group.groupData.endDate)
                            : null
                        }
                        onChange={(date) =>
                          handleChange(groupId, null, date, "endDate", true)
                        }
                        dateFormat="dd/MM/yyyy"
                        customInput={
                          <TextField
                            variant="outlined"
                            fullWidth
                            value={
                              group.groupData.endDate
                                ? new Date(
                                    group.groupData.endDate
                                  ).toLocaleDateString()
                                : "Niet ingesteld"
                            }
                            sx={{
                              backgroundColor: "#fff",
                              borderRadius: 2,
                            }}
                            InputLabelProps={{
                              style: { color: "#3f51b5" },
                            }}
                          />
                        }
                      />
                    </Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={group.groupData.offerAccepted || false}
                          onChange={(e) =>
                            handleChange(
                              groupId,
                              null,
                              e.target.checked,
                              "offerAccepted",
                              true
                            )
                          }
                          sx={{ color: "#1976d2" }}
                        />
                      }
                      label="Offerte geaccepteerd"
                      sx={{
                        mb: 2,
                        "& .MuiFormControlLabel-label": { fontSize: 14 },
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={group.groupData.isDone || false}
                          onChange={(e) =>
                            handleChange(
                              groupId,
                              null,
                              e.target.checked,
                              "isDone",
                              true
                            )
                          }
                          sx={{ color: "#1976d2" }}
                        />
                      }
                      label="Voltooid"
                      sx={{
                        mb: 2,
                        "& .MuiFormControlLabel-label": { fontSize: 14 },
                      }}
                    />
                  </Box>

                  {/* Group's Tasks */}
                  <Divider sx={{ mb: 2 }} />
                  <Table>
                    <TableBody>
                      {group.tasks.map((task, index) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          toggleItem={toggleItem}
                          openItems={openItems}
                          handleSelectTask={handleSelectTask}
                          selectedTasks={selectedTasks}
                          handleOpenImageAnnotationModal={
                            handleOpenImageAnnotationModal
                          }
                          handleTaskDelete={handleTaskDelete}
                          offerGroups={offerGroups}
                          handleFileChange={handleFileChange}
                          handleFileDelete={handleFileDelete}
                          setGlobalElements={setGlobalElements}
                          cashInfo={{
                            currentCash: group.remainingCash[index] || 0,
                          }}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </Collapse>
              </TableCell>
            </TableRow>
          </Box>
        </TableCell>
      </TableRow>
    </>
  );
};

// GroupAndTaskGrid component: Represents the grid of groups and tasks
const GroupAndTaskGrid = ({
  allTasks = [],
  remainingCashList = [],
  showDoneTasks,
  handleChange,
  handleFileChange,
  handleFileDelete,
  handleTaskDelete,
  handleOpenImageAnnotationModal,
  handleSelectTask,
  selectedTasks,
  offerGroups = [],
  setGlobalElements,
  calculateRemainingCash,
  cashInfo = {},
  globalSpaces = [],
  globalElements = [],
}) => {
  const groupedTasks = getGroupedTasks(
    allTasks,
    remainingCashList,
    showDoneTasks,
    offerGroups
  );

  const ungroupedTasks = getUngroupedTasks(allTasks, showDoneTasks);

  const combinedTasks = [
    ...Object.entries(groupedTasks).map(([groupId, group]) => ({
      isGroup: true,
      groupId,
      group,
    })),
    ...ungroupedTasks.map((task, index) => ({
      isGroup: false,
      task,
      cash: remainingCashList[index],
    })),
  ];

  combinedTasks.sort((a, b) => {
    const dateA = a.isGroup
      ? new Date(a.group.groupData.groupWorkDate || Infinity)
      : new Date(a.task.planned?.workDate || Infinity);
    const dateB = b.isGroup
      ? new Date(b.group.groupData.groupWorkDate || Infinity)
      : new Date(b.task.planned?.workDate || Infinity);
    return dateA - dateB;
  });

  const plannedTasks = combinedTasks.filter((item) =>
    item.isGroup
      ? Boolean(item.group.groupData.groupWorkDate)
      : Boolean(item.task.planned?.workDate)
  );

  const unplannedTasks = combinedTasks.filter((item) =>
    item.isGroup
      ? !item.group.groupData.groupWorkDate
      : !item.task.planned?.workDate
  );

  const initialExpanded = unplannedTasks.length > 0 ? "unplanned" : "planned";
  const [expanded, setExpanded] = useState(initialExpanded);
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (id) => {
    setOpenItems((prevOpenItems) => ({
      ...prevOpenItems,
      [id]: !prevOpenItems[id],
    }));
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleGroupWorkDateChange = (groupId, date) => {
    handleChange(groupId, null, date, "groupWorkDate", true);
    const group = offerGroups.find((group) => group.offerGroupId === groupId);
    if (group && group.tasks) {
      group.tasks.forEach((task) => {
        handleChange(task.id, task.elementId, date, "workDate", false);
      });
    }
  };

  const handleGroupSelectionChange = (taskId, groupId) => {
    handleChange(taskId, null, groupId, "offerGroupId");
  };

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
      <Accordion
        expanded={expanded === "unplanned"}
        onChange={handleAccordionChange("unplanned")}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" component="div">
  Ongeplande Taken ({unplannedTasks.length})
</Typography>

        </AccordionSummary>
        <AccordionDetails>
          <Table aria-label="unplanned tasks">
            <TableBody>
              {unplannedTasks.map((item) => {
                const relatedSpace = globalSpaces.find(
                  (space) => space.id === item.task.spaceId
                );
                const relatedElement = globalElements.find(
                  (element) => element.id === item.task.elementId
                );
                return item.isGroup ? (
                  <GroupRow
                    key={`group-${item.groupId}`}
                    groupId={item.groupId}
                    group={item.group}
                    toggleItem={toggleItem}
                    openItems={openItems}
                    handleSelectTask={handleSelectTask}
                    selectedTasks={selectedTasks}
                    handleGroupWorkDateChange={handleGroupWorkDateChange}
                    handleTaskDelete={handleTaskDelete}
                    handleChange={handleChange}
                    handleOpenImageAnnotationModal={
                      handleOpenImageAnnotationModal
                    }
                    offerGroups={offerGroups}
                    handleFileChange={handleFileChange}
                    handleFileDelete={handleFileDelete}
                    setGlobalElements={setGlobalElements}
                    calculateRemainingCash={calculateRemainingCash}
                    cashInfo={cashInfo}
                  />
                ) : (
                  <TaskRow
                    key={item.task.id}
                    task={item.task}
                    toggleItem={toggleItem}
                    openItems={openItems}
                    handleSelectTask={handleSelectTask}
                    selectedTasks={selectedTasks}
                    handleOpenImageAnnotationModal={
                      handleOpenImageAnnotationModal
                    }
                    handleChange={handleChange}
                    handleTaskDelete={handleTaskDelete}
                    offerGroups={offerGroups}
                    handleGroupSelectionChange={handleGroupSelectionChange}
                    handleFileChange={handleFileChange}
                    handleFileDelete={handleFileDelete}
                    setGlobalElements={setGlobalElements}
                    cashInfo={{ currentCash: item.cash || 0 }}
                    relatedSpace={relatedSpace}
                    relatedElement={relatedElement}
                  />
                );
              })}
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === "planned"}
        onChange={handleAccordionChange("planned")}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" component="div" >
  Geplande Taken ({plannedTasks.length})
</Typography>

        </AccordionSummary>
        <AccordionDetails>
          <Table aria-label="planned tasks">
            <TableBody>
              {plannedTasks.map((item) => {
                const relatedSpace = globalSpaces.find(
                  (space) => space.id === item.task.spaceId
                );
                const relatedElement = globalElements.find(
                  (element) => element.id === item.task.elementId
                );
                return item.isGroup ? (
                  <GroupRow
                    key={`group-${item.groupId}`}
                    groupId={item.groupId}
                    group={item.group}
                    toggleItem={toggleItem}
                    openItems={openItems}
                    handleSelectTask={handleSelectTask}
                    selectedTasks={selectedTasks}
                    handleGroupWorkDateChange={handleGroupWorkDateChange}
                    handleTaskDelete={handleTaskDelete}
                    handleChange={handleChange}
                    handleOpenImageAnnotationModal={
                      handleOpenImageAnnotationModal
                    }
                    offerGroups={offerGroups}
                    handleFileChange={handleFileChange}
                    handleFileDelete={handleFileDelete}
                    setGlobalElements={setGlobalElements}
                    calculateRemainingCash={calculateRemainingCash}
                    cashInfo={cashInfo}
                  />
                ) : (
                  <TaskRow
                    key={item.task.id}
                    task={item.task}
                    toggleItem={toggleItem}
                    openItems={openItems}
                    handleSelectTask={handleSelectTask}
                    selectedTasks={selectedTasks}
                    handleOpenImageAnnotationModal={
                      handleOpenImageAnnotationModal
                    }
                    handleChange={handleChange}
                    handleTaskDelete={handleTaskDelete}
                    offerGroups={offerGroups}
                    handleGroupSelectionChange={handleGroupSelectionChange}
                    handleFileChange={handleFileChange}
                    handleFileDelete={handleFileDelete}
                    setGlobalElements={setGlobalElements}
                    cashInfo={{ currentCash: item.cash || 0 }}
                    relatedSpace={relatedSpace}
                    relatedElement={relatedElement}
                  />
                );
              })}
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>
    </TableContainer>
  );
};

const calculateRemainingCash = (
  initialCash,
  monthlyContribution,
  tasks = [],
  now = new Date(),
  budgetStartDate,
  offerGroups = []
) => {
  const logs = [];
  const logAction = (action, details) => {
    logs.push({ action, ...details });
  };

  const startDate = new Date(budgetStartDate);
  let monthsPassed =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth());

  if (now.getDate() < startDate.getDate()) {
    monthsPassed -= 1;
  }

  let remainingCash = initialCash + monthsPassed * monthlyContribution;
  logAction("Initial cash available", { remainingCash });

  const remainingCashList = [];

  // Groepeer de taken op basis van offerGroupId
  const groupedTasks = tasks.reduce((groups, task) => {
    const groupId = task.offerGroupId || "ungrouped";
    if (!groups[groupId]) {
      groups[groupId] = [];
    }
    groups[groupId].push(task);
    return groups;
  }, {});

  Object.keys(groupedTasks).forEach((groupId) => {
    const taskGroup = groupedTasks[groupId];
    let groupPrice = 0;

    if (groupId !== "ungrouped") {
      const group = offerGroups.find((g) => g.offerGroupId === groupId);
      if (group) {
        groupPrice = parseFloat(group.invoicePrice || group.offerPrice || 0);
      }

      if (!groupPrice) {
        groupPrice = taskGroup.reduce(
          (sum, task) => sum + parseFloat(task.estimatedPrice || 0),
          0
        );
      }

      const taskWorkDate = new Date(taskGroup[0].planned?.workDate);

      // Tel de maandelijkse bijdragen op tot de datum van deze groep
      let futureMonths =
        (taskWorkDate.getFullYear() - startDate.getFullYear()) * 12 +
        (taskWorkDate.getMonth() - startDate.getMonth());

      if (taskWorkDate.getDate() < startDate.getDate()) {
        futureMonths -= 1;
      }

      if (futureMonths > 0) {
        remainingCash += futureMonths * monthlyContribution;
        startDate.setFullYear(taskWorkDate.getFullYear());
        startDate.setMonth(taskWorkDate.getMonth());
      }

      remainingCash -= groupPrice;
      remainingCashList.push(remainingCash);
      logAction("Processed group", { groupId, groupPrice, remainingCash });
    } else {
      taskGroup.forEach((task) => {
        const taskWorkDate = new Date(task.planned?.workDate);

        let taskPrice = parseFloat(
          task.planned?.invoicePrice ||
            task.planned?.offerPrice ||
            task.estimatedPrice ||
            0
        );

        // Tel de maandelijkse bijdragen op tot de datum van deze taak
        let futureMonths =
          (taskWorkDate.getFullYear() - startDate.getFullYear()) * 12 +
          (taskWorkDate.getMonth() - startDate.getMonth());

        if (taskWorkDate.getDate() < startDate.getDate()) {
          futureMonths -= 1;
        }

        if (futureMonths > 0) {
          remainingCash += futureMonths * monthlyContribution;
          startDate.setFullYear(taskWorkDate.getFullYear());
          startDate.setMonth(taskWorkDate.getMonth());
        }

        remainingCash -= taskPrice;
        remainingCashList.push(remainingCash);
        logAction("Processed ungrouped task", {
          taskId: task.id,
          taskPrice,
          remainingCash,
        });
      });
    }
  });

  logAction("Final remaining cash list", { remainingCashList });
  console.log("logs", JSON.stringify(logs));

  return remainingCashList;
};

const Planning = () => {

  const {
    state: { globalSpaces, globalElements, cashInfo, offerGroups },
    setGlobalElements,
    setOfferGroups,
    calculateCurrentCash,
    getSaldoColor,
  } = useMjopContext();

  const [allTasks, setAllTasks] = useState([]);
  const [remainingCashList, setRemainingCashList] = useState([]);
  const [showDoneTasks, setShowDoneTasks] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [elementAnnotations, setElementAnnotations] = useState([]);

  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [offerGroupModalOpen, setOfferGroupModalOpen] = useState(false);
  const [offerGroupName, setOfferGroupName] = useState("");

  useEffect(() => {
    const tasks = globalElements
      .filter((element) => Array.isArray(element.tasks))
      .flatMap((element) =>
        element.tasks.map((task) => ({
          ...task,
          elementId: element.id,
          elementName: element.name,
          spaceName:
            globalSpaces.find((space) => space.id === element.spaceId)?.name ||
            "Onbekende ruimte",
        }))
      );

    tasks.sort(
      (a, b) =>
        new Date(a.planned?.workDate || Infinity) -
        new Date(b.planned?.workDate || Infinity)
    );

    setAllTasks(tasks);

    const updatedRemainingCashList = calculateRemainingCash(
      parseFloat(cashInfo.currentCash),
      parseFloat(cashInfo.monthlyContribution),
      tasks,
      new Date(),
      cashInfo.reserveDate,
      offerGroups
    );
    setRemainingCashList(updatedRemainingCashList);

    if (tasks.some((task) => !task.planned?.workDate)) {
      setExpandedAccordion("unplanned");
    } else {
      setExpandedAccordion("planned");
    }
  }, [globalElements, cashInfo, globalSpaces, offerGroups]);

  const handleChange = useCallback(
    (taskIdOrGroupId, elementId, value, field, isGroup = false) => {
      if (isGroup) {
        setOfferGroups((prevGroups) => {
          const groupIndex = prevGroups.findIndex(
            (group) => group.offerGroupId === taskIdOrGroupId
          );
          if (groupIndex === -1) return prevGroups;

          const updatedGroups = [...prevGroups];
          updatedGroups[groupIndex] = {
            ...updatedGroups[groupIndex],
            [field]: value,
          };

          return updatedGroups;
        });
      } else {
        if (!elementId) return;

        setGlobalElements((prevElements) => {
          const updatedElements = [...prevElements];
          const elementIndex = updatedElements.findIndex(
            (element) => element.id === elementId
          );
          if (elementIndex === -1) return prevElements;

          const updatedElement = { ...updatedElements[elementIndex] };
          const taskIndex = updatedElement.tasks.findIndex(
            (task) => task.id === taskIdOrGroupId
          );
          if (taskIndex === -1) return prevElements;

          const updatedTask = { ...updatedElement.tasks[taskIndex] };

          if (field === "offerGroupId") {
            if (value === null) {
              delete updatedTask.offerGroupId;
            } else {
              updatedTask.offerGroupId = value;
            }
          } else {
            updatedTask.planned = {
              ...updatedTask.planned,
              [field]: value,
            };
          }

          updatedElement.tasks[taskIndex] = updatedTask;
          updatedElements[elementIndex] = updatedElement;

          return updatedElements;
        });
      }

      setAllTasks((prevTasks) => {
        let updatedTasks = prevTasks.map((task) =>
          task.id === taskIdOrGroupId
            ? {
                ...task,
                offerGroupId:
                  field === "offerGroupId" ? value : task.offerGroupId,
                planned: {
                  ...task.planned,
                  [field]: value,
                },
              }
            : task
        );

        const sortedTasks = updatedTasks.sort(
          (a, b) =>
            new Date(a.planned?.workDate || Infinity) -
            new Date(b.planned?.workDate || Infinity)
        );

        const updatedRemainingCashList = calculateRemainingCash(
          parseFloat(cashInfo.currentCash),
          parseFloat(cashInfo.monthlyContribution),
          sortedTasks,
          new Date(),
          cashInfo.reserveDate,
          offerGroups
        );

        setRemainingCashList(updatedRemainingCashList);
        return sortedTasks;
      });
    },
    [setGlobalElements, setOfferGroups, offerGroups, cashInfo]
  );

  const handleTaskDelete = useCallback(
    (taskId, elementId) => {
      setGlobalElements((prevElements) => {
        const elementIndex = prevElements.findIndex(
          (element) => element.id === elementId
        );
        if (elementIndex === -1) return prevElements;

        const updatedElements = [...prevElements];
        const updatedElement = { ...updatedElements[elementIndex] };

        const updatedTasks = updatedElement.tasks.filter(
          (task) => task.id !== taskId
        );

        updatedElement.tasks = updatedTasks;
        updatedElements[elementIndex] = updatedElement;

        return updatedElements;
      });

      setAllTasks((prevTasks) => {
        const updatedTasks = prevTasks.filter((task) => task.id !== taskId);

        const sortedTasks = updatedTasks.sort(
          (a, b) =>
            new Date(a.planned?.workDate || Infinity) -
            new Date(b.planned?.workDate || Infinity)
        );

        const updatedRemainingCashList = calculateRemainingCash(
          parseFloat(cashInfo.currentCash),
          parseFloat(cashInfo.monthlyContribution),
          sortedTasks,
          new Date(),
          cashInfo.reserveDate,
          offerGroups
        );

        setRemainingCashList(updatedRemainingCashList);
        return sortedTasks;
      });
    },
    [setGlobalElements, cashInfo, offerGroups]
  );

  const handleFileChange = useCallback(
    async (taskId, elementId, files, type) => {
      const uploadedFiles = await Promise.all(
        Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          try {
            const response = await axios.post(
              "http://localhost:5000/upload",
              formData,
              {
                headers: { "Content-Type": "multipart/form-data" },
              }
            );
            return response.data.filePath;
          } catch (error) {
            console.error("Error uploading file:", error);
            return null;
          }
        })
      );

      setGlobalElements((prevElements) => {
        const elementIndex = prevElements.findIndex(
          (element) => element.id === elementId
        );
        if (elementIndex === -1) return prevElements;

        const updatedElements = [...prevElements];
        const updatedElement = { ...updatedElements[elementIndex] };

        const taskIndex = updatedElement.tasks.findIndex(
          (task) => task.id === taskId
        );
        if (taskIndex === -1) return prevElements;

        const updatedTasks = [...updatedElement.tasks];
        const updatedTask = { ...updatedTasks[taskIndex] };

        const existingFiles = updatedTask.planned?.[`${type}Files`] || [];
        updatedTask.planned = {
          ...updatedTask.planned,
          [`${type}Files`]: [...existingFiles, ...uploadedFiles],
        };

        updatedTasks[taskIndex] = updatedTask;
        updatedElement.tasks = updatedTasks;
        updatedElements[elementIndex] = updatedElement;

        return updatedElements;
      });
    },
    [setGlobalElements]
  );

  const handleFileDelete = useCallback(
    (taskId, elementId, filePath, type) => {
      setGlobalElements((prevElements) => {
        const elementIndex = prevElements.findIndex(
          (element) => element.id === elementId
        );
        if (elementIndex === -1) return prevElements;

        const updatedElements = [...prevElements];
        const updatedElement = { ...updatedElements[elementIndex] };

        const taskIndex = updatedElement.tasks.findIndex(
          (task) => task.id === taskId
        );
        if (taskIndex === -1) return prevElements;

        const updatedTasks = [...updatedElement.tasks];
        const updatedTask = { ...updatedTasks[taskIndex] };

        const existingFiles = updatedTask.planned?.[`${type}Files`] || [];
        const updatedFiles = existingFiles.filter((file) => file !== filePath);

        updatedTask.planned = {
          ...updatedTask.planned,
          [`${type}Files`]: updatedFiles,
        };

        updatedTasks[taskIndex] = updatedTask;
        updatedElement.tasks = updatedTasks;
        updatedElements[elementIndex] = updatedElement;

        return updatedElements;
      });
    },
    [setGlobalElements]
  );

  const handleOpenImageAnnotationModal = useCallback(
    (report) => {
      const element = globalElements.find((el) => el.id === report.elementId);

      if (!element) {
        console.error(`Element with ID ${report.elementId} not found`);
        return;
      }

      const selectedSpace = globalSpaces.find(
        (space) => space.id === element.spaceId
      );

      if (!selectedSpace) {
        console.error(`Space with ID ${element.spaceId} not found`);
        return;
      }

      const imageUrl = selectedSpace.image || "";

      if (!imageUrl) {
        console.error(`No image found for space ID ${element.spaceId}`);
        return;
      }

      const absoluteImageUrl = imageUrl.startsWith("http")
        ? imageUrl
        : `http://localhost:5000/${imageUrl}`;

      setSelectedImage(absoluteImageUrl);

      const spaceAnnotations = selectedSpace.annotations || [];
      const elementAnnotations = element.annotations || [];

      setAnnotations(spaceAnnotations);
      setElementAnnotations(elementAnnotations);

      console.log("Space Annotations:", spaceAnnotations);
      console.log("Element Annotations:", elementAnnotations);

      setOpenImageModal(true);
    },
    [globalElements, globalSpaces]
  );

  const handleSelectTask = useCallback((taskId) => {
    setSelectedTasks((prevSelected) =>
      prevSelected.includes(taskId)
        ? prevSelected.filter((id) => id !== taskId)
        : [...prevSelected, taskId]
    );
  }, []);

  const createOfferGroup = () => {
    const newGroup = {
      offerGroupId: uuidv4(),
      invoicePrice: 0,
      offerPrice: 0,
      estimatedValue: 0,
      name: offerGroupName || `Group ${offerGroups.length + 1}`,
      offerAccepted: false,
    };
    setOfferGroups([...offerGroups, newGroup]);
    setOfferGroupName("");
  };

  const groupSelectedTasks = () => {
    if (selectedTasks.length === 0) return;

    const tasksAlreadyGrouped = selectedTasks.some((taskId) => {
      const task = allTasks.find((task) => task.id === taskId);
      return task && task.offerGroupId;
    });

    if (tasksAlreadyGrouped) {
      alert(
        "One or more selected tasks are already part of a group. You can't group a group."
      );
      return;
    }

    setOfferGroupModalOpen(true);
  };

  const handleOfferGroupModalClose = () => {
    setOfferGroupModalOpen(false);
  };

  const handleOfferGroupModalSubmit = () => {
    const newGroupId = uuidv4();

    setOfferGroups((prevGroups) => [
      ...prevGroups,
      {
        offerGroupId: newGroupId,
        invoicePrice: 0,
        offerPrice: 0,
        estimatedValue: 0,
        name: offerGroupName || `Group ${offerGroups.length + 1}`,
        offerAccepted: false,
      },
    ]);

    let totalInvoicePrice = 0;
    let totalEstimatedValue = 0;

    selectedTasks.forEach((taskId) => {
      setGlobalElements((prevElements) => {
        const updatedElements = prevElements.map((element) => {
          const updatedTasks = Array.isArray(element.tasks)
            ? element.tasks.map((task) => {
                if (task.id === taskId) {
                  const invoicePrice = parseFloat(
                    task.planned?.invoicePrice || 0
                  );
                  const estimatedValue = parseFloat(
                    task.planned?.estimatedPrice || task.estimatedPrice || 0
                  );

                  totalInvoicePrice += invoicePrice;
                  totalEstimatedValue += estimatedValue;

                  return {
                    ...task,
                    offerGroupId: newGroupId,
                    planned: {
                      ...task.planned,
                      offerPrice: null,
                    },
                  };
                }
                return task;
              })
            : [];

          return {
            ...element,
            tasks: updatedTasks,
          };
        });

        return updatedElements;
      });
    });

    setOfferGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.offerGroupId === newGroupId
          ? {
              ...group,
              invoicePrice: totalInvoicePrice,
              estimatedValue: totalEstimatedValue,
            }
          : group
      )
    );

    setSelectedTasks([]);
    handleOfferGroupModalClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box
        component="section"
        sx={{
          width: "100%",
          p: 3,
          maxHeight: "100vh",
          borderRadius: 3,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)', // Softer and more refined shadow
          backgroundColor: "background.paper",
          transition: "all 0.3s ease-in-out", // Smooth transition on hover
          "&:hover": {
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.18)', // Shadow effect on hover
          },
        }}
      >
  <FormControlLabel
      control={
        <Switch
          checked={showDoneTasks}
          onChange={(e) => setShowDoneTasks(e.target.checked)}
          color="primary"
        />
      }
      label={
        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
          Toon voltooide taken
        </Typography>
      }
      sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
    />
        {selectedTasks.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            sx={{
              mb: 3,
              py: 1.5, // More padding for a modern look
              px: 4,
              borderRadius: '50px', // Fully rounded for a premium feel
              background: 'linear-gradient(135deg, #0f2644, #1f3d5a)', // Smooth gradient background
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)', // Hoverable box shadow
              textTransform: 'none',
              transition: "all 0.3s ease",
              "&:hover": {
                background: 'linear-gradient(135deg, #f9961b, #ffbb57)', // Change gradient on hover
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)', // Stronger shadow on hover
                transform: "translateY(-2px)", // Lift on hover for interaction
              },
            }}
            onClick={groupSelectedTasks}
          >
            Groepeer Geselecteerde Taken
          </Button>
        )}
  
        <GroupAndTaskGrid
          allTasks={allTasks}
          remainingCashList={remainingCashList}
          showDoneTasks={showDoneTasks}
          handleChange={handleChange}
          handleFileChange={handleFileChange}
          handleFileDelete={handleFileDelete}
          handleTaskDelete={handleTaskDelete}
          handleOpenImageAnnotationModal={handleOpenImageAnnotationModal}
          handleSelectTask={handleSelectTask}
          selectedTasks={selectedTasks}
          offerGroups={offerGroups}
          setGlobalElements={setGlobalElements}
          calculateRemainingCash={calculateRemainingCash}
          cashInfo={cashInfo}
        />
      </Box>
  
      <Modal
        open={openImageModal}
        onClose={() => setOpenImageModal(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.85)", // Darker background for emphasis
          backdropFilter: "blur(4px)", // Adding blur for modern effect
        }}
      >
        <Box
          sx={{
            width: "80%",
            height: "80%",
            backgroundColor: "background.paper",
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)', // Stronger shadow for modal
            p: 3,
            borderRadius: 4, // More rounded corners for the modal
            position: "relative",
            overflow: "hidden",
          }}
        >
          <IconButton
            onClick={() => setOpenImageModal(false)}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "grey.700",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.9)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 3,
              overflow: "auto",
              backgroundColor: "#f5f5f5",
            }}
          >
            <ImageAnnotation
              image={selectedImage}
              annotations={annotations}
              elementAnnotations={elementAnnotations}
              onAddAnnotation={(newAnnotation) => {
                setElementAnnotations((prevAnnotations) => [
                  ...prevAnnotations,
                  newAnnotation,
                ]);
              }}
            />
          </Box>
        </Box>
      </Modal>
  
      <Modal
        open={offerGroupModalOpen}
        onClose={handleOfferGroupModalClose}
        aria-labelledby="offer-group-modal-title"
        aria-describedby="offer-group-modal-description"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: "blur(4px)", // Added blur effect for modern feel
        }}
      >
        <Box
          sx={{
            width: 400,
            bgcolor: "background.paper",
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)', // Modern shadow for the modal
            p: 4,
            borderRadius: 3, // More rounded edges for a polished look
          }}
        >
          <Typography id="offer-group-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
            Creëer een nieuwe groep
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="groupName"
            label="Naam van de groep"
            type="text"
            fullWidth
            variant="standard"
            value={offerGroupName}
            onChange={(e) => setOfferGroupName(e.target.value)}
          />
          <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
            <Button
              onClick={handleOfferGroupModalClose}
              sx={{
                color: "#555", // Muted cancel button color
                "&:hover": {
                  color: "#000", // Darker hover effect
                },
              }}
            >
              Annuleer
            </Button>
            <Button
              onClick={handleOfferGroupModalSubmit}
              color="primary"
              sx={{
                borderRadius: '50px',
                py: 1,
                px: 3,
                background: 'linear-gradient(135deg, #f9961b, #ffbb57)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                "&:hover": {
                  background: 'linear-gradient(135deg, #ffbb57, #f9961b)',
                  boxShadow: '0 6px 14px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              Bevestigen
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
  
  
};

export default Planning;
