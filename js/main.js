/**
 * main app - using MVC pattern
 *
 * @author dlegaspi@bu.edu
 */

'use strict';

// same as json/edu.json, only minified
const JSON_DATA_URL = 'json/edu.min.json';

// simulate a delay in fetch...set to 0 to remove delay
const SIMULATE_DATA_DELAY_MS = 1500;

/**
 * model
 */
class EducationHistoryModel {
    constructor() {
    }

    /**
     * use AJAX to asynchronously get the data then use callback to update view
     *
     * we are using the Fetch API instead of XMLHttpRequest to take advantage
     * of Promise objects instead of callback hell.
     */
    getData() {
        return fetch(JSON_DATA_URL)
            .then(value => new Promise(resolve => {
                    // introduce delay, but do not block
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

    /**
     * in a true MVC pattern, Model does not talk to View directly, it only sends "events".
     * this binds the "data retrieved successfully event" to a controller callback to
     * have the corresponding components in the view updated
     *
     * @param callback
     */
    bindGetDataCallback(callback) {
        this.getDataCallback = callback;
    }
}

/**
 * view 1: HTML Table
 */
class HtmlView {
    constructor() {
    }

    /**
     * convenience method for wrapping text/html with a tag
     *
     * @param el
     * @param inner
     * @returns {string}
     */
    wrapWithElement(el, inner) {
        return `<${el}>${inner}</${el}>`
    }

    /**
     * set display: none
     *
     * @param elementId
     */
    hideElement(elementId) {
        document.getElementById(elementId).style.display = 'none';
    }

    /**
     * show element with the specified display attribute
     * @param elementId
     * @param showMode
     */
    showElement(elementId, showMode) {
        document.getElementById(elementId).style.display = showMode;
    }

    /**
     * return the first child for the matched tag
     *
     * @param element
     * @param tagId
     * @returns {*}
     */
    getFirstChildWithTag(element, tagId) {
        return element
            .getElementsByTagName(tagId)
            .item(0);
    }

    /**
     * table headers
     *
     * @param headers
     * @returns {string}
     */
    convertToTableHeaders(headers) {
        return this.wrapWithElement('tr',
            headers.map(h => this.wrapWithElement('th', h)).join(''));
    }

    /**
     * create one table row from one record
     *
     * @param record
     * @returns {string}
     */
    convertToTableRow(record) {
        return this.wrapWithElement('tr',
            Object.values(record).map(d => this.wrapWithElement('td', d)).join(''));
    }

    /**
     * convert the data records into HTML table rows
     *
     * @param datarows
     * @returns {*}
     */
    convertToTableRows(datarows) {
        return datarows.map(d => this.convertToTableRow(d)).join('')
    }

    initLoadingData() {
        // this is kicked off as JSON fetched is loaded from server
        // the "loading icon" is for effect, but since it's very fast, we need
        // to simulate a delay to show it.
        this.showElement('loadingIcon', 'block');

        // the caveat is displayed when SIMULATE_DATA_DELAY_MS > 0
        if (SIMULATE_DATA_DELAY_MS > 0) {
            document.getElementById('mutedLoadingText').innerText =
                `This has a simulated data load delay of ${SIMULATE_DATA_DELAY_MS / 1000} second(s).`
            this.showElement('mutedLoadingText', 'block');
        }
    }

    bindLoadTableEventListener(handler) {
        document.getElementById('loadTableButton').addEventListener('click', handler);
    }

    async emit(data) {
        // hide loader icon and load button and texts
        this.hideElement('loadingIcon');
        this.hideElement('loadTableButton');
        this.hideElement('mutedLoadingText');

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
 * view 2: JS Console with Markdown
 */
class ConsoleView {
    constructor() {
    }

    bindLoadTableEventListener(handler) {
        console.log(`binding ${handler} to nothing`);
    }

    /**
     * create markdown table header
     *
     * @param headers
     * @returns {string[]}
     */
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

    initLoadingData() {
        console.log("loading...");
    }

    async emit(data) {
        // create the text MD table
        const table = this.createMarkdownTable(data);
        console.log(`${data.title} (Markdown)\n\n${table}\n`);
    }
}

/**
 * Controller
 */
class Controller {

    /**
     * Inversion of Control
     *
     * @param model
     * @param views
     */
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
        this.views.forEach(v => v.initLoadingData());
        this.model.getData();
    }

    /**
     * the uses of async/await here is a bit contrived since dataset to render is so small,
     * but it basically shows good practice that rendering of UI should not block.
     *
     * @param data
     * @returns {Promise<void>}
     */
    dataFetchCallback = async (data) => {
        await Promise.all(
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
