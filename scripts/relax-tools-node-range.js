//Pluggable Widgets Tools 11.12.1 declares engines.node as ^22.18.0 and its own preflight check
//exits before running any script when the range does not match, so Node 24 is refused outright.
//The build itself is fine on 24 - only the declared range objects - so this widens the ceiling
//while keeping the 22.18 floor Mendix actually requires.
//
//Run from postinstall, because npm install rewrites the file this edits.
const{readFileSync,writeFileSync}=require("fs");
const{join}=require("path");
const PINNED="^22.18.0";
const WIDENED=">=22.18.0";
const manifest=join(__dirname,"..","node_modules","@mendix","pluggable-widgets-tools","package.json");
let raw;
try{
	raw=readFileSync(manifest,"utf8");
}catch(e){
	//Nothing to patch before the dependency is there - a bare `npm install` in a clean checkout
	//reaches postinstall with the tree already written, so this is only hit in odd cases.
	console.log("relax-tools-node-range: pluggable-widgets-tools not installed, skipping");
	process.exit(0);
}
const pkg=JSON.parse(raw);
const range=pkg.engines!=null?pkg.engines.node:undefined;
if(range===WIDENED){
	console.log("relax-tools-node-range: already widened");
	process.exit(0);
}
//Deliberately matched exactly rather than widened blindly. If a later version states a
//different range it may mean something real, and that is worth reading before overriding.
if(range!==PINNED){
	console.log("relax-tools-node-range: engines.node is "+range+", not "+PINNED+" - leaving it alone");
	process.exit(0);
}
writeFileSync(manifest,raw.replace('"node": "'+PINNED+'"','"node": "'+WIDENED+'"'));
console.log("relax-tools-node-range: engines.node "+PINNED+" -> "+WIDENED);
