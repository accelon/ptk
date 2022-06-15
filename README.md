# PTK
A read-only , line-based formatted text storage.

- Pitaka means "basket" in Pali.
- Two storing modes, as a ZIP archive or as jsonp files.
- lazip is 100% zip archive based on JSZip, allow partial read of file, which is important to served via http or browser file API.
- jsonp mode allow Pitaka to be served on file:// protocol.
## Steps of porting

- As Deno is node_modules free , small web UI written in Svelte may exist put in this repo.
- start from a simple UI to read existing ptk.
- build a small pitaka
- keep `ptk` command clean, give text processing and exprimental tools another name
- a stand alone exe without any dependency, static pages are served 
- deploy as app server


## Basic commands

`ptk create [projectname]` create and initialize a new project.

`ptk build` build pitaka and generate json file in the folder with same as project name

`ptk zip` build pitaka a zip file, just like browser does.

`ptk workshop` open up a GUI workshop

`ptk test` test the sanity of pitaka

`ptk deploy` create deployable the pitaka with a simple user interface.



## build with browser only
- all source file including pitaka.json in same folder.
- output to a zip file


