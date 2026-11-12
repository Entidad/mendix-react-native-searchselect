//Accent folding, so a query typed on a plain keyboard still finds an accented caption:
//"plantacion" has to match "Plantación", and "nino" has to match "Niño".
//
//NFD splits an accented letter into its base letter and a combining mark, which the next
//replace drops. Hermes ships normalize, but it is guarded because a stripped-down JS engine
//may not, and a missing normalize would otherwise take the whole list filter down with it.
//The map then covers the letters NFD leaves whole - the ones written as a single character
//rather than as a base plus a mark.
const FOLD={
	"ß":"ss",
	"ø":"o",
	"æ":"ae",
	"œ":"oe",
	"đ":"d",
	"ð":"d",
	"þ":"th",
	"ł":"l",
};
export function fold(text){
	if(text==null)return "";
	let folded=String(text).toLowerCase();
	if(typeof folded.normalize=="function"){
		folded=folded.normalize("NFD").replace(/[̀-ͯ]/g,"");
	}
	//hasOwnProperty keeps an inherited name from resolving to something that is not a letter.
	return folded.replace(/[^\u0000-\u007f]/g,c=>Object.prototype.hasOwnProperty.call(FOLD,c)?FOLD[c]:c);
}
//Everything searchable about one option, folded once so a keystroke does not refold the whole
//list. The join keeps a word at the end of one part from running into the next part's first.
export function haystack(parts){
	return parts.filter(part=>part!=null&&part!=="").map(fold).join(" ");
}
function words(text){
	return text.split(/\s+/).filter(word=>word!=="");
}
//startsWith matches the start of any word rather than only the start of the whole text: a
//caption like "Corte de caña" should be reachable by typing "caña", which is how a reader
//thinks of it, and matching only the first word would hide it.
function matchesTerm(folded,term,mode){
	if(mode=="startsWith")return folded.startsWith(term)||words(folded).some(word=>word.startsWith(term));
	return folded.indexOf(term)!=-1;
}
export function matches(folded,query,mode){
	const needle=fold(query).trim();
	//An empty query is not a filter, so the list opens showing everything.
	if(needle=="")return true;
	//Every typed word has to appear, in any order, so "caña corte" finds "Corte de caña".
	if(mode=="allWords")return words(needle).every(word=>folded.indexOf(word)!=-1);
	return matchesTerm(folded,needle,mode);
}
