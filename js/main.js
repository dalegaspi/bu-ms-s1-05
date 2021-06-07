/**
 * main app - using MVC pattern
 *
 * @author dlegaspi@bu.edu
 */

'use strict';

const JSON_DATA_URL = 'json/edu.min.json';

// simulate a delay in fetch...set to 0 to remove delay
const SIMULATE_DATA_DELAY_MS = 1000;

/**
 * model
 */
class EducationHistoryModel {
    constructor() {
    }

    /**
     * use AJAX to asynchronously get the data then use callback to update view
     *
     */
    getData() {
        return fetch(JSON_DATA_URL)
            .then(value => new Promise(resolve => {
                    setTimeout(() => {
                        resolve(value);
                    }, SIMULATE_DATA_DELAY_MS);
                })
            )
            .then(response => {
                console.log('Data retrieval successful.')
                return response.json();
            })
            .then(data => {
                this.history = data;
                this.history.lastRequest = new Date();

                // callback to kick off the view rendering via the controller
                this.getDataCallback(this.history);
            })
            .catch((error) => {
                console.error('Error: ', error);
            });
    }

    bindGetDataCallback(callback) {
        this.getDataCallback = callback;
    }
}

/**
 * view 1
 */
class HtmlView {
    constructor() {
    }

    convertToTableHeaders(headers) {
        return '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    }

    convertToTableRow(datarow) {
        return '<tr>' + Object.values(datarow).map(d => `<td>${d}</td>`).join('') + '</tr>';
    }

    convertToTableRows(datarows) {
        return datarows.map(d => this.convertToTableRow(d)).join('')
    }

    async emit(data) {
        let loader = document.getElementById("loadingIcon").style.display = 'none';

        let table = document.getElementById("education");

        // modify caption
        let caption = table.caption;
        caption.innerText = data.title;

        // header
        let theader = table
            .getElementsByTagName("thead")
            .item(0);
        theader.innerHTML = this.convertToTableHeaders(data.headers);

        // body
        let tbody = table
            .getElementsByTagName("tbody")
            .item(0);
        tbody.innerHTML = this.convertToTableRows(data.data);

        // footer
        let tfooter = document.getElementById("tableDataTS");
        tfooter.innerText = `Data generated on ${data.lastRequest}`;

        // fade-in the table
        let tcontainer = document.getElementById("tableContainer");
        tcontainer.classList.toggle('fade');
    }
}

/**
 * view 2
 */
class ConsoleView {
    constructor() {
    }

    /**
     * creates MarkDown table
     *
     * @param data
     * @returns {string}
     */
    createMarkdownTable(data) {
        return [
            `| ${data.headers.join(' | ')} |`,
            `| ${data.headers.map(h => '-'.repeat(h.length)).join(' | ')} |`,
            data.data.map(d => `| ${Object.values(d).join(' | ')} |`).join('\n')
        ].join(`\n`);
    }

    async emit(data) {
        // create the text table
        const table = this.createMarkdownTable(data);
        console.log(`${data.title} (Markdown)\n\n${table}\n`);
    }
}

/**
 * controller
 */
class Controller {
    constructor(model, views) {
        this.model = model;
        this.views = views;

        // bind the callback
        this.model.bindGetDataCallback(this.dataFetchCallback);
    }

    process() {
        // get the data
        this.model.getData();
    }

    dataFetchCallback = async (data) => {
        await Promise.all(
            // call the emit for each view asynchronously to avoid blocking
            this.views.map(v => {
                try {
                    v.emit(data);
                } catch (err) {
                    console.error("An error has occurred", err);
                }
            }));
    }
}

// entry point
const app = new Controller(new EducationHistoryModel(), [new HtmlView(), new ConsoleView()]);
app.process();