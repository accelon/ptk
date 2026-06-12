import { App, TFile } from "obsidian";
import {openPtk} from "../../basket/openptk"
import {enableAccelon23Features} from '../../basket/features'

export class PtkEmbed {
  constructor(
    private app: App,
    private el: HTMLElement,
    private file: TFile,
    private hashtag: string
  ) {
    this.render();
  }

  async render() {
    // 1. 拿到参数
    const rawBytes = await this.app.vault.readBinary(this.file);
    const filename=this.file.path.match(/([a-z\-_]+)\.ptk$/)[1];
    const ptk=await openPtk(filename,rawBytes);
    enableAccelon23Features(ptk);
    const pageContent=await ptk.fetchAddress(this.hashtag.replaceAll(':','#'));

    this.el.empty();
    const container = this.el.createDiv({
      cls: "ptk-embed-container",
      attr: { style: `user-select:text;  padding:1em;` }
    });
    container.createEl("div", { text: pageContent });

  }
}