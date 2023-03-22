const file_inp = document.getElementById('file_inp');
const upload = document.getElementById('upload');
const table = document.querySelector(".table");
let formattedData = [];


upload.addEventListener('click', () => {
    PapaParse(file_inp);
});


function PapaParse(inp_file) {
    let arrayobj = [];
    Papa.parse(
        inp_file.files[0],
        {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                arrayobj = results.data;
                proceedWithData(arrayobj);
            }
        }
    );

}

function showInPage(jsonData) {
    let myWorkSheet = XLSX.utils.json_to_sheet(jsonData);

    // showing in html
    let html = XLSX.utils.sheet_to_html(myWorkSheet);
    table.innerHTML = `
                    ${html}`;
}

function exportWorksheet(jsonObject) {
    var myFile = "myFile.xlsx";
    var myWorkSheet = XLSX.utils.json_to_sheet(jsonObject);
    var myWorkBook = XLSX.utils.book_new();

    // showing in html
    let html = XLSX.utils.sheet_to_html(myWorkSheet);
    table.innerHTML = `
                    ${html}`;

    XLSX.utils.book_append_sheet(myWorkBook, myWorkSheet, "myWorkSheet");
    XLSX.writeFile(myWorkBook, myFile);
}


// display function
const tbody = document.getElementById('tbody');

async function proceedWithData(excelData) {
    formattedData = await (Object.values(excelData).map((d, index) => {
        return {
            'Serial No': index + 1,
            'Date': d.date,
            'Ticket #': d.Task.substring(d.Task.indexOf('PRTH')),
            ...d,
        }
    }));
    showInPage(formattedData);
}

function download() {
    if (formattedData.length) {
        exportWorksheet(formattedData);
    } else {
        console.error('No Data');
    }
}