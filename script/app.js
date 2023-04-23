const fileInput = document.querySelector(".file-input");
const tableHeader = document.querySelector(".preview-header-section");
const table = document.querySelector(".table-to-copy");
const message = document.querySelector(".message");
const loader = document.querySelector(".custom-loader");
const copyBtn = document.querySelector(".copy-btn");
const fileUploadBanner = document
  .querySelector(".file-upload-banner")
  .getElementsByTagName("span")[0];
const excelPreviewSection = document.querySelector(".excel-preview-section");
const previewArea = document.querySelector("#previewInExcel");
const previewResetBtn = document.querySelector(".excel-preview-reset");
const previewSaveBtn = document.querySelector(".excel-preview-save");

loader.style.display = "none";
message.style.display = "none";
tableHeader.style.display = "none";

let formattedData = [];
let prevFormattedData = [];
const handsontableObj = new Handsontable(previewArea, {
  rowHeaders: true,
  colHeaders: true,
  width: "100%",
  height: "90%",
  colWidths: 300,
  dragToScroll: true,
  contextMenu: true,
  dropdownMenu: true,
  filters: true,
  licenseKey: "non-commercial-and-evaluation",
});

// ------------------------ helper starts -------------------------
function showErrorMessage(errTxt) {
  message.innerHTML = errTxt;
  message.style.display = "block";
}

function downloadExcelFile() {
  if (formattedData.length) {
    exportWorksheet(formattedData);
  } else {
    showErrorMessage("Please select a file, to continue ...");
  }
}

function showAndHideLoader(status) {
  loader.style.display = status ? "flex" : "none";
}

function showFormattedDataInPage(jsonData) {
  table.innerHTML = "";
  tableHeader.style.display = "flex";
  const myWorkSheet = XLSX.utils.json_to_sheet(jsonData);

  // showing in html
  const html = XLSX.utils.sheet_to_html(myWorkSheet);
  showAndHideLoader(false);
  table.innerHTML = `
                    ${html}`;
}

function exportWorksheet(jsonObject) {
  const myWorkSheet = XLSX.utils.json_to_sheet(jsonObject);
  const myWorkBook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(myWorkBook, myWorkSheet, "myWorkSheet");
  XLSX.writeFile(myWorkBook, "myTimeLog.xlsx");
}

function previewInExcelViewer(data) {
  if (!data.length) {
    showErrorMessage("Please upload a csv file to preview !!");
    return;
  }
  handsontableObj.updateData(data);
}

function toggleTheme() {
  document.body.classList.toggle("dark");
}

function excelPreviewSectionToggleVisibility() {
  excelPreviewSection.classList.toggle("active");
}

function addOrRemoveActiveClass(btnRef) {
  btnRef.classList.add("active");
  setTimeout(() => {
    btnRef.classList.remove("active");
  }, 500);
}
//  ---------------------------- helper ends--------------------------------

// ----------------------------- event listener start --------------------

document.querySelector(".file-upload-banner").addEventListener("click", () => {
  fileInput.click();
});
message.addEventListener("click", (e) => {
  e.stopPropagation();
});

fileInput.addEventListener("change", (e) => {
  if (!!e.target.files.length) {
    fileUploadBanner.innerHTML = e.target.files[0].name;
    message.style.display = "none";
    csvFileParser(fileInput);
  } else {
    fileUploadBanner.innerHTML = "* Upload csv file";
    showErrorMessage("No File Selected !!");
  }
});

document.getElementById("upload").addEventListener("click", (e) => {
  e.stopPropagation();
  csvFileParser(fileInput);
});

previewResetBtn.addEventListener("click", () => {
  // console.log(previewResetBtn.style);
  // previewResetBtn.style.setProperty('--reset-btn-content', 'Reset successfully')
  addOrRemoveActiveClass(previewResetBtn);
});

previewResetBtn.addEventListener("mouseover", () => {
  // console.log(previewResetBtn.style);
  // previewResetBtn.style.setProperty('--reset-btn-content', 'Reset successfully')
  addOrRemoveActiveClass(previewResetBtn);
});

document
  .querySelector(".download-btn")
  .addEventListener("click", downloadExcelFile);
document.querySelector(".theme-toggler").addEventListener("click", toggleTheme);

document.querySelector(".excel-preview").addEventListener("click", () => {
  previewInExcelViewer(formattedData);
  excelPreviewSectionToggleVisibility();
});

function bindWithHeader(header, data) {
  let output = {};
  header.map((h, i) => {
    output[h] = data[i];
    return output;
  });
  return output;
}

document
  .querySelector(".excel-preview-close")
  .addEventListener("click", excelPreviewSectionToggleVisibility);

previewSaveBtn.addEventListener("click", () => {
  // Saving the prev version json data -> for undo operation
  prevFormattedData = structuredClone(formattedData);

  const editedData = Object.values(handsontableObj.getData());
  const header = Object.keys(formattedData[0]);

  formattedData = editedData.map((d, i) => {
    return bindWithHeader(header, d);
  });
  addOrRemoveActiveClass(previewSaveBtn);
  showFormattedDataInPage(formattedData);
});

const getTableText = (data, divider) => {
  const columns = Object.keys(data[0]);
  const th = `${columns.join(divider)}`;
  const td = data
    .map((item) => Object.values(item).join(`"${divider}"`))
    .join('"\n"');

  return `${th}\n"${td}"`;
};

copyBtn.addEventListener("click", () => {
  if (!formattedData.length) {
    showErrorMessage("Nothing to Copy, please upload a excel to copy !!");
    return;
  }
  const tableDataAsText = getTableText(formattedData, "\t");
  navigator.clipboard.writeText(tableDataAsText).then(() => {
    addOrRemoveActiveClass(copyBtn);
  });
});

(function () {
  const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
  if (darkThemeMq.matches) {
    // Theme set to dark.
    toggleTheme();
  }
})();

// ----------------------------- event listener ends --------------------

function csvFileParser(inp_file) {
  if (!inp_file.files.length) {
    showErrorMessage("No File Selected !!");
    return;
  }
  if (inp_file.files[0].name.split(".").pop() !== "csv") {
    showErrorMessage("Only CSV files are allowed !!");
    return;
  }

  showAndHideLoader(true);
  Papa.parse(inp_file.files[0], {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      proceedWithData(results.data);
    },
  });
}

async function formatDataAsPerRequirement(data) {
  // ------------------------------------------------------- REQUIREMENT -------------------------------------
  // Log sheet format
  // 1. Date has to be on mm/dd/yyyy format
  // 2. The has to be in hh:mm format
  // 3. 1 empty row after each date
  // 4. Please don’t have duplicate dates
  // 5. No need to repeat date if the above feature is the same date (no blank rows between items of the same date)
  // 6. Each day has to be either 7+ hours or 3+ hours.
  // 7. Hours can’t exceed 9 for any day
  // 8. Please don’t have rows with items less then 1 hr (club the points in the same row if necessary)
  // ------------------------------------------------------- REQUIREMENT -------------------------------------
  let output = [];
  let prevData;
  const blankRow = {
    date: "",
    ticket_id: "",
    ticket_title: "",
    status: "",
    hrs: "",
  };
  data.forEach((d, index) => {
    let obj = {};
    const [currentHr, currentMin] = d?.hrs?.split(":");

    if (index !== 0 && prevData?.date !== d.date) {
      output.push(blankRow);
    }

    if (prevData?.date === d.date) {
      if (currentHr < 1) {
        prevData.ticket_title += `, ${d.ticket_title}`;
        prevData.ticket_id += `, ${d.ticket_id}`;

        const [prevHr, prevMin] = prevData.hrs.split(":");

        let updatedHours = Number(prevHr) + Number(currentHr);
        let updatedMinutes = Number(prevMin) + Number(currentMin);

        if (updatedMinutes > 60) {
          updatedHours += Math.floor(updatedMinutes / 60);
          updatedMinutes = updatedMinutes % 60;
        }

        prevData.hrs = `${
          updatedHours < 10 ? "0" + updatedHours : updatedHours
        }:${updatedMinutes < 10 ? "0" + updatedMinutes : updatedMinutes}`;
      } else {
        obj = {
          ...d,
          date: "",
        };
      }
    } else {
      obj = d;
      prevData = d;
    }

    if (!!obj?.ticket_title) {
      output.push(obj);
    }
  });
  return output;
}

async function proceedWithData(excelData) {
  try {
    if (!excelData.length) {
      throw new Error("Empty file !!");
    }
    const jsonData = Object.values(excelData).filter((d) =>
      d?.Task?.toLowerCase()?.includes("prth")
    );

    if (!jsonData.length) {
      throw new Error(
        "Not a valid file, follow<a href='./assets/new_instructions.pdf' target='_blank'>instructions</a> to get a valid file"
      );
    }

    const updatedJsonData = jsonData.map((d, index) => {
      const { Project, User, Task, ...neededData } = d;

      // changed to mm/dd/yyyy
      const date =
        neededData?.Date || neededData?.date
          ? new Date(neededData?.Date || neededData?.date)
          : null;
      const formattedDate = date
        ? `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
        : "Not Found";

      // changed to hh:mm format time
      const hrs = !!neededData["HRS (Digital)"]
        ? neededData["HRS (Digital)"]?.split(":")
        : null;

      return {
        date: formattedDate,
        ticket_id: Task?.substring(Task?.indexOf("PRTH")),
        ticket_title: Task || "No Data Found",
        status: "",
        hrs: hrs ? `${hrs[0]}:${hrs[1]}` : "Not Found",
      };
    });
    formattedData = [];
    formattedData = await formatDataAsPerRequirement(updatedJsonData);
    showFormattedDataInPage(formattedData);
    tableHeader.scrollIntoView(true);
  } catch (e) {
    showAndHideLoader(false);
    table.innerHTML = "";
    formattedData = [];
    showErrorMessage(e.message);
  }
}
