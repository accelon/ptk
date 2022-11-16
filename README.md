# PTK
Accelon 的 backend

## Basic cli commands

type `ptk` to see available commands

## 模塊

### LineBase 行基數據庫

* 每一行結構完整，標籤不跨行。
* 滿64K 字成一頁，存成一個 jsonp 的文件，即使只要一行，也會讀入該頁。
* 內存形態是頁緩存塊，不拆分成小字符串。

### Offtext 離文式

* 內存形態為一字符串（正字串）及標記陣列。而非樹狀結構。
* 標籤有名字，屬性值構成。屬性值以< > 包住。
* 簡單屬性(id, 地址及字距) 不必以< >包住。
* 字距表示標籤作用的範圍，以終字及字數兩種方式表達。
* 直持交疊標記。增刪標記不改變正字串。

### LineView 行基彩現

* 文字拆分成彩現單元，每個單元有各自的classList。
* 行區間以 Lisp 巢狀結構表達，容易自由組合。

## Editor 編輯器

* 基於CodeMirror，有錯誤即時反饋。

## 源文件

* .off 為 Offtext 文件，人工編輯
* .tsv .csv 為表格式文件，原則上機器產生，不人工編輯。
* .css 樣式文件。

## 打包

* jsonp文件夾  含LineBase 所有分頁文件
* ptk文件      以zip 格式為容器，可含多個 jsonp 文件夾。
* com文件      ptk 文件 加跨平台網頁服務器。



## 文件夾

## ptk js
   如果 ptk name 和 目錄同名，可將源文件放在 off

## ptk js name
   源文件在  name.offtext 或 name.src 
   但ptk 名字會根據 0.off 中指定

   詳見 bin.js::build


## 平行語料庫

資料庫有相同前綴 ，如 cs , cs-en 。
或者在 directive 指定 align=cs  ( see pool.ts::poolParallelPitakas)