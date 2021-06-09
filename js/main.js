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
                this.history.lastRequest = new Date().toLocaleTimeString()

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

    wrapWithElement(el, inner) {
        return `<${el}>${inner}</${el}>`
    }

    hideElement(elementId) {
        document.getElementById(elementId).style.display = 'none';
    }

    getFirstChildWithTag(element, tagId) {
        return element
            .getElementsByTagName(tagId)
            .item(0);
    }

    convertToTableHeaders(headers) {
        return this.wrapWithElement('tr',
            headers.map(h => this.wrapWithElement('th', h)).join(''));
    }

    convertToTableRow(record) {
        return this.wrapWithElement('tr',
            Object.values(record).map(d => this.wrapWithElement('td', d)).join(''));
    }

    convertToTableRows(datarows) {
        return datarows.map(d => this.convertToTableRow(d)).join('')
    }

    init() {
        document.getElementById('loadingIcon').style.display = 'block';
    }

    bindLoadTableEventListener(handler) {
        document.getElementById('loadTableButton').addEventListener('click', handler);
    }

    async emit(data) {
        // hide loader icon and load button
        this.hideElement('loadingIcon');
        this.hideElement('loadTableButton');

        let table = document.getElementById('education');

        // modify caption
        let caption = table.caption;
        caption.innerText = data.title;

        // header
        let theader = this.getFirstChildWithTag(table, 'thead');
        theader.innerHTML = this.convertToTableHeaders(data.headers);

        // body
        let tbody = this.getFirstChildWithTag(table, 'tbody');
        tbody.innerHTML = this.convertToTableRows(data.data);

        // footer
        let tfooter = document.getElementById('tableDataTS');
        tfooter.innerText = `Data generated at ${data.lastRequest}`;

        // fade-in the table
        let tcontainer = document.getElementById('tableContainer');
        tcontainer.classList.toggle('fade');
    }
}

/**
 * view 2
 */
class ConsoleView {
    constructor() {
    }

    bindLoadTableEventListener(handler) {
        console.log(`binding ${handler} to nothing`);
    }

    markdownTableHeader(headers) {
        return [`| ${headers.join(' | ')} |`,
            `| ${headers.map(h => '-'.repeat(h.length)).join(' | ')} |`];
    }

    /**
     * creates MarkDown table
     *
     * @param data
     * @returns {string}
     */
    createMarkdownTable(data) {
        return [...this.markdownTableHeader(data.headers),
            data.data.map(d => `| ${Object.values(d).join(' | ')} |`).join('\n')
        ].join(`\n`);
    }

    init() {
        console.log("loading...");
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

        // bind the "load table" button
        this.views.forEach(v => v.bindLoadTableEventListener(() => this.process()));
    }

    process() {
        // get the data
        this.views.forEach(v => v.init());
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
