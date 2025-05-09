import { query } from "./../lib/database"
import { getTable } from "./../cococore/cocopage"
import { openPage, updatePage, updateWord, updateNote, deletePage, deleteWord, deleteNote } from "./../monad/monad"
import { convertToMarkdown } from "./../lib/notion"
const { v4: uuidv4 } = require('uuid')
const fs = require('fs').promises;
const markdown = require('markdown-it');

//デフォルト関数
export async function index(req: any,res: any,route: any)
{
	console.log(route);
	return null;
}

//
export async function test(req: any,res: any,route: any)
{
	let page:any = await openPage("https://candle-stoplight-544.notion.site/1-1b439cbfbab980e9b6ecef87870f30fb");
	
	if(page) {
	 	let md = markdown();
		//page.Page.Contents = convertToMarkdown(page.Page.Contents);
	 	//page.Page.Contents = encodeURIComponent(md.render(page.Page.Contents));
		return {
			Status: 200,
			Page: page,
		}
	}
	else
	{
		return {
			Status: 404,
			Message: "Page Not Found."
		}

	}
}

// Update a page
export async function updatePageEndpoint(req: any, res: any, route: any)
{
	try {
		const { pageId, pageData } = req.body;
		
		if (!pageId || !pageData) {
			return {
				Status: 400,
				Message: "Missing required parameters: pageId and pageData"
			};
		}
		
		const result = await updatePage(pageId, pageData);
		
		if (result) {
			return {
				Status: 200,
				Message: "Page updated successfully",
				Page: result
			};
		} else {
			return {
				Status: 404,
				Message: "Failed to update page"
			};
		}
	} catch (error) {
		console.error("Error updating page:", error);
		return {
			Status: 500,
			Message: "Internal server error"
		};
	}
}

// Update a word
export async function updateWordEndpoint(req: any, res: any, route: any)
{
	try {
		const { wordId, wordData } = req.body;
		
		if (!wordId || !wordData) {
			return {
				Status: 400,
				Message: "Missing required parameters: wordId and wordData"
			};
		}
		
		const result = await updateWord(wordId, wordData);
		
		if (result) {
			return {
				Status: 200,
				Message: "Word updated successfully",
				Word: result
			};
		} else {
			return {
				Status: 404,
				Message: "Failed to update word"
			};
		}
	} catch (error) {
		console.error("Error updating word:", error);
		return {
			Status: 500,
			Message: "Internal server error"
		};
	}
}

// Update a note
export async function updateNoteEndpoint(req: any, res: any, route: any)
{
	try {
		const { noteId, noteData } = req.body;
		
		if (!noteId || !noteData) {
			return {
				Status: 400,
				Message: "Missing required parameters: noteId and noteData"
			};
		}
		
		const result = await updateNote(noteId, noteData);
		
		if (result) {
			return {
				Status: 200,
				Message: "Note updated successfully",
				Note: result
			};
		} else {
			return {
				Status: 404,
				Message: "Failed to update note"
			};
		}
	} catch (error) {
		console.error("Error updating note:", error);
		return {
			Status: 500,
			Message: "Internal server error"
		};
	}
}

// Delete a page
export async function deletePageEndpoint(req: any, res: any, route: any)
{
	try {
		const { pageId } = req.body;
		
		if (!pageId) {
			return {
				Status: 400,
				Message: "Missing required parameter: pageId"
			};
		}
		
		const result = await deletePage(pageId);
		
		if (result) {
			return {
				Status: 200,
				Message: "Page deleted successfully"
			};
		} else {
			return {
				Status: 404,
				Message: "Failed to delete page"
			};
		}
	} catch (error) {
		console.error("Error deleting page:", error);
		return {
			Status: 500,
			Message: "Internal server error"
		};
	}
}

// Delete a word
export async function deleteWordEndpoint(req: any, res: any, route: any)
{
	try {
		const { wordId } = req.body;
		
		if (!wordId) {
			return {
				Status: 400,
				Message: "Missing required parameter: wordId"
			};
		}
		
		const result = await deleteWord(wordId);
		
		if (result) {
			return {
				Status: 200,
				Message: "Word deleted successfully"
			};
		} else {
			return {
				Status: 404,
				Message: "Failed to delete word"
			};
		}
	} catch (error) {
		console.error("Error deleting word:", error);
		return {
			Status: 500,
			Message: "Internal server error"
		};
	}
}

// Delete a note
export async function deleteNoteEndpoint(req: any, res: any, route: any)
{
	try {
		const { noteId } = req.body;
		
		if (!noteId) {
			return {
				Status: 400,
				Message: "Missing required parameter: noteId"
			};
		}
		
		const result = await deleteNote(noteId);
		
		if (result) {
			return {
				Status: 200,
				Message: "Note deleted successfully"
			};
		} else {
			return {
				Status: 404,
				Message: "Failed to delete note"
			};
		}
	} catch (error) {
		console.error("Error deleting note:", error);
		return {
			Status: 500,
			Message: "Internal server error"
		};
	}
}
