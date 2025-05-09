import { getNotionData, getRelatedNotionData, getChildNotionData, createNotionData, updateData, deleteData } from "./notionData"
import { DataType, PagePropertyScheme, WordPropertyScheme, NotePropertyScheme, NotionDBInfo, TableInfo } from "./dataScheme"
import { createNode, createRelationship, updateNode, deleteNode, deleteRelationship, getNode as getNeo4jNode } from "./../lib/neo4j"

import { getNode as getCachedNode } from "./neo4jCache"


//NOTE: neo4jのほうにだけデータがあるという状態は想定しない
export async function openPage(URI: string) {
	//neo4jを検索
	let result:any = await getCachedNode(DataType.PAGE, URI);
	
	//あればキャッシュを返す
	if(result) return result;
	
	//なかったらnotionを検索
	if(!result) {
		let page = await getNotionData(DataType.PAGE, URI);
		if(page) {
			console.log(page);
			let words = await getRelatedNotionData(DataType.WORD, "Relations", "relation", { "contains" : page.id }, true);
			let notes = await getChildNotionData(page.Child);
			
			result = {
				Page: page,
				Words: words,
				Notes: notes,
			}
		}
	}
	
	//なかったら終了
	if(!result) {
		return null;
	}
	
	//neo4jに登録する
	//NOTE: 裏で登録する
	setTimeout(() => {
		registerNodes(result);
	}, 2000);
	
	return result;
}

//登録用関数
//NOTE: 裏で回りつづける
async function registerNodes(result: any) {
	let basePage = result.Page;
	basePage.Child = JSON.stringify(basePage.Child);
	basePage.Contents = JSON.stringify(basePage.Contents);
	let baseId = await createNode(DataType.PAGE, basePage);
	
	for(let w of result.Words) {
		w.Link = JSON.stringify(w.Link);
		w.LastEditedBy = JSON.stringify(w.LastEditedBy);
		w.Contents = JSON.stringify(w.Contents);
		let nodeId = await createNode(DataType.WORD, w);
		await createRelationship(baseId, nodeId, DataType.WORD);
	}
	
	for(let n of result.Notes) {
		delete n.URI;
		delete n.Origin;
		delete n.Path;
		n.Contents = JSON.stringify(n.Contents);
		let nodeId = await createNode(DataType.NOTE, n);
		await createRelationship(baseId, nodeId, DataType.NOTE);
	}
}

// Update a page and its related data in both Notion and Neo4j
export async function updatePage(pageId: string, pageData: any) {
	console.log("updatePage");
	
	try {
		// Update the page in Notion
		const updatedPage = await updateData(DataType.PAGE, pageId, pageData);
		
		if (!updatedPage) {
			console.log(`Failed to update page ${pageId} in Notion`);
			return null;
		}
		
		// Update the page in Neo4j
		// First, prepare the data for Neo4j
		const neo4jData = { ...updatedPage };
		if (neo4jData.Child) {
			neo4jData.Child = JSON.stringify(neo4jData.Child);
		}
		if (neo4jData.Contents) {
			neo4jData.Contents = JSON.stringify(neo4jData.Contents);
		}
		
		// Find the Neo4j node ID using the page ID
		const neo4jNode = await getNeo4jNode(DataType.PAGE, "id", pageId);
		if (neo4jNode && neo4jNode.records && neo4jNode.records.length > 0) {
			const nodeProperties = neo4jNode.records[0].get('n').properties;
			await updateNode(DataType.PAGE, nodeProperties.Neo4jID, neo4jData);
		} else {
			console.log(`Neo4j node for page ${pageId} not found, creating new node`);
			await createNode(DataType.PAGE, neo4jData);
		}
		
		return updatedPage;
	} catch (ex) {
		console.log(ex);
		return null;
	}
}

// Update a word in both Notion and Neo4j
export async function updateWord(wordId: string, wordData: any) {
	console.log("updateWord");
	
	try {
		// Update the word in Notion
		const updatedWord = await updateData(DataType.WORD, wordId, wordData);
		
		if (!updatedWord) {
			console.log(`Failed to update word ${wordId} in Notion`);
			return null;
		}
		
		// Update the word in Neo4j
		// First, prepare the data for Neo4j
		const neo4jData = { ...updatedWord };
		if (neo4jData.Link) {
			neo4jData.Link = JSON.stringify(neo4jData.Link);
		}
		if (neo4jData.LastEditedBy) {
			neo4jData.LastEditedBy = JSON.stringify(neo4jData.LastEditedBy);
		}
		if (neo4jData.Contents) {
			neo4jData.Contents = JSON.stringify(neo4jData.Contents);
		}
		
		// Find the Neo4j node ID using the word ID
		const neo4jNode = await getNeo4jNode(DataType.WORD, "id", wordId);
		if (neo4jNode && neo4jNode.records && neo4jNode.records.length > 0) {
			const nodeProperties = neo4jNode.records[0].get('n').properties;
			await updateNode(DataType.WORD, nodeProperties.Neo4jID, neo4jData);
		} else {
			console.log(`Neo4j node for word ${wordId} not found, creating new node`);
			await createNode(DataType.WORD, neo4jData);
		}
		
		return updatedWord;
	} catch (ex) {
		console.log(ex);
		return null;
	}
}

// Update a note in both Notion and Neo4j
export async function updateNote(noteId: string, noteData: any) {
	console.log("updateNote");
	
	try {
		// Update the note in Notion
		const updatedNote = await updateData(DataType.NOTE, noteId, noteData);
		
		if (!updatedNote) {
			console.log(`Failed to update note ${noteId} in Notion`);
			return null;
		}
		
		// Update the note in Neo4j
		// First, prepare the data for Neo4j
		const neo4jData = { ...updatedNote };
		delete neo4jData.URI;
		delete neo4jData.Origin;
		delete neo4jData.Path;
		if (neo4jData.Contents) {
			neo4jData.Contents = JSON.stringify(neo4jData.Contents);
		}
		
		// Find the Neo4j node ID using the note ID
		const neo4jNode = await getNeo4jNode(DataType.NOTE, "id", noteId);
		if (neo4jNode && neo4jNode.records && neo4jNode.records.length > 0) {
			const nodeProperties = neo4jNode.records[0].get('n').properties;
			await updateNode(DataType.NOTE, nodeProperties.Neo4jID, neo4jData);
		} else {
			console.log(`Neo4j node for note ${noteId} not found, creating new node`);
			await createNode(DataType.NOTE, neo4jData);
		}
		
		return updatedNote;
	} catch (ex) {
		console.log(ex);
		return null;
	}
}

// Delete a page and its related data from both Notion and Neo4j
export async function deletePage(pageId: string) {
	console.log("deletePage");
	
	try {
		// Delete the page from Notion (archive it)
		const notionResult = await deleteData(DataType.PAGE, pageId);
		
		if (!notionResult) {
			console.log(`Failed to delete page ${pageId} from Notion`);
			return false;
		}
		
		// Delete the page from Neo4j
		// First, find the Neo4j node ID using the page ID
		const neo4jNode = await getNeo4jNode(DataType.PAGE, "id", pageId);
		if (neo4jNode && neo4jNode.records && neo4jNode.records.length > 0) {
			const nodeProperties = neo4jNode.records[0].get('n').properties;
			await deleteNode(DataType.PAGE, nodeProperties.Neo4jID);
		} else {
			console.log(`Neo4j node for page ${pageId} not found`);
		}
		
		return true;
	} catch (ex) {
		console.log(ex);
		return false;
	}
}

// Delete a word from both Notion and Neo4j
export async function deleteWord(wordId: string) {
	console.log("deleteWord");
	
	try {
		// Delete the word from Notion (archive it)
		const notionResult = await deleteData(DataType.WORD, wordId);
		
		if (!notionResult) {
			console.log(`Failed to delete word ${wordId} from Notion`);
			return false;
		}
		
		// Delete the word from Neo4j
		// First, find the Neo4j node ID using the word ID
		const neo4jNode = await getNeo4jNode(DataType.WORD, "id", wordId);
		if (neo4jNode && neo4jNode.records && neo4jNode.records.length > 0) {
			const nodeProperties = neo4jNode.records[0].get('n').properties;
			await deleteNode(DataType.WORD, nodeProperties.Neo4jID);
		} else {
			console.log(`Neo4j node for word ${wordId} not found`);
		}
		
		return true;
	} catch (ex) {
		console.log(ex);
		return false;
	}
}

// Delete a note from both Notion and Neo4j
export async function deleteNote(noteId: string) {
	console.log("deleteNote");
	
	try {
		// Delete the note from Notion (archive it)
		const notionResult = await deleteData(DataType.NOTE, noteId);
		
		if (!notionResult) {
			console.log(`Failed to delete note ${noteId} from Notion`);
			return false;
		}
		
		// Delete the note from Neo4j
		// First, find the Neo4j node ID using the note ID
		const neo4jNode = await getNeo4jNode(DataType.NOTE, "id", noteId);
		if (neo4jNode && neo4jNode.records && neo4jNode.records.length > 0) {
			const nodeProperties = neo4jNode.records[0].get('n').properties;
			await deleteNode(DataType.NOTE, nodeProperties.Neo4jID);
		} else {
			console.log(`Neo4j node for note ${noteId} not found`);
		}
		
		return true;
	} catch (ex) {
		console.log(ex);
		return false;
	}
}
