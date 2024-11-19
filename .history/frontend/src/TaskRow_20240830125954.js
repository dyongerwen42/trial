import React from "react";
import {
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableRow,
  TableCell,
  Box,
  IconButton,
  Checkbox,
  Typography,
  Tooltip,
  Collapse,
  TextField,
  Divider,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  ErrorOutline as ErrorOutlineIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getUrgencyColor } from "./utils";

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
}) => {
  if (!task) {
    return null;
  }

  const isGrouped = !!task.offerGroupId;

  const calculateRemainingCash = (
    initialCash,
    monthlyContribution,
    tasks,
    now = new Date(),
    budgetStartDate,
    offerGroups = []
  ) => {
    const startDate = new Date(budgetStartDate);
    let monthsPassed =
      (now.getFullYear() - startDate.getFullYear()) * 12 +
      (now.getMonth() - startDate.getMonth());

    if (now.getDate() < startDate.getDate()) {
      monthsPassed -= 1;
    }

    let remainingCash = initialCash + monthsPassed * monthlyContribution;

    let remainingCashList = [];

    tasks
      .filter((task) => task.planned?.workDate)
      .sort(
        (a, b) =>
          new Date(a.planned?.workDate || Infinity) -
          new Date(b.planned?.workDate || Infinity)
      )
      .forEach((task) => {
        const taskWorkDate = task.planned?.workDate
          ? new Date(task.planned.workDate)
          : null;

        let price;

        if (task.offerGroupId) {
          const group = offerGroups.find(
            (group) => group.offerGroupId === task.offerGroupId
          );
          if (group) {
            price = parseFloat(group.invoicePrice || group.offerPrice || 0);
          }
        }

        if (price === undefined) {
          const invoicePrice = parseFloat(task.planned?.invoicePrice || 0);
          const offerPrice = parseFloat(task.planned?.offerPrice || 0);
          const estimatedPrice = parseFloat(
            task.planned?.estimatedPrice || task.estimatedPrice || 0
          );
          price = invoicePrice || offerPrice || estimatedPrice;
        }

        if (taskWorkDate && taskWorkDate <= now) {
          remainingCash -= price;
        } else if (taskWorkDate) {
          let futureMonths =
            (taskWorkDate.getFullYear() - startDate.getFullYear()) * 12 +
            (taskWorkDate.getMonth() - startDate.getMonth());
          if (taskWorkDate.getDate() < startDate.getDate()) {
            futureMonths -= 1;
          }

          remainingCash += futureMonths * monthlyContribution;
          remainingCash -= price;

          startDate.setFullYear(taskWorkDate.getFullYear());
          startDate.setMonth(taskWorkDate.getMonth());
        }

        remainingCash = Math.max(remainingCash, 0);

        remainingCashList.push(remainingCash);
      });

    return remainingCashList;
  };

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
    setGlobalElements((prevElements) => {
      return prevElements.map((element) => {
        if (element.id === elementId) {
          const updatedTasks = element.tasks.map((t) => {
            if (t.id === taskId) {
              if (field in t.planned) {
                return {
                  ...t,
                  planned: {
                    ...t.planned,
                    [field]: value,
                  },
                };
              } else {
                return {
                  ...t,
                  [field]: value,
                };
              }
            }
            return t;
          });

          return {
            ...element,
            tasks: updatedTasks,
          };
        }
        return element;
      });
    });
  };

  const handleGroupSelectionChange = (taskId, elementId, groupId) => {
    handleTaskFieldChange(taskId, elementId, groupId, "offerGroupId");
  };

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
                padding: 2,
                backgroundColor: "#fafafa",
                borderRadius: 2,
                boxShadow: "inset 0 2px 5px rgba(0,0,0,0.1)",
                borderLeft: task.isSubtask ? "4px solid #1976d2" : "none",
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

              {task.isSubtask ? (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
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
                      marginBottom: 2,
                      backgroundColor: "#fff",
                      borderRadius: 2,
                    }}
                    InputLabelProps={{ style: { color: "#3f51b5" } }}
                  />
                  <Divider sx={{ mb: 2 }} />
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
                      marginBottom: 2,
                      backgroundColor: "#fff",
                      borderRadius: 2,
                    }}
                    InputLabelProps={{ style: { color: "#3f51b5" } }}
                  />

                  <FormControl fullWidth sx={{ mb: 2 }}>
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
                          handleTaskFieldChange(
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
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ mb: 1, fontWeight: "bold", color: "#424242" }}
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
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ mb: 1, fontWeight: "bold", color: "#424242" }}
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
                          mb: 2,
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
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default TaskRow;
