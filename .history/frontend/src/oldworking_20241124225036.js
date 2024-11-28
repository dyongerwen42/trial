import React, { useState } from "react";
import {
  FormControlLabel,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Collapse,
  Checkbox,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  TextField,
  Divider,
  MenuItem,
  Select,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  ErrorOutline as ErrorOutlineIcon,
  Download as DownloadIcon,
  RequestPage as RequestPageIcon,
} from "@mui/icons-material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case "1":
      return "#4caf50";
    case "2":
      return "#8bc34a";
    case "3":
      return "#ffc107";
    case "4":
      return "#ff9800";
    case "5":
      return "#ff5722";
    case "6":
      return "#f44336";
    default:
      return "#9e9e9e";
  }
};

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
  handleUpdateTaskGroup,
}) => {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (id) => {
    setOpenItems((prevOpenItems) => ({
      ...prevOpenItems,
      [id]: !prevOpenItems[id],
    }));
  };

  const handleGroupWorkDateChange = (groupId, date) => {
    handleChange(groupId, null, date, "groupWorkDate");
  };

  const handleGroupSelectionChange = (taskId, groupId) => {
    handleUpdateTaskGroup(taskId, groupId);
  };

  const requestOffer = () => {
    alert("Offer has been requested.");
  };

  const renderTasks = (tasks, remainingCashList) => {
    const filteredTasks = showDoneTasks
      ? tasks
      : tasks.filter((task) => !task.inspectionDone);

    const groupedTasks = filteredTasks.reduce((acc, task, index) => {
      const groupId = task.offerGroupId;
      if (groupId) {
        if (!acc[groupId]) {
          acc[groupId] = { tasks: [], remainingCash: [] };
        }
        acc[groupId].tasks.push(task);
        acc[groupId].remainingCash.push(remainingCashList[index]);
      }
      return acc;
    }, {});

    const ungroupedTasks = filteredTasks.filter((task) => !task.offerGroupId);

    return (
      <>
        {Object.entries(groupedTasks).map(([groupId, group]) => {
          const groupName = offerGroups.find((g) => g.offerGroupId === groupId)?.name;
          const totalRemainingCash = group.remainingCash.reduce(
            (acc, val) => acc + val,
            0
          );
          const groupUrgency = Math.max(
            ...group.tasks.map((task) => task.urgency || 0)
          );
          const groupWorkDate = group.tasks[0]?.planned?.workDate
            ? new Date(group.tasks[0].planned.workDate)
            : null;
          const groupData = offerGroups.find((g) => g.offerGroupId === groupId) || {};

          return (
            <React.Fragment key={`group-${groupId}`}>
              <TableRow
                hover
                sx={{
                  backgroundColor: "#e0e0e0",
                  "&:hover": { backgroundColor: "#d6d6d6" },
                }}
              >
                <TableCell sx={{ padding: "8px", verticalAlign: "middle", width: "5%" }}>
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
                    />
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    padding: "8px",
                    verticalAlign: "middle",
                    fontWeight: "bold",
                    width: "30%",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {groupName}
                </TableCell>
                <TableCell sx={{ padding: "8px", verticalAlign: "middle", width: "15%" }}>
                  <DatePicker
                    selected={groupWorkDate}
                    onChange={(date) => handleGroupWorkDateChange(groupId, date)}
                    dateFormat="MM/yyyy"
                    showMonthYearPicker
                    customInput={
                      <Typography variant="body2">
                        {groupWorkDate
                          ? groupWorkDate.toLocaleDateString()
                          : "Niet ingesteld"}
                      </Typography>
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
                      backgroundColor: getUrgencyColor(groupUrgency),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    {groupUrgency}
                  </Box>
                </TableCell>
                <TableCell sx={{ padding: "8px", verticalAlign: "middle", width: "15%" }} />
                <TableCell
                  sx={{
                    padding: "8px",
                    textAlign: "center",
                    verticalAlign: "middle",
                    width: "5%",
                  }}
                >
                  {groupUrgency >= 4 && (
                    <Tooltip title="Er is een hoge urgentietaak in deze groep" arrow>
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
                  Resterend: €{totalRemainingCash.toFixed(2)}
                </TableCell>
                <TableCell
                  sx={{ padding: "8px", verticalAlign: "middle", width: "10%" }}
                >
                  <Box display="flex" alignItems="center">
                    <IconButton
                      onClick={requestOffer}
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
                      onClick={() => handleTaskDelete(groupId)}
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
                  <Collapse in={openItems[`group-${groupId}`]} timeout="auto" unmountOnExit>
                    <Box
                      sx={{
                        margin: 2,
                        padding: 2,
                        backgroundColor: "#f0f0f0",
                        borderRadius: 2,
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

                      {/* Group Details */}
                      <TextField
                        fullWidth
                        type="number"
                        label="Offerteprijs"
                        value={groupData.offerPrice || ""}
                        onChange={(e) =>
                          handleChange(groupId, null, e.target.value, "groupOfferPrice")
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
                        value={groupData.invoicePrice || ""}
                        onChange={(e) =>
                          handleChange(groupId, null, e.target.value, "groupInvoicePrice")
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
                              "groupOffer"
                            )
                          }
                          style={{ marginBottom: "12px", display: "block" }}
                        />
                        {groupData.offerFiles &&
                          groupData.offerFiles.map((file, fileIndex) => (
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
                                  handleFileDelete(groupId, null, file, "groupOffer")
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
                              "groupInvoice"
                            )
                          }
                          style={{ marginBottom: "12px", display: "block" }}
                        />
                        {groupData.invoiceFiles &&
                          groupData.invoiceFiles.map((file, fileIndex) => (
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
                                    groupId,
                                    null,
                                    file,
                                    "groupInvoice"
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
                            groupData.startDate
                              ? new Date(groupData.startDate)
                              : null
                          }
                          onChange={(date) =>
                            handleChange(groupId, null, date, "groupStartDate")
                          }
                          dateFormat="dd/MM/yyyy"
                          customInput={
                            <TextField
                              variant="outlined"
                              fullWidth
                              value={
                                groupData.startDate
                                  ? new Date(
                                      groupData.startDate
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
                            groupData.endDate
                              ? new Date(groupData.endDate)
                              : null
                          }
                          onChange={(date) =>
                            handleChange(groupId, null, date, "groupEndDate")
                          }
                          dateFormat="dd/MM/yyyy"
                          customInput={
                            <TextField
                              variant="outlined"
                              fullWidth
                              value={
                                groupData.endDate
                                  ? new Date(
                                      groupData.endDate
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
                            checked={groupData.offerAccepted || false}
                            onChange={(e) =>
                              handleChange(
                                groupId,
                                null,
                                e.target.checked,
                                "groupOfferAccepted"
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
                    </Box>

                    {/* Group's Tasks */}
                    <Divider sx={{ mb: 2 }} />
                    <Table>
                      <TableBody>
                        {group.tasks.map((task, index) => (
                          <React.Fragment key={task.id}>
                            <TableRow
                              hover
                              sx={{
                                "&:hover": { backgroundColor: "#f5f5f5" },
                              }}
                            >
                              <TableCell
                                sx={{
                                  padding: "8px",
                                  verticalAlign: "middle",
                                  width: "5%",
                                }}
                              >
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  sx={{ width: "100%" }}
                                >
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
                                  width: "30%",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <Tooltip
                                  title={`${
                                    task.spaceName || "Unknown Space"
                                  } > ${task.elementName || "Unknown Element"} > ${
                                    task.name || "Unnamed Task"
                                  }`}
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
                                <Typography variant="body2">
                                  {task.planned?.workDate
                                    ? new Date(
                                        task.planned.workDate
                                      ).toLocaleDateString()
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
                                <Box
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    backgroundColor: getUrgencyColor(
                                      task.urgency
                                    ),
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
                                    ? new Date(
                                        task.ultimateDate
                                      ).toLocaleDateString()
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
                                {task.weeksRemaining <= 12 &&
                                  !task.planned?.offerAccepted && (
                                    <Tooltip
                                      title="Taak loopt af binnen 12 weken en de offerte is niet geaccepteerd"
                                      arrow
                                    >
                                      <ErrorOutlineIcon
                                        color="error"
                                        sx={{ fontSize: 24 }}
                                      />
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
                                  {group.remainingCash[index] !== undefined &&
                                  !isNaN(group.remainingCash[index])
                                    ? group.remainingCash[index].toFixed(2)
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
                                    onClick={requestOffer}
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
                                    onClick={() =>
                                      handleTaskDelete(task.id, task.elementId)
                                    }
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
                                  in={openItems[`task-${task.id}`]}
                                  timeout="auto"
                                  unmountOnExit
                                >
                                  <Box
                                    sx={{
                                      margin: 2,
                                      padding: 2,
                                      backgroundColor: "#fafafa",
                                      borderRadius: 2,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        mb: 2,
                                        fontWeight: "bold",
                                        color: "primary.main",
                                      }}
                                    >
                                      {task.description ||
                                        "Geen beschrijving beschikbaar"}
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      type="number"
                                      label="Geschatte prijs"
                                      value={
                                        task.planned?.estimatedPrice || ""
                                      }
                                      onChange={(e) =>
                                        handleChange(
                                          task.id,
                                          task.elementId,
                                          e.target.value,
                                          "estimatedPrice"
                                        )
                                      }
                                      variant="outlined"
                                      sx={{
                                        mb: 2,
                                        backgroundColor: "#fff",
                                        borderRadius: 2,
                                      }}
                                      InputLabelProps={{
                                        style: { color: "#3f51b5" },
                                      }}
                                    />
                                    <TextField
                                      fullWidth
                                      type="number"
                                      label="Offerteprijs"
                                      value={task.planned?.offerPrice || ""}
                                      onChange={(e) =>
                                        handleChange(
                                          task.id,
                                          task.elementId,
                                          e.target.value,
                                          "offerPrice"
                                        )
                                      }
                                      variant="outlined"
                                      sx={{
                                        mb: 2,
                                        backgroundColor: "#fff",
                                        borderRadius: 2,
                                      }}
                                      InputLabelProps={{
                                        style: { color: "#3f51b5" },
                                      }}
                                    />
                                    <TextField
                                      fullWidth
                                      type="number"
                                      label="Factuurprijs"
                                      value={task.planned?.invoicePrice || ""}
                                      onChange={(e) =>
                                        handleChange(
                                          task.id,
                                          task.elementId,
                                          e.target.value,
                                          "invoicePrice"
                                        )
                                      }
                                      variant="outlined"
                                      sx={{
                                        mb: 2,
                                        backgroundColor: "#fff",
                                        borderRadius: 2,
                                      }}
                                      InputLabelProps={{
                                        style: { color: "#3f51b5" },
                                      }}
                                    />
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
                                            task.id,
                                            task.elementId,
                                            e.target.files,
                                            "offer"
                                          )
                                        }
                                        style={{
                                          marginBottom: "12px",
                                          display: "block",
                                        }}
                                      />
                                      {task.planned?.offerFiles &&
                                        task.planned.offerFiles.map(
                                          (file, fileIndex) => (
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
                                                  const link =
                                                    document.createElement("a");
                                                  link.href = `http://localhost:5000/${file}`;
                                                  link.download = file;
                                                  link.click();
                                                }}
                                              >
                                                <DownloadIcon
                                                  sx={{ color: "#3f51b5" }}
                                                />
                                              </IconButton>
                                              <IconButton
                                                size="small"
                                                onClick={() =>
                                                  handleFileDelete(
                                                    task.id,
                                                    task.elementId,
                                                    file,
                                                    "offer"
                                                  )
                                                }
                                              >
                                                <DeleteIcon
                                                  sx={{ color: "#d32f2f" }}
                                                />
                                              </IconButton>
                                            </Box>
                                          )
                                        )}
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
                                            task.id,
                                            task.elementId,
                                            e.target.files,
                                            "invoice"
                                          )
                                        }
                                        style={{
                                          marginBottom: "12px",
                                          display: "block",
                                        }}
                                      />
                                      {task.planned?.invoiceFiles &&
                                        task.planned.invoiceFiles.map(
                                          (file, fileIndex) => (
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
                                                  const link =
                                                    document.createElement("a");
                                                  link.href = `http://localhost:5000/${file}`;
                                                  link.download = file;
                                                  link.click();
                                                }}
                                              >
                                                <DownloadIcon
                                                  sx={{ color: "#3f51b5" }}
                                                />
                                              </IconButton>
                                              <IconButton
                                                size="small"
                                                onClick={() =>
                                                  handleFileDelete(
                                                    task.id,
                                                    task.elementId,
                                                    file,
                                                    "invoice"
                                                  )
                                                }
                                              >
                                                <DeleteIcon
                                                  sx={{ color: "#d32f2f" }}
                                                />
                                              </IconButton>
                                            </Box>
                                          )
                                        )}
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
                                        Startdatum
                                      </Typography>
                                      <DatePicker
                                        selected={
                                          task.planned?.startDate
                                            ? new Date(task.planned.startDate)
                                            : null
                                        }
                                        onChange={(date) =>
                                          handleChange(
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
                                          task.planned?.endDate
                                            ? new Date(task.planned.endDate)
                                            : null
                                        }
                                        onChange={(date) =>
                                          handleChange(
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
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={
                                            task.planned?.offerAccepted || false
                                          }
                                          onChange={(e) =>
                                            handleChange(
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
                                        mb: 2,
                                        "& .MuiFormControlLabel-label": {
                                          fontSize: 14,
                                        },
                                      }}
                                    />
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={task.inspectionDone}
                                          onChange={(e) =>
                                            handleChange(
                                              task.id,
                                              task.elementId,
                                              e.target.checked,
                                              "inspectionDone"
                                            )
                                          }
                                          disabled={
                                            !task.planned?.invoiceFiles?.length
                                          }
                                          sx={{ color: "#388e3c" }}
                                        />
                                      }
                                      label="Klaar"
                                      sx={{
                                        mb: 2,
                                        "& .MuiFormControlLabel-label": {
                                          fontSize: 14,
                                        },
                                      }}
                                    />
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          );
        })}

        {/* Render ungrouped tasks */}
        {ungroupedTasks.map((task, index) => (
          <React.Fragment key={task.id}>
            <TableRow
              hover
              sx={{
                "&:hover": { backgroundColor: "#f5f5f5" },
                backgroundColor: "#eeeeee",
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
                  width: "30%",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Tooltip
                  title={`${
                    task.spaceName || "Unknown Space"
                  } > ${task.elementName || "Unknown Element"} > ${
                    task.name || "Unnamed Task"
                  }`}
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
                <Typography variant="body2">
                  {task.planned?.workDate
                    ? new Date(task.planned.workDate).toLocaleDateString()
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
                  {remainingCashList[index] !== undefined &&
                  !isNaN(remainingCashList[index])
                    ? remainingCashList[index].toFixed(2)
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
                    onClick={requestOffer}
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
              <TableCell
                style={{ paddingBottom: 0, paddingTop: 0 }}
                colSpan={8}
              >
                <Collapse
                  in={openItems[`task-${task.id}`]}
                  timeout="auto"
                  unmountOnExit
                >
                  <Box
                    sx={{
                      margin: 2,
                      padding: 2,
                      backgroundColor: "#fafafa",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 2,
                        fontWeight: "bold",
                        color: "primary.main",
                      }}
                    >
                      {task.description || "Geen beschrijving beschikbaar"}
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      label="Geschatte prijs"
                      value={task.planned?.estimatedPrice || ""}
                      onChange={(e) =>
                        handleChange(
                          task.id,
                          task.elementId,
                          e.target.value,
                          "estimatedPrice"
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
                      label="Offerteprijs"
                      value={task.planned?.offerPrice || ""}
                      onChange={(e) =>
                        handleChange(
                          task.id,
                          task.elementId,
                          e.target.value,
                          "offerPrice"
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
                      value={task.planned?.invoicePrice || ""}
                      onChange={(e) =>
                        handleChange(
                          task.id,
                          task.elementId,
                          e.target.value,
                          "invoicePrice"
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
                            task.id,
                            task.elementId,
                            e.target.files,
                            "offer"
                          )
                        }
                        style={{
                          marginBottom: "12px",
                          display: "block",
                        }}
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
                                  "offer"
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
                            task.id,
                            task.elementId,
                            e.target.files,
                            "invoice"
                          )
                        }
                        style={{
                          marginBottom: "12px",
                          display: "block",
                        }}
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
                                  "invoice"
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
                        Startdatum
                      </Typography>
                      <DatePicker
                        selected={
                          task.planned?.startDate
                            ? new Date(task.planned.startDate)
                            : null
                        }
                        onChange={(date) =>
                          handleChange(
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
                          task.planned?.endDate
                            ? new Date(task.planned.endDate)
                            : null
                        }
                        onChange={(date) =>
                          handleChange(
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
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={task.planned?.offerAccepted || false}
                          onChange={(e) =>
                            handleChange(
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
                        mb: 2,
                        "& .MuiFormControlLabel-label": { fontSize: 14 },
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={task.inspectionDone}
                          onChange={(e) =>
                            handleChange(
                              task.id,
                              task.elementId,
                              e.target.checked,
                              "inspectionDone"
                            )
                          }
                          disabled={!task.planned?.invoiceFiles?.length}
                          sx={{ color: "#388e3c" }}
                        />
                      }
                      label="Klaar"
                      sx={{
                        mb: 2,
                        "& .MuiFormControlLabel-label": { fontSize: 14 },
                      }}
                    />
                  </Box>
                </Collapse>
              </TableCell>
            </TableRow>
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
      <Table aria-label="collapsible table">
        <TableBody>{renderTasks(allTasks, remainingCashList)}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default GroupAndTaskGrid;
