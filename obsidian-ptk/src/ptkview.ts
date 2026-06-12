import {TFile,  FileView , WorkspaceLeaf } from "obsidian";
import {openPtk} from "../../basket/openptk"
import {enableAccelon23Features} from '../../basket/features'
const VIEW_TYPE_PTK = "ptk-custom-view";
const PTK_VIEW_DISPLAY_NAME = "PTK 文档";
export class PtkCustomView extends FileView  {
  private customContainer: HTMLElement | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewData():string{
    return ''
  }

  override clear(){

  }
  // 视图唯一标识
  override getViewType(): string {
    return VIEW_TYPE_PTK;
  }

  // 标签页显示名称
  override getDisplayText(): string {
    return this.file?.name ?? PTK_VIEW_DISPLAY_NAME;
  }

  /**
   * 核心：文件内容 → 页面渲染 DOM
   * @param data 文件原始字符串
   */

  override async onLoadFile(file: TFile): Promise<void> {
    const rawBytes = await this.app.vault.readBinary(file);
    const filename=file.path.match(/([a-z\-_]+)\.ptk$/)[1];
    const ptk=await openPtk(filename,rawBytes);
    enableAccelon23Features(ptk);
    const t=await ptk.fetchAddress('bk#agmm.ck#m1.n1')
    this.render(t);
  }

  override async onOpen(): Promise<void> {

  }
  private render(content: string) {
    this.contentEl.style.userSelect = 'text';
    this.contentEl.empty();
    this.contentEl.createEl("pre", { text: 'hi' });
  }
  
  // 视图卸载清理
  onDestroy(): void {
    this.file = null;
    super.onDestroy();
  }
}