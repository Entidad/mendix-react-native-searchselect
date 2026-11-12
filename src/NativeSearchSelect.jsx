import{Component}from"react";
import{NativeSearchSelectComponent}from"./components/NativeSearchSelectComponent";
import{haystack}from"./utils/match";
export class NativeSearchSelect extends Component{
	constructor(props){
		super(props);
		this.onSelect=this.onSelect.bind(this);
		this.onClear=this.onClear.bind(this);
		this.onOpen=this.onOpen.bind(this);
		this.onClose=this.onClose.bind(this);
	}
	//An action only runs when it is configured, permitted, and not already running.
	execute(action){
		if(!action)return;
		if(!action.canExecute||!action.isAuthorized)return;
		if(action.isExecuting&&action.disabledDuringExecution)return;
		action.execute();
	}
	//A DynamicValue only carries a value once it reports as available.
	resolve(dynamic){
		return dynamic!=null&&dynamic.status=="available"?dynamic.value:undefined;
	}
	//A text template over a data source arrives as a ListExpressionValue: one expression that
	//is evaluated per object rather than once for the widget.
	resolveFor(listExpression,item){
		if(listExpression==null||typeof listExpression.get!="function"||item==null)return undefined;
		return this.resolve(listExpression.get(item));
	}
	isEnumMode(){
		return this.props.optionsSource!="datasource";
	}
	//Enumeration values and their captions both come from the attribute: universe lists the
	//value names in the order they are modelled, and the attribute's own formatter turns each
	//into the caption for the session's language. Nothing else has to be modelled, which is
	//the point of binding an enumeration rather than a list of objects.
	enumOptions(){
		const attr=this.props.enumAttribute;
		if(attr==null||attr.status!="available"||attr.universe==null)return[];
		const formatter=attr.formatter;
		return attr.universe.map(key=>{
			const caption=formatter!=null&&typeof formatter.format=="function"?formatter.format(key):String(key);
			return{id:key,caption:caption,subtitle:undefined,item:undefined,search:haystack([caption])};
		});
	}
	objectOptions(){
		const ds=this.props.objects;
		if(ds==null||ds.status!="available"||ds.items==null)return[];
		return ds.items.map(item=>{
			const caption=this.resolveFor(this.props.optionCaption,item);
			const subtitle=this.resolveFor(this.props.optionSubtitle,item);
			//Matched but never shown, so a code or a synonym can reach an option that the
			//caption alone would not.
			const extra=this.resolveFor(this.props.optionSearchText,item);
			return{
				id:item.id,
				caption:caption!=null?caption:"",
				subtitle:subtitle,
				item:item,
				search:haystack([caption,subtitle,extra]),
			};
		});
	}
	options(){
		return this.isEnumMode()?this.enumOptions():this.objectOptions();
	}
	//What the closed field shows. In enumeration mode the platform has already formatted the
	//value, so displayValue is used rather than looking the caption up again.
	selected(options){
		if(this.isEnumMode()){
			const attr=this.props.enumAttribute;
			if(attr==null||attr.status!="available"||attr.value==null)return{id:undefined,caption:undefined};
			const match=options.find(option=>option.id===attr.value);
			const caption=attr.displayValue!=null&&attr.displayValue!==""?attr.displayValue:match!=null?match.caption:String(attr.value);
			return{id:attr.value,caption:caption};
		}
		const selection=this.props.selection;
		if(selection==null||selection.status!="available"||selection.value==null)return{id:undefined,caption:undefined};
		const item=selection.value;
		const match=options.find(option=>option.id===item.id);
		//A selected object the data source does not return - it may be filtered out, or on a
		//later page - still has to read as selected, so the caption expression is evaluated
		//for it directly rather than being looked up in the list.
		const caption=match!=null?match.caption:this.resolveFor(this.props.optionCaption,item);
		return{id:item.id,caption:caption};
	}
	//The bound value is what decides editability: the Editability system property surfaces as
	//readOnly on it, as do access restrictions.
	target(){
		return this.isEnumMode()?this.props.enumAttribute:this.props.selection;
	}
	write(value){
		const target=this.target();
		if(target==null||target.status!="available"||target.readOnly)return;
		target.setValue(value);
		//Written before the action runs, so a nanoflow reads the new selection.
		this.execute(this.props.onChangeAction);
	}
	onSelect(option){
		if(option==null)return;
		this.write(this.isEnumMode()?option.id:option.item);
	}
	onClear(){
		this.write(undefined);
	}
	onOpen(){
		this.execute(this.props.onOpenAction);
	}
	onClose(){
		this.execute(this.props.onCloseAction);
	}
	//Only the data source reports loading of its own: an enumeration's options are already in
	//the client, so in that mode there is nothing to wait for.
	isLoading(){
		if(this.isEnumMode())return false;
		const ds=this.props.objects;
		return ds==null||ds.status=="loading";
	}
	render(){
		const options=this.options();
		const selected=this.selected(options);
		const target=this.target();
		return(
			<NativeSearchSelectComponent
				options={options}
				selectedId={selected.id}
				selectedCaption={selected.caption}
				editable={target!=null&&!target.readOnly}
				loading={this.isLoading()}
				placeholder={this.resolve(this.props.placeholder)}
				modalTitle={this.resolve(this.props.modalTitle)}
				searchPlaceholder={this.resolve(this.props.searchPlaceholder)}
				emptyCaption={this.resolve(this.props.emptyCaption)}
				allowClear={this.props.allowClear===true}
				clearCaption={this.resolve(this.props.clearCaption)}
				minOptionsForSearch={this.props.minOptionsForSearch}
				matchMode={this.props.matchMode||"contains"}
				autoFocusSearch={this.props.autoFocusSearch!==false}
				dropdownIcon={this.resolve(this.props.dropdownIcon)}
				searchIcon={this.resolve(this.props.searchIcon)}
				closeIcon={this.resolve(this.props.closeIcon)}
				selectedIcon={this.resolve(this.props.selectedIcon)}
				onSelect={this.onSelect}
				onClear={this.onClear}
				onOpen={this.onOpen}
				onClose={this.onClose}
				style={this.props.style}
			/>
		);
	}
}
