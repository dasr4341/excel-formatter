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
  message.innerText = errTxt;
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
  table.innerHTML = '';
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

fileInput.addEventListener("change", (e) => {
  if (!!e.target.files.length) {
    fileUploadBanner.innerHTML = e.target.files[0].name;
    message.style.display = "none";
  }
});

document.getElementById("upload").addEventListener("click", () => {
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
  prevFormattedData = structuredClone(formattedData) ;

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
      console.log("results.data", results.data);
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
  let prevDate = "";
  let prevIndex = 0;
  data.forEach((d, index) => {
    if (prevIndex >= output.length) {
      prevIndex = output.length - 1;
    }

    const currentTaskTime = d["HRS (Digital)"]
      ? d["HRS (Digital)"].split(":")
      : null;

    if (prevDate !== "" && d?.Date !== prevDate) {
      output.push({
        "HRS (Digital)": "",
        Date: "",
        "Serial No": "",
        Status: "",
        "Ticket #": "",
        "Ticket Title": "",
      });
    }

    if (
      prevDate !== "" &&
      prevDate === d.Date &&
      !!currentTaskTime &&
      currentTaskTime[0] < 1
    ) {
      const prevTaskData = output[prevIndex];
      const prevTaskTime = prevTaskData["HRS (Digital)"]
        ? prevTaskData["HRS (Digital)"].split(":")
        : [0, 0];

      let updatedHours = Number(prevTaskTime[0]) + Number(currentTaskTime[0]);
      let updatedMinutes = Number(prevTaskTime[1]) + Number(currentTaskTime[1]);

      if (updatedMinutes > 60) {
        updatedHours += Math.floor(updatedMinutes / 60);
        updatedMinutes = updatedMinutes % 60;
      }

      prevTaskData[
        "Ticket #"
      ] = `${prevTaskData["Ticket #"]}, ${d["Ticket #"]}`;
      prevTaskData[
        "Ticket Title"
      ] = `${prevTaskData["Ticket Title"]}, ${d["Ticket Title"]}`;
      prevTaskData["HRS (Digital)"] = `${
        updatedHours < 10 ? "0" + updatedHours : updatedHours
      }:${updatedMinutes < 10 ? "0" + updatedMinutes : updatedMinutes}`;

      output[prevIndex] = prevTaskData;
    } else if (prevDate !== "" && d?.Date === prevDate) {
      output.push({
        "Serial No": d["Serial No"],
        Date: "",
        "Ticket #": d["Ticket #"],
        "Ticket Title": d["Ticket Title"],
        Status: d["Status"],
        "HRS (Digital)": d["HRS (Digital)"],
      });
      prevIndex = index;
    } else {
      output.push(d);
      prevIndex = index;
    }
    prevDate = d.Date;
  });
  return output;
}

async function proceedWithData(excelData) {
  if (!excelData.length) {
    showAndHideLoader(false);
    table.innerHTML = "";
    formattedData = [];
    showErrorMessage("Empty file !!");
    return;
  }
  const jsonData = Object.values(excelData)
    .filter((d) => d.Task.toLowerCase().includes("prth"))
    .map((d, index) => {
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
      const hrs = neededData["HRS (Digital)"]
        ? neededData["HRS (Digital)"].split(":")
        : null;

      return {
        "Serial No": index + 1,
        Date: formattedDate,
        "Ticket #": Task?.substring(Task?.indexOf("PRTH")),
        "Ticket Title": Task || "No Data Found",
        Status: "",
        // ...neededData
        "HRS (Digital)": hrs ? `${hrs[0]}:${hrs[1]}` : "Not Found",
        '': ''
      };
    });
  formattedData = [];

  formattedData = await formatDataAsPerRequirement(jsonData);
  showFormattedDataInPage(formattedData);
}

// old template format
async function proceedWithDataOldFormat(excelData) {
  if (!excelData.length) {
    showAndHideLoader(false);
    table.innerHTML = "";
    formattedData = [];
    showErrorMessage("Empty file !!");
    return;
  }
  formattedData = [];
  const jsonData = await Object.values(excelData)
    .filter((d) => d.Project.toLowerCase().includes("jira"))
    .map((d, index) => {
      const { Project, User, Task, ...neededData } = d;
      return {
        "Serial No": index + 1,
        Date: neededData?.Date || neededData?.date || "Not Found",
        "Ticket #": Task?.substring(Task?.indexOf("PRTH")),
        "Ticket Title": Task || "No Data Found",
        Status: "",
        ...neededData,
      };
    });

  let prevDate = "";
  jsonData.forEach((d) => {
    if (prevDate !== "" && d?.Date !== prevDate) {
      formattedData.push({
        "HRS (Digital)": "",
        Date: "",
        "Serial No": "",
        Status: "",
        "Ticket #": "",
        "Ticket Title": "",
      });
    }
    formattedData.push(d);
    prevDate = d.Date;
  });
  showFormattedDataInPage(jsonData);
}

// Papa.parse("./excel.csv", {
//   download: true,
//   header: true,
//   skipEmptyLines: true,
//   complete: function (results) {
//     console.log("results.data", results.data);
//     proceedWithData(results.data);
//   },
// });
