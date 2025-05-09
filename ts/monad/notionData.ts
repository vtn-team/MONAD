import { DataType, PagePropertyScheme, WordPropertyScheme, NotePropertyScheme, NotionDBInfo, TableInfo } from "./dataScheme"
import { createPage, getPageProperties, getDatabase, getContents, prettyPageProperty, convertToMarkdown } from "./../lib/notion"
const { v4: uuidv4 } = require('uuid')

//対象のNotionのデータを返す
export async function getNotionData(type: DataType, dataKey: string) {
	let result = null;
	
	console.log("getNotionData");
	
	try {
		let info = TableInfo[type];
		let data:any = await getRelatedNotionData(type, info.DataKey, info.DataType, { "contains": dataKey }, info.UseContents);
		if(data.length > 0){
			result = data[0];
		}
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}

//対象のNotionのリレーションデータを返す
export async function getRelatedNotionData(type: DataType, fkeyName: string, fKeyType: string, fKeyValue: any, useContents: boolean) {
	let result = null;
	
	console.log("getRelatedNotionData");
	
	try {
		let info = TableInfo[type];
		let filter:any = {
			"property": fkeyName
		};
		filter[fKeyType] = fKeyValue;
		
		console.log(filter)
		
		let prop:any = await getDatabase(info.DatabaseId, filter);
		if(prop.length > 0){
			result = [];
			for(let d of prop) {
				let data = prettyPageProperty(d);
				if(useContents) {
					let contents:any = await getContents(d.id);
					data.Contents = contents;
				}
				result.push(data);
			}
		}
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}

//対象のNotionのデータを返す
export async function getChildNotionData(childIds: Array<string>) {
	let result = [];
	
	console.log("getChildNotionData");
	
	for (let id of childIds) {
		try {
			let prop: any = await getPageProperties(id);
			prop = prettyPageProperty(prop);
			let contents = await getContents(id);
			if (!contents) continue;
			if (contents.length == 0) continue;

			prop.Contents = contents;
			result.push(prop);
		} catch (ex) {
			console.log(ex);
		}
	}
	
	return result;
}

export async function createNotionData(type: DataType, data: any) {
	let result = null;
	
	console.log("createNotionData");
	try {
		let info = TableInfo[type];
		
		let props: any = {};
		for(let d of info.Scheme) {
			props[d.Name] = {};
			props[d.Name][d.Style] = [{}];
			props[d.Name][d.Style][0][d.Type] = { "content" : data[d.Name] };
		}
		
		let page:any = await createPage({
			"parent": {
				"database_id": info.DatabaseId
			},
			"properties": props
		});
		
		console.log(page);
		result = prettyPageProperty(page);
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}

export async function updateData(type: DataType, pageId: string, data: any) {
	let result = null;
	
	console.log("updateData");
	
	try {
		let info = TableInfo[type];
		
		let props: any = {};
		for(let d of info.Scheme) {
			if (data[d.Name] !== undefined) {
				props[d.Name] = {};
				props[d.Name][d.Style] = [{}];
				props[d.Name][d.Style][0][d.Type] = { "content" : data[d.Name] };
			}
		}
		
		// Use the createPage function pattern but for updating
		let updateData = {
			page_id: pageId,
			properties: props
		};
		
		// We need to add a function to notion.ts to handle page updates
		// For now, we'll use a direct import of the Notion client
		const { Client } = require("@notionhq/client");
		const { COCOIRU_NOTION_TOKEN } = require("./../config/config");
		const notionClient = new Client({ auth: COCOIRU_NOTION_TOKEN });
		
		let page:any = await notionClient.pages.update(updateData);
		
		console.log(page);
		result = prettyPageProperty(page);
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}

export async function deleteData(type: DataType, pageId: string) {
	let result = false;
	
	console.log("deleteData");
	
	try {
		// Notion API doesn't have a direct delete method, but we can archive a page
		// which effectively removes it from view in the Notion UI
		
		// We need to add a function to notion.ts to handle page archiving
		// For now, we'll use a direct import of the Notion client
		const { Client } = require("@notionhq/client");
		const { COCOIRU_NOTION_TOKEN } = require("./../config/config");
		const notionClient = new Client({ auth: COCOIRU_NOTION_TOKEN });
		
		await notionClient.pages.update({
			page_id: pageId,
			archived: true
		});
		
		result = true;
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}
