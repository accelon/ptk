# Predefine tags

每個 src file 都會引入，預設是 define=generic ，巴利及譯文是 define=cs

## Structural

### ak : artbulk ( single level grouping chunk and  fulltext )
     依搜尋相關性分，至少一個，如缺少自動加一 ak1

### bk : book   ( single level )
     依原書，如缺少自動加一 bk1

### ck : chunk  ( multilevel, compress if all number ) 
### n  : paragraph, named or unnamed ，非必要
### f   : footmark
### fn : footnote

### e  :  dictionary entry, many items

### h ：generic header
### zx ：toc tree

## inline
### ad：anno domini ^ad1974i30
### bc：Before Christ 

source file , 相同結構 ( offtext or tsv) , 重置 ck 及 n

Tipitaka
   ak :  3 vinaya( sv ,mv,cv, prv )  , 5 nikaya(dn,mn,sn,an, kn) , abhidhamma (ds, dk, kv, vb,pp, ya pt  )  , anna (vs, as)
   bk :  dn1~3,mn1~5,sn1~5,an1~11,   kd,dpd, ud,snp,pv,vv, ap, nd, thg,th , iti, jt, ps, bv,cp , mp
   ck :  dn mn sutta,  sn samyutta, ( an vagga) , chapter
   n  :  paragraph

gycd
  e : 詞條
  ti 書名
  au 作者名
  dy 朝代
  