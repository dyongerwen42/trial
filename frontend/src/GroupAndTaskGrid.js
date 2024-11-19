import React, { useState } from "react";
import { Table, TableBody, TableContainer, Paper } from "@mui/material";
import GroupRow from "./GroupRow";
import TaskRow from "./TaskRow";
import { getGroupedTasks, getUngroupedTasks } from "./utils";

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
  setGlobalElements,
  calculateRemainingCash,
  cashInfo = {},
}) => {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (id) => {
    setOpenItems((prevOpenItems) => ({
      ...prevOpenItems,
      [id]: !prevOpenItems[id],
    }));
  };

  const handleGroupWorkDateChange = (groupId, date) => {
    handleChange(groupId, null, date, "groupWorkDate", true);

    const group = groupedTasks[groupId];
    if (group && group.tasks) {
      group.tasks.forEach((task) => {
        handleChange(task.id, task.elementId, date, "workDate", false);
      });
    }
  };

  const handleGroupSelectionChange = (taskId, groupId) => {
    if (groupId === "") {
      handleChange(taskId, null, null, "offerGroupId");
    } else {
      handleUpdateTaskGroup(taskId, groupId);
    }
  };

  const groupedTasks = getGroupedTasks(
    allTasks,
    remainingCashList,
    showDoneTasks,
    offerGroups
  );

  const ungroupedTasks = getUngroupedTasks(allTasks, showDoneTasks);

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
      <Table aria-label="collapsible table">
        <TableBody>
          {Object.entries(groupedTasks).map(([groupId, group]) => {
            const groupData = offerGroups.find(
              (offerGroup) => offerGroup.offerGroupId === groupId
            );
            return (
              <GroupRow
                key={`group-${groupId}`}
                groupId={groupId}
                group={group}
                groupName={group.groupName}
                totalRemainingCash={group.totalRemainingCash}
                groupUrgency={group.groupUrgency}
                groupWorkDate={groupData?.groupWorkDate}
                groupData={groupData}
                toggleItem={toggleItem}
                openItems={openItems}
                handleSelectTask={handleSelectTask}
                selectedTasks={selectedTasks}
                handleGroupWorkDateChange={handleGroupWorkDateChange}
                handleTaskDelete={handleTaskDelete}
                handleChange={handleChange}
                handleOpenImageAnnotationModal={handleOpenImageAnnotationModal}
                offerGroups={offerGroups}
                handleFileChange={handleFileChange}
                handleFileDelete={handleFileDelete}
                handleGroupSelectionChange={handleGroupSelectionChange}
                setGlobalElements={setGlobalElements}
                calculateRemainingCash={calculateRemainingCash}
                cashInfo={cashInfo}
              />
            );
          })}
          {ungroupedTasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              index={index}
              remainingCash={remainingCashList[index] || 0}
              toggleItem={toggleItem}
              openItems={openItems}
              handleSelectTask={handleSelectTask}
              selectedTasks={selectedTasks}
              handleOpenImageAnnotationModal={handleOpenImageAnnotationModal}
              handleChange={handleChange}
              handleTaskDelete={handleTaskDelete}
              offerGroups={offerGroups}
              handleGroupSelectionChange={handleGroupSelectionChange}
              handleFileChange={handleFileChange}
              handleFileDelete={handleFileDelete}
              setGlobalElements={setGlobalElements}
              calculateRemainingCash={calculateRemainingCash}
              cashInfo={cashInfo}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GroupAndTaskGrid;
