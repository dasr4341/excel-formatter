const file_inp = document.getElementById('file_inp');
const table = document.querySelector(".table");
const message = document.querySelector(".message");
const loader = document.querySelector(".custom-loader");
loader.style.display = 'none';

let formattedData = [];

document.getElementById('upload').addEventListener('click', () => {
    csvFileParser(file_inp);
});

function showAndHideLoader(status) {
    loader.style.display = status ? 'flex' : 'none';
}


function csvFileParser(inp_file) {
     if (!inp_file.files.length) {
        message.innerText = 'No File Selected !!';
        return;
    }
    if (inp_file.files[0].name.split('.').pop() !== 'csv') {
        message.innerText = 'Only CSV files are allowed !!';
        return;
    }
    showAndHideLoader(true);
    Papa.parse(
        inp_file.files[0],
        {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                proceedWithData(results.data);
            }
        }
    );

}

function showFormattedDataInPage(jsonData) {
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


async function proceedWithData(excelData) {
    if (!excelData.length) {
         showAndHideLoader(false);
         message.innerText = 'Empty file !!';
        return;
    }
    formattedData = await (Object.values(excelData).map((d, index) => {
        const { Project, User, Task, ...neededData } = d;
        return {
            'Serial No': index + 1,
            'Date': neededData?.Date || neededData?.date || 'Not Found',
            'Ticket #': Task?.substring(Task?.indexOf('PRTH')),
            'Ticket Title': Task || 'No Data Found',
            'Status': '',
            ...neededData,
        }
    }));
    showFormattedDataInPage(formattedData);
}

function downloadExcelFile() {
    if (formattedData.length) {
        exportWorksheet(formattedData);
    } else {
        message.innerText = 'Please select a file again, to continue ...';
    }
}