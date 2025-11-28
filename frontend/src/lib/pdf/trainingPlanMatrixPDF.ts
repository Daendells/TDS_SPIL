import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TrainingSchedule {
  id: number;
  program: string;
  competencyCode: string;
  trainingTopic: string;
  materialType: number;
  scheduledDate: string;
}

interface CompetencySchedule {
  competencyCode: string;
  trainingTopic: string;
  m1Date: Date | null;
  m2Date: Date | null;
  earliestDate: Date;
}

interface MonthColumn {
  month: string;
  year: number;
  weeks: number[];
  colSpan: number;
}

function parseScheduleDate(dateStr: string): Date {
  return new Date(dateStr);
}

function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const firstDayOfWeek = firstDay.getDay();
  const offsetDate = dayOfMonth + firstDayOfWeek - 1;
  return Math.ceil(offsetDate / 7);
}

function getMonthYearKey(date: Date): string {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function groupSchedulesByCompetency(schedules: TrainingSchedule[]): CompetencySchedule[] {
  const grouped = new Map<string, CompetencySchedule>();

  schedules.forEach((schedule) => {
    const key = schedule.competencyCode;
    const date = parseScheduleDate(schedule.scheduledDate);

    if (!grouped.has(key)) {
      grouped.set(key, {
        competencyCode: schedule.competencyCode,
        trainingTopic: schedule.trainingTopic,
        m1Date: null,
        m2Date: null,
        earliestDate: date,
      });
    }

    const comp = grouped.get(key)!;
    if (schedule.materialType === 1) {
      comp.m1Date = date;
    } else if (schedule.materialType === 2) {
      comp.m2Date = date;
    }

    if (date < comp.earliestDate) {
      comp.earliestDate = date;
    }
  });

  return Array.from(grouped.values()).sort(
    (a, b) => a.earliestDate.getTime() - b.earliestDate.getTime()
  );
}

function generateMonthColumns(schedules: CompetencySchedule[]): MonthColumn[] {
  const allDates: Date[] = [];

  schedules.forEach((comp) => {
    if (comp.m1Date) allDates.push(comp.m1Date);
    if (comp.m2Date) allDates.push(comp.m2Date);
  });

  if (allDates.length === 0) return [];

  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  const startMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  const months: MonthColumn[] = [];
  const currentMonth = new Date(startMonth);

  while (currentMonth <= endMonth) {
    months.push({
      month: getMonthYearKey(currentMonth),
      year: currentMonth.getFullYear(),
      weeks: [1, 2, 3, 4],
      colSpan: 4,
    });
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  return months;
}

function createMatrixData(schedules: CompetencySchedule[], months: MonthColumn[]): string[][] {
  return schedules.map((comp) => {
    const row: string[] = [`${comp.competencyCode}\n${comp.trainingTopic}`];

    months.forEach((month) => {
      const [monthName, yearStr] = month.month.split(" ");
      const year = parseInt(yearStr);
      const monthIndex = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ].indexOf(monthName);

      month.weeks.forEach((week) => {
        let cellContent = "";

        if (comp.m1Date) {
          const m1Month = comp.m1Date.getMonth();
          const m1Year = comp.m1Date.getFullYear();
          const m1Week = getWeekOfMonth(comp.m1Date);

          if (m1Year === year && m1Month === monthIndex && m1Week === week) {
            cellContent = "M1";
          }
        }

        if (comp.m2Date) {
          const m2Month = comp.m2Date.getMonth();
          const m2Year = comp.m2Date.getFullYear();
          const m2Week = getWeekOfMonth(comp.m2Date);

          if (m2Year === year && m2Month === monthIndex && m2Week === week) {
            cellContent = cellContent ? `${cellContent}\nM2` : "M2";
          }
        }

        row.push(cellContent);
      });
    });

    return row;
  });
}

export function generateTrainingPlanMatrixPDF(
  schedules: TrainingSchedule[],
  program: string
): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const competencySchedules = groupSchedulesByCompetency(schedules);
  const monthColumns = generateMonthColumns(competencySchedules);

  if (monthColumns.length === 0) {
    doc.setFontSize(12);
    doc.text("No schedules available", 20, 20);
    doc.save(`Training_Plan_Matrix_${program}.pdf`);
    return;
  }

  doc.setFontSize(16);
  doc.text(`Training Plan Matrix - ${program}`, 20, 15);

  const headerRow1: string[] = ["Program"];
  const headerRow2: string[] = [""];

  monthColumns.forEach((month) => {
    headerRow1.push(month.month);
    for (let i = 1; i < month.colSpan; i++) {
      headerRow1.push("");
    }
    month.weeks.forEach((week) => {
      headerRow2.push(`Week ${week}`);
    });
  });

  const matrixData = createMatrixData(competencySchedules, monthColumns);

  const columnStyles: Record<number, { cellWidth: number }> = {
    0: { cellWidth: 40 },
  };

  for (let i = 1; i <= monthColumns.length * 4; i++) {
    columnStyles[i] = { cellWidth: 15 };
  }

  autoTable(doc, {
    head: [headerRow1, headerRow2],
    body: matrixData,
    startY: 25,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: "center",
      valign: "middle",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles,
    didDrawCell: (data) => {
      if (data.row.section === "head" && data.row.index === 0) {
        const monthIndex = Math.floor((data.column.index - 1) / 4);
        if (monthIndex >= 0 && monthIndex < monthColumns.length) {
          const month = monthColumns[monthIndex];
          const isFirstWeek = (data.column.index - 1) % 4 === 0;

          if (isFirstWeek) {
            const startX = data.cell.x;
            const width = month.colSpan * 15;
            const height = data.cell.height;

            doc.setFillColor(41, 128, 185);
            doc.rect(startX, data.cell.y, width, height, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.text(month.month, startX + width / 2, data.cell.y + height / 2, {
              align: "center",
              baseline: "middle",
            });
          }
        }
      }
    },
    didParseCell: (data) => {
      if (data.row.section === "body" && data.column.index > 0) {
        const cellText = data.cell.text.join("");
        if (cellText.includes("M1") || cellText.includes("M2")) {
          data.cell.styles.fillColor = [46, 204, 113];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  doc.save(`Training_Plan_Matrix_${program}.pdf`);
}
