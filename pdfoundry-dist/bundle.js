(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFoundryAPI = exports.PDFoundryAPIError = void 0;
const PDFSettings_1 = require("../settings/PDFSettings");
const PDFViewerWeb_1 = require("../viewer/PDFViewerWeb");
class PDFoundryAPIError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.PDFoundryAPIError = PDFoundryAPIError;
class PDFoundryAPI {
    /**
     * Register your system with the API.
     * @param system The module YOU are calling this from.
     */
    static registerSystem(system) {
        return __awaiter(this, void 0, void 0, function* () {
            PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME = system;
        });
    }
    /**
     * Get an object containing the user specified PDF data for a specific PDF code.
     * @param code
     */
    static getPDFData(code) {
        const entity = game.items.find((item) => {
            return item.data.type === PDFSettings_1.PDFSettings.PDF_ENTITY_TYPE && item.data.data.code === code;
        });
        if (entity === undefined || entity === null) {
            return null;
        }
        const data = entity.data.data;
        if (data.offset === '') {
            data.offset = 0;
        }
        data.offset = parseInt(data.offset);
        return data;
    }
    /**
     * Open a PDF by code to the specified page.
     * @param code
     * @param page
     */
    static open(code, page = 1) {
        const pdf = this.getPDFData(code);
        if (pdf === null) {
            throw new PDFoundryAPIError(`Unable to find a PDF with the code "${code}. Did the user declare it?`);
        }
        const { url, offset } = pdf;
        // coerce to number; safety first
        page = offset + parseInt(page.toString());
        this.openURL(`${window.origin}/${url}`, page);
    }
    /**
     * Open a PDF by URL to the specified page.
     * @param url
     * @param page
     */
    static openURL(url, page = 1) {
        if (url === undefined) {
            throw new PDFoundryAPIError('Unable to open PDF; "url" must be defined');
        }
        // coerce to number; safety first
        page = parseInt(page.toString());
        if (isNaN(page) || page <= 0) {
            throw new PDFoundryAPIError(`Page must be > 0 but ${page} was given.`);
        }
        new PDFViewerWeb_1.PDFViewerWeb(url, page).render(true);
    }
}
exports.PDFoundryAPI = PDFoundryAPI;

},{"../settings/PDFSettings":4,"../viewer/PDFViewerWeb":6}],2:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFSourceSheet = void 0;
const PDFSettings_1 = require("../settings/PDFSettings");
const PDFoundryAPI_1 = require("../api/PDFoundryAPI");
/**
 * Extends the base ItemSheet for linked PDF viewing.
 */
class PDFSourceSheet extends ItemSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet', 'item'];
        options.width = 650;
        options.height = 'auto';
        return options;
    }
    get template() {
        return `systems/${PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings_1.PDFSettings.DIST_FOLDER}/templates/pdf-sheet.html`;
    }
    /**
     * Helper method to get a id in the html form
     * html ids are prepended with the id of the item to preserve uniqueness
     *  which is mandatory to allow multiple forms to be open
     * @param html
     * @param id
     */
    getByID(html, id) {
        return html.parent().parent().find(`#${this.item._id}-${id}`);
    }
    activateListeners(html) {
        super.activateListeners(html);
        this.addGithubLink(html);
        const urlInput = this.getByID(html, 'data\\.url');
        const offsetInput = this.getByID(html, 'data\\.offset');
        // Block enter from displaying the PDF
        html.find('input').on('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        });
        console.log(this.getByID(html, 'pdf-test'));
        // Test button
        this.getByID(html, 'pdf-test').on('click', function (event) {
            event.preventDefault();
            let urlValue = urlInput.val();
            let offsetValue = offsetInput.val();
            if (urlValue === null || urlValue === undefined)
                return;
            if (offsetValue === null || offsetValue === undefined)
                return;
            urlValue = `${window.location.origin}/${urlValue}`;
            if (offsetValue.toString().trim() === '') {
                offsetValue = 0;
            }
            offsetValue = parseInt(offsetValue);
            PDFoundryAPI_1.PDFoundryAPI.openURL(urlValue, 5 + offsetValue);
        });
        // Browse button
        this.getByID(html, 'pdf-browse').on('click', function (event) {
            return __awaiter(this, void 0, void 0, function* () {
                event.preventDefault();
                const fp = new FilePicker({});
                // @ts-ignore TODO: foundry-pc-types
                fp.extensions = ['.pdf'];
                fp.field = urlInput[0];
                let urlValue = urlInput.val();
                if (urlValue !== undefined) {
                    const result = yield fp.browse(urlValue.toString().trim());
                }
                fp.render(true);
            });
        });
    }
    addGithubLink(html) {
        const h4 = html.parent().parent().find('header.window-header h4.window-title');
        const next = h4.next()[0].childNodes[1].textContent;
        if (next && next.trim() === 'PDFoundry') {
            return;
        }
        const url = 'https://github.com/Djphoenix719/PDFoundry';
        const style = 'text-decoration: none';
        const icon = '<i class="fas fa-external-link-alt"></i>';
        const link = $(`<a style="${style}" href="${url}">${icon} PDFoundry</a>`);
        h4.after(link);
    }
}
exports.PDFSourceSheet = PDFSourceSheet;

},{"../api/PDFoundryAPI":1,"../settings/PDFSettings":4}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PDFoundryAPI_1 = require("./api/PDFoundryAPI");
const PDFSettings_1 = require("./settings/PDFSettings");
CONFIG.debug.hooks = true;
// Register UI accessor
Hooks.on('init', function () {
    // @ts-ignore
    ui.PDFoundry = PDFoundryAPI_1.PDFoundryAPI;
});
Hooks.once('ready', PDFSettings_1.PDFSettings.registerPDFSheet);
Hooks.on('preCreateItem', PDFSettings_1.PDFSettings.preCreateItem);
Hooks.on('getItemDirectoryEntryContext', PDFSettings_1.PDFSettings.getItemContextOptions);

},{"./api/PDFoundryAPI":1,"./settings/PDFSettings":4}],4:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFSettings = void 0;
const PDFItemSheet_1 = require("../app/PDFItemSheet");
const PDFoundryAPI_1 = require("../api/PDFoundryAPI");
/**
 * Internal settings and helper methods for PDFoundry.
 */
class PDFSettings {
    /**
     * Register the PDF sheet and unregister invalid sheet types from it.
     */
    static registerPDFSheet() {
        //  static unregisterSheet(scope, sheetClass, {types=[]}={}) {
        Items.unregisterSheet(PDFSettings.INTERNAL_MODULE_NAME, 'SR5ItemSheet', {
            types: [PDFSettings.PDF_ENTITY_TYPE],
        });
        Items.registerSheet(PDFSettings.INTERNAL_MODULE_NAME, PDFItemSheet_1.PDFSourceSheet, {
            types: [PDFSettings.PDF_ENTITY_TYPE],
            makeDefault: true,
        });
        // Unregister all other item sheets for the PDF entity
        const pdfoundryKey = `${PDFSettings.INTERNAL_MODULE_NAME}.${PDFItemSheet_1.PDFSourceSheet.name}`;
        const sheets = CONFIG.Item.sheetClasses[PDFSettings.PDF_ENTITY_TYPE];
        for (const key of Object.keys(sheets)) {
            const sheet = sheets[key];
            // keep the PDFoundry sheet
            if (sheet.id === pdfoundryKey) {
                continue;
            }
            // id is MODULE.CLASS_NAME
            const [module] = sheet.id.split('.');
            Items.unregisterSheet(module, sheet.cls, {
                types: [PDFSettings.PDF_ENTITY_TYPE],
            });
        }
    }
    /**
     * Setup default values for pdf entities
     * @param entity
     * @param args ignored args
     */
    static preCreateItem(entity, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entity.type !== PDFSettings.PDF_ENTITY_TYPE) {
                return;
            }
            entity.img = `systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/assets/pdf_icon.svg`;
        });
    }
    /**
     * Helper method to grab the id from the html object and return an item
     * @param html
     */
    static getItemFromContext(html) {
        const id = html.data('entity-id');
        return game.items.get(id);
    }
    /**
     * Get additional context menu icons for PDF items
     * @param html
     * @param options
     */
    static getItemContextOptions(html, options) {
        options.splice(0, 0, {
            name: 'Open PDF',
            icon: '<i class="far fa-file-pdf"></i>',
            condition: (entityHtml) => {
                const item = PDFSettings.getItemFromContext(entityHtml);
                if (item.type !== PDFSettings.PDF_ENTITY_TYPE) {
                    return false;
                }
                const { code, url } = item.data.data;
                return code !== '' && url !== '';
            },
            callback: (entityHtml) => {
                const item = PDFSettings.getItemFromContext(entityHtml);
                const { code } = item.data.data;
                PDFoundryAPI_1.PDFoundryAPI.open(code);
            },
        });
    }
}
exports.PDFSettings = PDFSettings;
PDFSettings.DIST_FOLDER = 'pdfoundry-dist';
PDFSettings.EXTERNAL_SYSTEM_NAME = '../modules/pdfoundry';
PDFSettings.INTERNAL_MODULE_NAME = 'PDFoundry';
PDFSettings.PDF_ENTITY_TYPE = 'PDFoundry_PDF';

},{"../api/PDFoundryAPI":1,"../app/PDFItemSheet":2}],5:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFViewerBase = void 0;
class PDFViewerBase extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'pdf-viewer';
        options.classes = ['app', 'window-app'];
        options.title = 'View PDF';
        options.width = 8.5 * 100 + 64;
        options.height = 11 * 100 + 64;
        options.resizable = true;
        return options;
    }
    activateListeners(html) {
        const _super = Object.create(null, {
            activateListeners: { get: () => super.activateListeners }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.activateListeners.call(this, html);
            this.m_Frame = html.parents().find('iframe.pdfViewer').first().get(0);
        });
    }
    close() {
        // @ts-ignore
        const pva = this.m_Frame.contentWindow.PDFViewerApplication;
        console.log(pva);
        pva.cleanup();
        return super.close();
    }
}
exports.PDFViewerBase = PDFViewerBase;

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFViewerWeb = void 0;
const PDFViewerBase_1 = require("./PDFViewerBase");
const PDFSettings_1 = require("../settings/PDFSettings");
class PDFViewerWeb extends PDFViewerBase_1.PDFViewerBase {
    constructor(file, page) {
        super();
        this.m_FilePath = encodeURIComponent(file);
        this.m_Page = page;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = `systems/${PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME}/pdfoundry-dist/templates/web-viewer-app.html`;
        return options;
    }
    getData(options) {
        const data = super.getData(options);
        data.page = this.m_Page;
        data.filePath = this.m_FilePath;
        data.systemName = PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME;
        return data;
    }
}
exports.PDFViewerWeb = PDFViewerWeb;

},{"../settings/PDFSettings":4,"./PDFViewerBase":5}]},{},[3]);