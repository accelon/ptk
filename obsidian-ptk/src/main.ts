import { Plugin } from "obsidian";
import {PtkCustomView} from "./ptkview";
import { PtkEmbed } from "./ptkembed";
const VIEW_TYPE_PTK = "ptk-custom-view";

export default class PtkPlugin extends Plugin {
  override async onload() {
    // 把 .ptk 注册为「文本/Markdown 视图」
    // 这样 Obsidian 会用内置编辑器打开
    this.registerExtensions(["ptk"], VIEW_TYPE_PTK);

    this.registerView(
      VIEW_TYPE_PTK,
      (leaf) => new PtkCustomView(leaf)
    );

    this.registerMarkdownPostProcessor((el, ctx) => {
      // 找所有 ![[xxx.ptk#...]]
      const embeds = el.querySelectorAll('.internal-embed[src*=".ptk"]');
      embeds.forEach(embedEl => {
        const src = embedEl.getAttribute("src") || "";
        const [filePath, hashtag] = src.split("#");
        const file = this.app.vault.getFileByPath(filePath);
        if (!file) return;

        // 替换成我们自己的渲染
        new PtkEmbed(this.app, embedEl, file, hashtag);
      });
    });

    console.log("PTK plugin loaded: .ptk registered as text file!!");
  }

  async onunload() {
    console.log("PTK plugin unloaded");
  }
}