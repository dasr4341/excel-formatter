const fileInput = document.querySelector('.file-input');
const tableHeader = document.querySelector(".preview-header-section");
const table = document.querySelector(".table-to-copy");
const message = document.querySelector(".message");
const loader = document.querySelector(".custom-loader");
const copyBtn = document.querySelector(".copy-btn");
const fileUploadBanner = document.querySelector(".file-upload-banner").getElementsByTagName('span')[0];

loader.style.display = 'none';
message.style.display = 'none';
tableHeader.style.display = 'none';

let formattedData = [];


// ------------------------ helper starts -------------------------
function showErrorMessage(errTxt) {
    message.innerText = errTxt;
    message.style.display = 'block';
}

function downloadExcelFile() {
    if (formattedData.length) {
        exportWorksheet(formattedData);
    } else {
        showErrorMessage('Please select a file, to continue ...');
    }
}

function showAndHideLoader(status) {
    loader.style.display = status ? 'flex' : 'none';
}

function showFormattedDataInPage(jsonData) {
    tableHeader.style.display = 'flex';
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

function toggleTheme() {
    document.body.classList.toggle('dark');
}
//  ---------------------------- helper ends--------------------------------

// ----------------------------- event listener start --------------------

document.querySelector('.file-upload-banner').addEventListener('click', () => {
    fileInput.click();
})

fileInput.addEventListener('change', (e) => {
    if (!!e.target.files.length) {
        fileUploadBanner.innerHTML = e.target.files[0].name;
        message.style.display = 'none';
    }
})

document.getElementById('upload').addEventListener('click', () => {
    csvFileParser(fileInput);
});

document.querySelector('.download-btn').addEventListener('click', downloadExcelFile)
document.querySelector('.theme-toggler').addEventListener('click', toggleTheme)

copyBtn.addEventListener('click', () => {
    if (!formattedData.length) {
        showErrorMessage('Nothing to Copy, please upload a excel to copy !!');
        return;
    }

    // create a Range object
    const range = document.createRange();
    // set the Node to select the "range"
    range.selectNode(table);

    // add the Range to the set of window selections
    window.getSelection().addRange(range);

    // execute 'copy', can't 'cut' in this case
    document.execCommand('copy');
    copyBtn.classList.add("active");
    // copyBtn.getElementsByTagName('span')[0].innerText = 'Copied'
    window.getSelection().removeAllRanges();
    setTimeout(() => {
        copyBtn.classList.remove("active");
    }, 500)
});

(function () {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    if (darkThemeMq.matches) {
        // Theme set to dark.
        toggleTheme();
    }
})()

// ----------------------------- event listener ends --------------------



function csvFileParser(inp_file) {
    if (!inp_file.files.length) {
        showErrorMessage('No File Selected !!');
        return;
    }
    if (inp_file.files[0].name.split('.').pop() !== 'csv') {
        showErrorMessage('Only CSV files are allowed !!')
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

async function proceedWithData(excelData) {
    if (!excelData.length) {
        showAndHideLoader(false);
        table.innerHTML = '';
        formattedData = [];
        showErrorMessage('Empty file !!');
        return;
    }
    formattedData = [];
    const jsonData = await (Object.values(excelData).filter(d => d.Project.toLowerCase().includes('jira')).map((d, index) => {
        const { Project, User, Task, ...neededData } = d;

        // task date
        const date = (neededData?.Date || neededData?.date) ? new Date(neededData?.Date || neededData?.date) : null;
        const formattedDate = date ? `${date.getMonth()}/${date.getDate()}/${date.getFullYear()}` : 'Not Found';

        const hrs = neededData['HRS (Digital)'] ? neededData['HRS (Digital)'].split(':') : null;

        return {
            'Serial No': index + 1,
            'Date': formattedDate,
            'Ticket #': Task?.substring(Task?.indexOf('PRTH')),
            'Ticket Title': Task || 'No Data Found',
            'Status': '',
            // ...neededData
            'HRS (Digital)': hrs ? `${hrs[0]}:${hrs[1]}` : 'Not Found',
        };
    }));

    let prevDate = '';
    jsonData.forEach((d, index) => {


        // const hrs = d['HRS (Digital)'] ? d['HRS (Digital)'].split(':') : null;
        // TODO : hour
        // if (!!hrs && hrs[0] < 1 && prevDate !== '' && prevDate === d.Date && !!index) {
        //     console.log(formattedData, d, hrs, formattedData[index - 1], index);
        //     const obj = formattedData[index - 1];
        //     console.log(obj);
        //     const currentTaskHrs = obj['HRS (Digital)'] ? obj['HRS (Digital)'].split(':') : [0, 0];

        //     let currentHour = Number(currentTaskHrs[0]) + Number(hrs[0]);
        //     let currentMinutes = Number(currentTaskHrs[1]) + Number(hrs[1]);


        //     if (currentMinutes >= 60) {
        //         const h = Math.round(currentMinutes / 60);
        //         currentHour += h;
        //         currentMinutes  = 0;
        //     }

        //     obj['Ticket #'] = `${obj['Ticket #']}, ${d['Ticket #']}`
        //     obj['Ticket Title'] = `${obj['Ticket Title']}, ${d['Ticket Title']}`
        //     obj['HRS (Digital)'] = `${currentHour}:${currentMinutes}`

        //     return;
        // } 
        if (prevDate !== '' && d?.Date !== prevDate) {
            formattedData.push({
                'HRS (Digital)': '',
                'Date': '',
                'Serial No': '',
                'Status': '',
                'Ticket #': '',
                'Ticket Title': ''
            });
        }

        if (prevDate !== '' && d?.Date === prevDate) {
            formattedData.push({
                'Serial No': d['Serial No'],
                'Date': '',
                'Ticket #': d['Ticket #'],
                'Ticket Title': d['Ticket Title'],
                'Status': d['Status'],
                'HRS (Digital)': d['HRS (Digital)'],
            });
        } else {
            formattedData.push(d);
        }

        prevDate = d.Date;
    });

    showFormattedDataInPage(formattedData);
}

// old template format
async function proceedWithDataOldFormat(excelData) {
    if (!excelData.length) {
        showAndHideLoader(false);
        table.innerHTML = '';
        formattedData = [];
        showErrorMessage('Empty file !!');
        return;
    }
    formattedData = [];
    const jsonData = await (Object.values(excelData).filter(d => d.Project.toLowerCase().includes('jira')).map((d, index) => {
        const { Project, User, Task, ...neededData } = d;
        return {
            'Serial No': index + 1,
            'Date': neededData?.Date || neededData?.date || 'Not Found',
            'Ticket #': Task?.substring(Task?.indexOf('PRTH')),
            'Ticket Title': Task || 'No Data Found',
            'Status': '',
            ...neededData,
        };
    }));

    let prevDate = '';
    jsonData.forEach(d => {
        if (prevDate !== '' && d?.Date !== prevDate) {
            formattedData.push({
                'HRS (Digital)': '',
                'Date': '',
                'Serial No': '',
                'Status': '',
                'Ticket #': '',
                'Ticket Title': ''
            });
        }
        formattedData.push(d);
        prevDate = d.Date;
    });
    showFormattedDataInPage(jsonData);
}


Papa.parse(
    './excel.csv',
    {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            proceedWithData(results.data);
        }
    }
);