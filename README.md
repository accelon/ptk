# PTK
Accelon 的 backend

## 開發環境安裝
請用 [Accelon22](https://github.com/accelon/accelon22) 的 install-dev.cmd 安裝。
找不到 `ptk`  指令，請到 ptk 所在目錄，執行 `npm link` 

## 標記說明
[基礎標記](basicofftag.md)  [編輯環境設置](emeditor.md)

## 配合 .js 程式使用
因為 nodejs 無法直接執行 typescript ，執行 build-cjs.cmd，產生 nodebundle.cjs ，供轉檔程式 (gen.js)使用，每次更新都要執行一次。

## 基本指令
### 製作 js 版資料庫
   ptk js

### LineBase 行基數據庫
* 每一行結構完整，標籤不跨行。
* 滿64K 字成一頁，存成一個 jsonp 的文件，即使只要一行，也會讀入該頁。
* 內存形態是頁緩存塊，不拆分成小字符串。

### Offtext 離文式
* 內存形態為一字符串（底文）及標記陣列。而非樹狀結構。
* 標籤有名稱，屬性值構成。屬性值以< > 包住。
* 標籤以 ^ 開頭，名稱只能是小寫字母，不能含數字及符號。
* 簡單屬性(id, 地址及字距) 不必以< >包住。
* 字距表示標籤作用的範圍，以終字及字數兩種方式表達。
* 直持交疊標記。增刪標記不改變正字串。

### LineView 行基彩現(linebase rendering)
* 文字拆分成彩現單元，每個單元有各自的classList。
* 行區間以 Lisp 巢狀結構表達，容易自由組合。

## 源文件
* .off 為 Offtext 文件，人工編輯
* .tsv 為以Tab(0x09)分隔的表格式文件。
* .css 樣式文件。

## 打包
* jsonp文件夾   含LineBase 所有分頁文件(.js)，名稱與數據庫相同。
* .ptk文件      以zip 格式為容器，可含多個 jsonp 文件夾。
* .com文件      ptk 文件 加跨平台網頁服務器。


## ptk js
   如果 ptk name 和 目錄同名，可將源文件放在 off

## ptk js name
   源文件在  name.offtext 或 name.src 
   但ptk 名字會根據 0.off 中指定

   詳見 bin.js::build

## ptk dump 

   產生 cbeta-T24.txt
   ptk dump cbeta T/T24    

## 平行語料庫

資料庫有相同前綴 ，如 cs , cs-en 。
或者在 directive 指定 align=cs  ( see pool.ts::poolParallelPitakas)

## build scripts

    npm run build-browser  // load with script tag , window.PTK available

## ptk sent

    產生 sent.tsv ，常用句表