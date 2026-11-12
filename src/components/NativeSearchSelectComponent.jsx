import{Component}from"react";
import{View,Text,TextInput,Pressable,Modal,FlatList,ActivityIndicator,Platform,StatusBar,Dimensions,StyleSheet}from"react-native";
import{Icon}from"mendix/components/native/Icon";
import{mergeNativeStyles}from"@mendix/pluggable-widgets-tools";
import{matches}from"../utils/match";
//Icon size comes from fontSize so the glyphs scale with the same numbers as the text.
const DEFAULT_ICON_SIZE=20;
//Drawn when no icon is mapped. These are the glyphs the platform's own widgets use - the
//native Drop Down's chevron is glyphicon-chevron-down - from the icon font every Mendix
//native app ships, so an unmapped widget matches the stock ones instead of falling back to
//whatever a text character looks like in the device's own font. Each icon property still
//overrides its glyph.
const CHEVRON={type:"glyph",iconClass:"glyphicon-chevron-down"};
const CLOSE={type:"glyph",iconClass:"glyphicon-remove"};
const CHECK={type:"glyph",iconClass:"glyphicon-ok"};
const SEARCH={type:"glyph",iconClass:"glyphicon-search"};
//Last resort for the clearing row when neither a clear caption nor a placeholder is set.
const CLEAR_CAPTION="—";
const DEFAULT_EMPTY="No results";
//The list covers the status bar, so its header has to leave room for it by hand. Mendix's
//native template does not expose safe-area insets to a widget, and react-native-safe-area-
//context is not a dependency the app is guaranteed to carry, so this is measured where the
//platform reports it and estimated where it does not. A style class can override paddingTop
//on the header to tune it for a specific device.
const WINDOW=Dimensions.get("window");
const TOP_INSET=Platform.OS=="android"?StatusBar.currentHeight||0:Math.max(WINDOW.width,WINDOW.height)>=812?44:20;
const defaultStyle={
	container:{
		flexDirection:"row",
		alignItems:"center",
		borderWidth:1,
		borderColor:"#CED0D3",
		borderRadius:4,
		backgroundColor:"#FFFFFF",
		paddingHorizontal:12,
		paddingVertical:12,
	},
	//Layered over container while the value cannot be changed.
	containerDisabled:{
		backgroundColor:"#F8F8F8",
		borderColor:"#E7E7E9",
	},
	value:{
		flex:1,
		fontSize:16,
		color:"#0A1325",
	},
	placeholder:{
		flex:1,
		fontSize:16,
		color:"#9DA1A8",
	},
	icon:{
		fontSize:DEFAULT_ICON_SIZE,
		color:"#6C717C",
		marginLeft:8,
	},
	modal:{
		flex:1,
		backgroundColor:"#FFFFFF",
	},
	header:{
		flexDirection:"row",
		alignItems:"center",
		paddingHorizontal:16,
		paddingBottom:12,
		borderBottomWidth:1,
		borderBottomColor:"#E7E7E9",
	},
	title:{
		flex:1,
		fontSize:18,
		fontWeight:"600",
		color:"#0A1325",
	},
	closeIcon:{
		fontSize:20,
		color:"#6C717C",
		paddingHorizontal:8,
	},
	searchContainer:{
		flexDirection:"row",
		alignItems:"center",
		margin:16,
		paddingHorizontal:12,
		borderWidth:1,
		borderColor:"#CED0D3",
		borderRadius:4,
		backgroundColor:"#FFFFFF",
	},
	searchIcon:{
		fontSize:DEFAULT_ICON_SIZE,
		color:"#6C717C",
		marginRight:8,
	},
	searchInput:{
		flex:1,
		fontSize:16,
		color:"#0A1325",
		paddingVertical:10,
	},
	searchPlaceholderColor:{
		color:"#9DA1A8",
	},
	list:{
		flex:1,
	},
	listContent:{
		paddingBottom:24,
	},
	option:{
		flexDirection:"row",
		alignItems:"center",
		paddingHorizontal:16,
		paddingVertical:14,
	},
	//Layered over option for the option that is currently selected.
	optionSelected:{
		backgroundColor:"#F2F6FF",
	},
	optionText:{
		flex:1,
		fontSize:16,
		color:"#0A1325",
	},
	optionTextSelected:{
		fontWeight:"600",
	},
	optionSubtitle:{
		fontSize:13,
		color:"#6C717C",
		marginTop:2,
	},
	selectedIcon:{
		fontSize:DEFAULT_ICON_SIZE,
		color:"#2E67E8",
		marginLeft:8,
	},
	//Full width on purpose. An inset separator leaves the gap at its inset end unlined, and a
	//selected row - which is filled edge to edge - then runs straight into its neighbours
	//there, reading as colour leaking out of the row at that one corner.
	separator:{
		height:1,
		backgroundColor:"#EFEFF1",
	},
	empty:{
		fontSize:15,
		color:"#6C717C",
		textAlign:"center",
		paddingVertical:32,
	},
	loadingColor:{
		color:"#6C717C",
	},
};
export class NativeSearchSelectComponent extends Component{
	styles=mergeNativeStyles(defaultStyle,this.props.style);
	constructor(props){
		super(props);
		//query is held here rather than above, so a keystroke re-renders the list and nothing
		//else - the options and their folded search text are built once by the container.
		this.state={open:false,query:""};
		this.open=this.open.bind(this);
		this.close=this.close.bind(this);
		this.clear=this.clear.bind(this);
		this.onChangeQuery=this.onChangeQuery.bind(this);
		this.renderOption=this.renderOption.bind(this);
		this.renderSeparator=this.renderSeparator.bind(this);
		this.keyExtractor=this.keyExtractor.bind(this);
	}
	open(){
		if(!this.props.editable)return;
		//A query left over from the last time would hide most of the list on opening.
		this.setState({open:true,query:""});
		if(this.props.onOpen)this.props.onOpen();
	}
	close(){
		this.setState({open:false,query:""});
		if(this.props.onClose)this.props.onClose();
	}
	select(option){
		if(this.props.onSelect)this.props.onSelect(option);
		this.close();
	}
	clear(){
		if(this.props.onClear)this.props.onClear();
		this.close();
	}
	onChangeQuery(query){
		this.setState({query:query});
	}
	keyExtractor(option){
		return String(option.id);
	}
	filtered(){
		const query=this.state.query;
		const options=this.props.options||[];
		if(query.trim()=="")return options;
		return options.filter(option=>matches(option.search,query,this.props.matchMode));
	}
	//0 always shows the search box. Any other number hides it until the list is long enough to
	//be worth searching, so a handful of choices opens straight to its options.
	searchShown(){
		const minimum=this.props.minOptionsForSearch;
		if(typeof minimum!="number"||minimum<=0)return true;
		return(this.props.options||[]).length>=minimum;
	}
	//fontSize doubles as the icon size. A fallback keeps the icon visible if a style class
	//supplies the key without one, rather than collapsing it to nothing.
	iconSize(style){
		const size=style!=null?style.fontSize:undefined;
		return typeof size=="number"&&size>0?size:DEFAULT_ICON_SIZE;
	}
	//Spacing belongs on the wrapper, not on the glyph, so it is split off from the style.
	iconSpacing(style){
		const flat=StyleSheet.flatten(style)||{};
		const{fontSize,color,...rest}=flat;
		return rest;
	}
	//A mapped icon wins; otherwise the default glyph stands in. Both go through the same path,
	//so either is sized and coloured by the one style key.
	renderIcon(icon,fallback,style){
		const resolved=icon!=null?icon:fallback;
		if(resolved==null)return null;
		return(
			<View style={this.iconSpacing(style)}>
				<Icon icon={resolved} size={this.iconSize(style)} color={style!=null?style.color:undefined}/>
			</View>
		);
	}
	renderSeparator(){
		return <View style={this.styles.separator}/>;
	}
	//Renamed off FlatList's own "item", which here is one of the container's options - itself
	//holding the ObjectItem it came from, when the options are objects.
	renderOption({item:option}){
		const selected=option.id===this.props.selectedId;
		const textStyle=selected?[this.styles.optionText,this.styles.optionTextSelected]:this.styles.optionText;
		return(
			<Pressable
				accessibilityRole="button"
				style={selected?[this.styles.option,this.styles.optionSelected]:this.styles.option}
				onPress={()=>this.select(option)}
			>
				<View style={{flex:1}}>
					<Text style={textStyle}>{option.caption}</Text>
					{option.subtitle!=null&&option.subtitle!==""?<Text style={this.styles.optionSubtitle}>{option.subtitle}</Text>:null}
				</View>
				{selected?this.renderIcon(this.props.selectedIcon,CHECK,this.styles.selectedIcon):null}
			</Pressable>
		);
	}
	//The clearing row sits above the options rather than among them, so it keeps its place at
	//the top of a long list. It is dropped while a query is being typed: the reader is looking
	//for an option at that point, and a row that empties the field is only noise in the way.
	renderClear(){
		if(!this.props.allowClear||this.state.query.trim()!="")return null;
		const caption=this.props.clearCaption!=null&&this.props.clearCaption!==""?this.props.clearCaption:this.props.placeholder;
		return(
			<Pressable accessibilityRole="button" style={this.styles.option} onPress={this.clear}>
				<Text style={[this.styles.optionText,this.styles.placeholder]}>{caption!=null?caption:CLEAR_CAPTION}</Text>
			</Pressable>
		);
	}
	renderEmpty(){
		if(this.props.loading)return <ActivityIndicator style={{paddingVertical:32}} color={this.styles.loadingColor.color}/>;
		const caption=this.props.emptyCaption!=null&&this.props.emptyCaption!==""?this.props.emptyCaption:DEFAULT_EMPTY;
		return <Text style={this.styles.empty}>{caption}</Text>;
	}
	renderSearch(){
		if(!this.searchShown())return null;
		return(
			<View style={this.styles.searchContainer}>
				{this.renderIcon(this.props.searchIcon,SEARCH,this.styles.searchIcon)}
				<TextInput
					style={this.styles.searchInput}
					value={this.state.query}
					placeholder={this.props.searchPlaceholder}
					placeholderTextColor={this.styles.searchPlaceholderColor.color}
					onChangeText={this.onChangeQuery}
					autoFocus={this.props.autoFocusSearch}
					autoCorrect={false}
					autoCapitalize="none"
					returnKeyType="search"
					clearButtonMode="while-editing"
				/>
			</View>
		);
	}
	renderList(){
		return(
			<Modal
				visible={this.state.open}
				animationType="slide"
				statusBarTranslucent={true}
				onRequestClose={this.close}
			>
				<View style={this.styles.modal}>
					<View style={[{paddingTop:TOP_INSET+12},this.styles.header]}>
						<Text style={this.styles.title} numberOfLines={1}>{this.props.modalTitle}</Text>
						<Pressable accessibilityRole="button" onPress={this.close} hitSlop={8}>
							{this.renderIcon(this.props.closeIcon,CLOSE,this.styles.closeIcon)}
						</Pressable>
					</View>
					{this.renderSearch()}
					<FlatList
						style={this.styles.list}
						contentContainerStyle={this.styles.listContent}
						data={this.filtered()}
						extraData={this.props.selectedId}
						keyExtractor={this.keyExtractor}
						renderItem={this.renderOption}
						ItemSeparatorComponent={this.renderSeparator}
						ListHeaderComponent={this.renderClear()}
						ListEmptyComponent={this.renderEmpty()}
						//A tap on an option has to land while the keyboard is up, rather than
						//being swallowed by the dismissal.
						keyboardShouldPersistTaps="handled"
						keyboardDismissMode="on-drag"
					/>
				</View>
			</Modal>
		);
	}
	render(){
		const caption=this.props.selectedCaption;
		const hasValue=caption!=null&&caption!=="";
		const editable=this.props.editable;
		//The list is a sibling of the field rather than a child of it, so a tap inside the
		//list never reads as a tap on the field that opened it.
		return(
			<>
				<Pressable
					accessibilityRole="button"
					style={editable?this.styles.container:[this.styles.container,this.styles.containerDisabled]}
					onPress={this.open}
					disabled={!editable}
				>
					<Text numberOfLines={1} style={hasValue?this.styles.value:this.styles.placeholder}>
						{hasValue?caption:this.props.placeholder}
					</Text>
					{this.renderIcon(this.props.dropdownIcon,CHEVRON,this.styles.icon)}
				</Pressable>
				{this.renderList()}
			</>
		);
	}
}
