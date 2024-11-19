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
import ImageAnnotation from "../ImageAnnotation";
import { generatePdf } from "../utils"; // Ensure this import is correct based on your file structure

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
  const remainingCash =
    calculateRemainingCash(
      parseFloat(currentCash),
      cashInfo.monthlyContribution || 0,
      [task],
      new Date(),
      cashInfo.reserveDate || new Date(),
      offerGroups
    )[0] || 0;

  const renderImagesAndDocuments = (photos = [], documents = []) => (
    <>
      {photos.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "bold",
              color: "primary.main",
              textTransform: "uppercase",
              mb: 1,
            }}
          >
            Images
          </Typography>
          <Box
            display="flex"
            flexDirection="row"
            flexWrap="wrap"
            gap={2}
            mb={2}
          >
            {photos.map((photo, index) => (
              <Box
                key={index}
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: 2,
                  transition: "transform 0.2s",
                  width: "100px",
                  height: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f0f0f0",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                <img
                  src={`http://localhost:5000/${photo}`}
                  alt={`Task Image ${index + 1}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "cover",
                  }}
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
              color: "primary.main",
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
                  backgroundColor: "background.paper",
                  padding: 1,
                  borderRadius: 2,
                  boxShadow: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <a
                  href={`http://localhost:5000/${document}`}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: "none",
                    color: "primary.main",
                    fontWeight: "bold",
                    flex: 1,
                  }}
                >
                  {document.split("/").pop()}
                </a>
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
          "&:hover": { backgroundColor: "action.hover" },
          borderLeft: task.isSubtask ? "4px solid primary.main" : "none",
          backgroundColor: task.isSubtask
            ? "primary.lighter"
            : "background.paper",
        }}
      >
        <TableCell sx={{ padding: 1, verticalAlign: "middle", width: "5%" }}>
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
              disabled
            />
          </Box>
        </TableCell>
        <TableCell
          sx={{
            padding: 1,
            verticalAlign: "middle",
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
                color: "primary.dark",
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
        <TableCell sx={{ padding: 1, verticalAlign: "middle", width: "15%" }}>
          <Typography
            sx={{
              backgroundColor: "background.default",
              borderRadius: 2,
              padding: 1,
            }}
          >
            {task.planned?.workDate
              ? new Date(task.planned.workDate).toLocaleDateString()
              : "Niet ingesteld"}
          </Typography>
        </TableCell>
        <TableCell
          sx={{
            padding: 1,
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
        <TableCell sx={{ padding: 1, verticalAlign: "middle", width: "15%" }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontStyle: "italic" }}
          >
            Einddatum:{" "}
            {task.ultimateDate
              ? new Date(task.ultimateDate).toLocaleDateString()
              : "Niet ingesteld"}
          </Typography>
        </TableCell>
        <TableCell
          sx={{
            padding: 1,
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
        <TableCell sx={{ padding: 1, verticalAlign: "middle", width: "20%" }}>
          <Typography
            variant="body2"
            color="primary"
            sx={{ fontWeight: "bold" }}
          >
            Resterend: €{remainingCash.toFixed(2)}
          </Typography>
        </TableCell>
        <TableCell
          sx={{ padding: 1, verticalAlign: "middle", width: "10%" }}
        ></TableCell>
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
                backgroundColor: "background.default",
                borderRadius: 2,
                boxShadow: 1,
                borderLeft: task.isSubtask ? "4px solid primary.main" : "none",
              }}
            >
              <Typography
                variant="body2"
                sx={{ mb: 3, fontWeight: "bold", color: "primary.main" }}
              >
                {task.description || "Geen beschrijving beschikbaar"}
              </Typography>

              {task.isSubtask ? (
                <>
                  <Typography
                    sx={{
                      mb: 3,
                      backgroundColor: "background.paper",
                      borderRadius: 2,
                      padding: 1,
                    }}
                  >
                    Geschatte prijs: €{task.estimatedPrice || "0.00"}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={task.isDone || false}
                        sx={{ color: "primary.main" }}
                        disabled
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
                  <Typography
                    sx={{
                      mb: 3,
                      backgroundColor: "background.paper",
                      borderRadius: 2,
                      padding: 1,
                    }}
                  >
                    Geschatte prijs: €{task.estimatedPrice || "0.00"}
                  </Typography>

                  <Typography
                    sx={{
                      mb: 3,
                      backgroundColor: "background.paper",
                      borderRadius: 2,
                      padding: 1,
                    }}
                  >
                    Groep:{" "}
                    {task.offerGroupId
                      ? offerGroups.find(
                          (group) => group.offerGroupId === task.offerGroupId
                        )?.name || "Geen groep"
                      : "Geen groep"}
                  </Typography>

                  {!isGrouped && (
                    <>
                      <Typography
                        sx={{
                          mb: 3,
                          backgroundColor: "background.paper",
                          borderRadius: 2,
                          padding: 1,
                        }}
                      >
                        Offerteprijs: €{task.planned?.offerPrice || "0.00"}
                      </Typography>
                      <Typography
                        sx={{
                          mb: 3,
                          backgroundColor: "background.paper",
                          borderRadius: 2,
                          padding: 1,
                        }}
                      >
                        Factuurprijs: €{task.planned?.invoicePrice || "0.00"}
                      </Typography>

                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 1,
                            fontWeight: "bold",
                            color: "primary.main",
                          }}
                        >
                          Offerte bestanden
                        </Typography>
                        {task.planned?.offerFiles &&
                          task.planned.offerFiles.map((file, fileIndex) => (
                            <Box
                              display="flex"
                              alignItems="center"
                              sx={{
                                mb: 1,
                                backgroundColor: "primary.lighter",
                                borderRadius: 2,
                                p: 1,
                              }}
                              key={fileIndex}
                            >
                              <Typography variant="body2">
                                {file.split("/").pop()}
                              </Typography>
                            </Box>
                          ))}
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 1,
                            fontWeight: "bold",
                            color: "primary.main",
                          }}
                        >
                          Factuur bestanden
                        </Typography>
                        {task.planned?.invoiceFiles &&
                          task.planned.invoiceFiles.map((file, fileIndex) => (
                            <Box
                              display="flex"
                              alignItems="center"
                              sx={{
                                mb: 1,
                                backgroundColor: "error.lighter",
                                borderRadius: 2,
                                p: 1,
                              }}
                              key={fileIndex}
                            >
                              <Typography variant="body2">
                                {file.split("/").pop()}
                              </Typography>
                            </Box>
                          ))}
                      </Box>

                      {task.planned?.offerAccepted && (
                        <>
                          <Typography
                            sx={{
                              mb: 3,
                              backgroundColor: "background.paper",
                              borderRadius: 2,
                              padding: 1,
                            }}
                          >
                            Startdatum:{" "}
                            {task.planned?.startDate
                              ? new Date(
                                  task.planned.startDate
                                ).toLocaleDateString()
                              : "Niet ingesteld"}
                          </Typography>
                          <Typography
                            sx={{
                              mb: 3,
                              backgroundColor: "background.paper",
                              borderRadius: 2,
                              padding: 1,
                            }}
                          >
                            Einddatum:{" "}
                            {task.planned?.endDate
                              ? new Date(
                                  task.planned.endDate
                                ).toLocaleDateString()
                              : "Niet ingesteld"}
                          </Typography>
                        </>
                      )}

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={task.planned?.offerAccepted || false}
                            sx={{ color: "primary.main" }}
                            disabled
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
                            sx={{ color: "primary.main" }}
                            disabled
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
              border: "2px solid primary.main",
              borderRadius: 2,
              marginBottom: 2,
              boxShadow: 1,
            }}
          >
            <TableRow
              hover
              sx={{
                backgroundColor: "background.default",
                "&:hover": { backgroundColor: "action.hover" },
              }}
            >
              <TableCell
                sx={{ padding: 1, verticalAlign: "middle", width: "5%" }}
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
                    disabled
                  />
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  padding: 1,
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
                sx={{ padding: 1, verticalAlign: "middle", width: "15%" }}
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
                        backgroundColor: "background.paper",
                        borderRadius: 2,
                        padding: 1,
                      }}
                      InputLabelProps={{
                        style: { color: "primary.main" },
                      }}
                      disabled
                    />
                  }
                />
              </TableCell>
              <TableCell
                sx={{
                  padding: 1,
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
                sx={{ padding: 1, verticalAlign: "middle", width: "15%" }}
              />
              <TableCell
                sx={{
                  padding: 1,
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
                  padding: 1,
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
                sx={{ padding: 1, verticalAlign: "middle", width: "10%" }}
              ></TableCell>
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
                      backgroundColor: "background.default",
                      borderRadius: 2,
                      boxShadow: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
                    >
                      Groep Details
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ mb: 2, fontWeight: "bold", color: "text.primary" }}
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
                        backgroundColor: "background.paper",
                        borderRadius: 2,
                      }}
                      InputLabelProps={{ style: { color: "primary.main" } }}
                      disabled
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
                        backgroundColor: "background.paper",
                        borderRadius: 2,
                      }}
                      InputLabelProps={{ style: { color: "primary.main" } }}
                      disabled
                    />

                    {/* Group Files */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          color: "primary.main",
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
                        disabled
                      />
                      {group.groupData.offerFiles &&
                        group.groupData.offerFiles.map((file, fileIndex) => (
                          <Box
                            display="flex"
                            alignItems="center"
                            sx={{
                              mb: 1,
                              backgroundColor: "primary.lighter",
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
                                color: "text.primary",
                              }}
                            >
                              <Typography variant="body2">
                                {file.split("/").pop()}
                              </Typography>
                            </a>
                          </Box>
                        ))}
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          color: "primary.main",
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
                        disabled
                      />
                      {group.groupData.invoiceFiles &&
                        group.groupData.invoiceFiles.map((file, fileIndex) => (
                          <Box
                            display="flex"
                            alignItems="center"
                            sx={{
                              mb: 1,
                              backgroundColor: "error.lighter",
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
                                color: "text.primary",
                              }}
                            >
                              <Typography variant="body2">
                                {file.split("/").pop()}
                              </Typography>
                            </a>
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
                          color: "primary.main",
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
                              backgroundColor: "background.paper",
                              borderRadius: 2,
                            }}
                            InputLabelProps={{
                              style: { color: "primary.main" },
                            }}
                            disabled
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
                          color: "primary.main",
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
                              backgroundColor: "background.paper",
                              borderRadius: 2,
                            }}
                            InputLabelProps={{
                              style: { color: "primary.main" },
                            }}
                            disabled
                          />
                        }
                      />
                    </Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={group.groupData.offerAccepted || false}
                          sx={{ color: "primary.main" }}
                          disabled
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
                          sx={{ color: "primary.main" }}
                          disabled
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
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: "bold", mb: 2 }}
          >
            Ongeplande taken ({unplannedTasks.length})
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
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: "bold", mb: 2, color: "primary.main" }}
          >
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

const Planning = ({
  globalSpaces = [],
  globalElements = [],
  setGlobalElements,
  cashInfo,
  offerGroups = [],
  setOfferGroups,
}) => {
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
    <Box>
      <Box
        height="80vh"
        overflow="auto"
        component="section"
        sx={{
          width: "100%",
          p: 3,
          maxHeight: "100vh",
          borderRadius: 2,
          boxShadow: 4,
          backgroundColor: "background.paper",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
      <FormControlLabel
  control={
    <Checkbox
      checked={showDoneTasks}
      onChange={(e) => setShowDoneTasks(e.target.checked)}
      sx={{
        color: 'primary.main',
        '&.Mui-checked': {
          color: 'success.main',
        },
      }}
    />
  }
  label={
    <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
      Toon voltooide taken
    </Typography>
  }
  sx={{
    display: 'flex',
    alignItems: 'center',
    mb: 2,
    color: 'primary.main',
  }}
/>

          <Box sx={{ display: "flex", gap: 2 }}>
          <Button
              variant="contained"
              color="success"
              sx={{ fontWeight: "bold" }}
            >
              Actualiseer MJOP
            </Button>
            <Button
              variant="contained"
              color="success"
              sx={{ fontWeight: "bold" }}
            >
              Export to Excel
            </Button>
            <Button
              variant="contained"
              color="secondary"
              sx={{ fontWeight: "bold" }}
            >
              Export to PDF
            </Button>
          </Box>
        </Box>
      
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
          backgroundColor: "rgba(0, 0, 0, 0.8)",
        }}
      >
        <Box
          sx={{
            width: "80%",
            height: "80%",
            backgroundColor: "background.paper",
            boxShadow: 24,
            p: 3,
            borderRadius: 3,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <IconButton
            onClick={() => setOpenImageModal(false)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
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
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography id="offer-group-modal-title" variant="h6" component="h2">
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
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button onClick={handleOfferGroupModalClose}>Annuleer</Button>
            <Button onClick={handleOfferGroupModalSubmit} color="primary">
              Bevestigen
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Planning;
