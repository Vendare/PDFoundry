/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Settings from '../settings/Settings';
import EventStore from '../common/helpers/events';
import { PDFViewerEvent } from '../common/types/PDFHooks';
import { PDFjsViewer } from '../common/types/PDFjsViewer';
import { PDFjsEventBus } from '../common/types/PDFjsEventBus';
import { BUTTON_GITHUB } from '../common/helpers/header';

export default abstract class BaseViewer extends Application {
    // <editor-fold desc="Static Properties">

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['app', 'window-app', 'pdfoundry-viewer'];
        options.template = `${Settings.PATH_TEMPLATES}/app/viewer/static.html`;
        options.title = game.i18n.localize('PDFOUNDRY.VIEWER.ViewPDF');
        options.width = 8.5 * 100 + 64;
        options.height = 11 * 100 + 64;
        options.resizable = true;
        return options;
    }

    // </editor-fold>
    // <editor-fold desc="Properties">

    protected _frame: HTMLIFrameElement;
    protected _viewer: PDFjsViewer;
    protected _eventBus: PDFjsEventBus;
    protected _eventStore: EventStore<PDFViewerEvent>;

    // </editor-fold>
    // <editor-fold desc="Constructor & Initialization">

    protected constructor(options?: ApplicationOptions) {
        super(options);
        this._eventStore = new EventStore<PDFViewerEvent>();
    }

    // </editor-fold>
    // <editor-fold desc="Instance Methods"></editor-fold>

    // <editor-fold desc="Getters & Setters">

    /**
     * Get the currently viewed page.
     */
    public get page() {
        return this._viewer.page;
    }

    /**
     * Set the currently viewed page.
     * @param value
     */
    public set page(value: number) {
        this._viewer.page = value;
    }

    public get title(): string {
        return game.i18n.localize('PDFOUNDRY.VIEWER.ViewPDF');
    }

    // </editor-fold>

    // <editor-fold desc="Foundry Overrides">

    protected _getHeaderButtons(): any[] {
        const buttons = super._getHeaderButtons();
        buttons.unshift(BUTTON_GITHUB);
        return buttons;
    }

    public getData(options?: any): any | Promise<any> {
        const data = super.getData(options);
        data.viewerFramePath = `${Settings.PATH_PDFJS}/web/viewer.html`;
        return data;
    }

    protected async activateListeners(html: JQuery): Promise<void> {
        this._eventStore.fire('viewerOpening', this);
        super.activateListeners(html);

        this._frame = html.parent().find('iframe.pdfViewer').get(0) as HTMLIFrameElement;
        this.getViewer().then(async (viewer) => {
            this._viewer = viewer;

            this._eventStore.fire('viewerOpened', this);

            this.getEventBus().then((eventBus) => {
                this._eventBus = eventBus;
                this._eventBus.on('pagerendered', this.onPageRendered.bind(this));
                this._eventBus.on('pagechanging', this.onPageChanging.bind(this));
                this._eventBus.on('updateviewarea', this.onViewAreaUpdated.bind(this));
                this._eventBus.on('scalechanging', this.onScaleChanging.bind(this));

                // const listeners = eventBus._listeners;
                // for (const eventName of Object.keys(listeners)) {
                //     eventBus.on(eventName, (...args) => {
                //         Viewer.logEvent(eventName, args);
                //     });
                // }

                this._eventStore.fire('viewerReady', this);
            });
        });

        // _getHeaderButtons does not permit titles...
        $(html).parents().parents().find('.pdf-sheet-show-players').prop('title', game.i18n.localize('PDFOUNDRY.VIEWER.ShowToPlayersTitle'));
    }

    // </editor-fold>

    // <editor-fold desc="Events">

    protected onPageChanging(event) {
        this._eventStore.fire('pageChanging', this, {
            pageLabel: event.pageLabel,
            pageNumber: event.pageNumber,
        });
    }

    protected onPageRendered(event) {
        this._eventStore.fire('pageRendered', this, {
            pageNumber: event.pageNumber,
            pageLabel: event.source.pageLabel,
            width: event.source.width,
            height: event.source.height,
            rotation: event.source.rotation,
            scale: event.source.scale,
            canvas: event.source.canvas,
            div: event.source.div,
            error: event.source.error,
        });
    }

    protected onViewAreaUpdated(event) {
        this._eventStore.fire('viewAreaUpdated', this, {
            top: event.location.top,
            left: event.location.left,
            pageNumber: event.location.pageNumber,
            rotation: event.location.rotation,
            scale: event.location.scale,
        });
    }

    protected onScaleChanging(event) {
        this._eventStore.fire('scaleChanging', this, {
            presetValue: event.presetValue,
            scale: event.scale,
        });
    }

    /**
     * Register a callback to occur when an event fires. See individual events for descriptions and use {@link Api.DEBUG.EVENTS} to log and analyze events.
     * @param eventName
     * @param callback
     */
    public on(eventName: PDFViewerEvent, callback: Function): void {
        this._eventStore.on(eventName, callback);
    }

    /**
     * Deregister an event that has been registered with {@link on} or {@link once}.
     * @param eventName
     * @param callback
     */
    public off(eventName: PDFViewerEvent, callback: Function): void {
        this._eventStore.off(eventName, callback);
    }

    /**
     * Like {@link on} but only fires on the next occurrence.
     * @param eventName
     * @param callback
     */
    public once(eventName: PDFViewerEvent, callback: Function): void {
        this._eventStore.once(eventName, callback);
    }

    // </editor-fold>

    // private static logEvent(key: string, ...args) {
    //     console.warn(key);
    //     console.warn(args);
    // }

    public async close(): Promise<any> {
        this._eventStore.fire('viewerClosed', this);

        return super.close();
    }

    /**
     * Wait for the internal PDFjs viewer to be ready and usable.
     */
    protected getViewer(): Promise<PDFjsViewer> {
        if (this._viewer) {
            return Promise.resolve(this._viewer);
        }

        return new Promise<any>((resolve) => {
            let timeout;
            const returnOrWait = () => {
                // If our window has finished initializing...
                if (this._frame) {
                    // If PDFjs has finished initializing...
                    if (this._frame.contentWindow && this._frame.contentWindow['PDFViewerApplication']) {
                        const viewer = this._frame.contentWindow['PDFViewerApplication'];
                        resolve(viewer);
                        return;
                    }
                }

                // If any ifs fall through, try again in a few ms
                timeout = setTimeout(returnOrWait, 5);
            };
            returnOrWait();
        });
    }

    /**
     * Wait for the internal PDFjs eventBus to be ready and usable.
     */
    protected getEventBus(): Promise<PDFjsEventBus> {
        if (this._eventBus) {
            return Promise.resolve(this._eventBus);
        }

        return new Promise<any>((resolve) => {
            this.getViewer().then((viewer) => {
                let timeout;
                const returnOrWait = () => {
                    if (viewer.eventBus) {
                        resolve(viewer.eventBus);
                        return;
                    }
                    timeout = setTimeout(returnOrWait, 5);
                };
                returnOrWait();
            });
        });
    }

    /**
     * Finish the download and return the byte array for the file.
     */
    public download(): Promise<Uint8Array> {
        return new Promise<Uint8Array>(async (resolve) => {
            const viewer = await this.getViewer();
            let timeout;
            const returnOrWait = () => {
                if (viewer.downloadComplete) {
                    resolve(viewer.pdfDocument.getData());
                    return;
                }

                timeout = setTimeout(returnOrWait, 50);
            };
            returnOrWait();
        });
    }

    /**
     * Open a PDF
     * @param pdfSource A URL or byte array to open.
     * @param page The initial page to open to
     */
    public async open(pdfSource: string | Uint8Array, page?: number) {
        const pdfjsViewer = await this.getViewer();

        if (page) {
            pdfjsViewer.initialBookmark = `page=${page}`;
        }

        await pdfjsViewer.open(pdfSource);
    }
}
