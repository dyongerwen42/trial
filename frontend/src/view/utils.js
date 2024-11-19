import jsPDF from "jspdf";


export const getUrgencyColor = (urgency) => {
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


export const generatePdf = (taskDetails, images, fileName) => {
  const doc = new jsPDF();

  // Add task details
  doc.setFontSize(16);
  doc.text(taskDetails.name, 10, 20);
  doc.setFontSize(12);
  doc.text(taskDetails.description, 10, 30);

  // Add images with annotations
  images.forEach((image, index) => {
    if (image.data) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text(image.title, 10, 20);
      doc.addImage(image.data, "JPEG", 10, 30, 180, 100);
      // Add annotations as text
      image.annotations.forEach((annotation, idx) => {
        doc.text(`${idx + 1}. ${annotation.text}`, 10, 140 + idx * 10);
      });
    }
  });

  // Save the PDF
  doc.save(`${fileName}.pdf`);
};

export const getGroupedTasks = (allTasks, remainingCashList, showDoneTasks, offerGroups) => {
  const filteredTasks = showDoneTasks
    ? allTasks
    : allTasks.filter((task) => !task.inspectionDone);

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

  return groupedTasks;
};

export const getUngroupedTasks = (allTasks, showDoneTasks) => {
  return (showDoneTasks ? allTasks : allTasks.filter((task) => !task.inspectionDone)).filter(
    (task) => !task.offerGroupId
  );
};
