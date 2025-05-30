const { Client, APIErrorCode } = require("@notionhq/client")
import { COCOIRU_NOTION_TOKEN } from "./../config/config"

let notion = new Client({ auth: COCOIRU_NOTION_TOKEN });
let users = new Array();

/*
function getText(block: any) {
  let result:any = {}
  let text = null;
  
  if(block[block.type].rich_text) {
    text = block[block.type].rich_text[0]
  }
  if(block[block.type].text) {
    text = block[block.type].text[0]
  }
  if(!text) return result;
  console.log(text);
  
  if(!text.type) return result;
  let content = text[text.type];
  if(!content) return result;
  
  result.Annotations = {}
  for(let style in text.annotations) {
    let obj = text.annotations[style];
    if(obj) {
      result.Annotations[style] = obj;
    }
  }
  result.Content = content.content;
  if(content.link) {
    result.Link = content.link;
  }
  return result;
}
*/

const getText = (richTextArray:any) => {
  return richTextArray
    .map((textObj:any) => {
      let text = textObj.text.content;

      if (textObj.annotations.bold) text = `**${text}**`;
      if (textObj.annotations.italic) text = `*${text}*`;
      if (textObj.annotations.strikethrough) text = `~~${text}~~`;
      if (textObj.annotations.underline) text = `<u>${text}</u>`;
      if (textObj.annotations.code) text = `\`${text}\``;

      return text;
    })
    .join('');
};

export function prettyPageProperty(page: any)
{
    let json: any = {
        id: page.id
    }
    const prop = page.properties;
    for(let key in prop) {
      let d = page.properties[key][page.properties[key].type];
      //console.log(page);
      if(!d) continue;
      
      let pretty = function(data: any) {
        if(page.properties[key].type == "select" || page.properties[key].type == "multi_select"){
          data.type = "select"
        }
        
        if(page.properties[key].type == "unique_id") {
          data.type = "unique_id"
        }
        
        if(page.properties[key].type == "relation") {
          data.type = "relation"
        }
        
        //console.log(page.properties[key]);
        
        //
        switch(data.type){
        case "unique_id":
          data = data.number
          break;
        case "text":
          data = data.plain_text
          break;
        case "select":
          data = data.name
          break;
        case "relation":
          data = data.id
          break;
        case "person":
          data = {
            name: data.name,
            avatar_url: data.avatar_url,
            data: data.person
          }
          break;
        case "email":
        case "Email":
        default:
          break;
        }
        return data;
      }
      
      let dt = null;
      if(!d.length){
        dt = pretty(d)
      }else if(typeof d == "string"){
        dt = pretty(d)
      }else {
        if(d.length > 1 || page.properties[key].type == "select" || page.properties[key].type == "multi_select" || page.properties[key].type == "relation") {
          dt = [];
          for(let i=0; i<d.length; ++i) {
            dt[i] = pretty(d[i])
          }
        }else if(d.length == 1){
          dt = pretty(d[0])
        }
      }
      
      json[key] = dt;
    };
    return json;
}

export function convertToMarkdown(blocks: any) {
  let markdown = '';
  if(!blocks) return markdown.trim();
  
  blocks.forEach((block:any) => {
    switch (block.type) {
      case 'paragraph':
        markdown += getText(block.paragraph.rich_text) + '\n\n';
        break;
      case 'heading_1':
        markdown += '# ' + getText(block.heading_1.rich_text) + '\n\n';
        break;
      case 'heading_2':
        markdown += '## ' + getText(block.heading_2.rich_text) + '\n\n';
        break;
      case 'heading_3':
        markdown += '### ' + getText(block.heading_3.rich_text) + '\n\n';
        break;
      case 'bulleted_list_item':
        markdown += '- ' + getText(block.bulleted_list_item.rich_text) + '\n';
        break;
      case 'numbered_list_item':
        markdown += '1. ' + getText(block.numbered_list_item.rich_text) + '\n';
        break;
      case 'to_do':
        const checked = block.to_do.checked ? 'x' : ' ';
        markdown += `- [${checked}] ` + getText(block.to_do.rich_text) + '\n';
        break;
      case 'quote':
        markdown += '> ' + getText(block.quote.rich_text) + '\n\n';
        break;
      case 'code':
        markdown += '```\n' + getText(block.code.rich_text) + '\n```\n\n';
        break;
      case 'divider':
        markdown += '---\n\n';
        break;
      case 'image':
        const imgUrl = block.image.file?.url || block.image.external.url;
        markdown += `![Image](${imgUrl})\n\n`;
        break;
      default:
        console.log(`Unsupported block type: ${block.type}`);
    }
  });

  return markdown.trim();
};

export function prettyPageContent(contents: any)
{
    let pageBlock:any = [];
    for(let block of contents) {
      let line:any = {};
      
        console.dir(block[block.type], 0)
        
      if(block.last_edited_by) {
        line.LastEditedBy = block.last_edited_by;
      }
      
      switch(block.type) {
      case "title":
        line = { type: "title", "text": getText(block) };
        break;
      
      case "heading_1":
      case "heading_2":
      case "heading_3":
      case "paragraph":
        line = { type: block.type, "text": getText(block) };
        break;
        /*
      case "bulleted_list_item":
        let text = "";
        for(let i=0; i<block[block.type].text.length; ++i) {
          if(block.type == "bulleted_list_item") {
            text += "・";
          }
          
          if(block[block.type].text[i].href) {
            text += block[block.type].text[i].plain_text.replace(block[block.type].text[i].href, "<" + block[block.type].text[i].href + ">");
          } else {
            text += block[block.type].text[i].plain_text
          }
          text += "\n";
        }
        line = { type:"markdown", "text": text };
        break;
        */
        default:
          line = block;
          break;
      }
      pageBlock.push(line);
    }
    return pageBlock;
}

async function getNotionUsers() {
  let cursor = undefined;
  let next_cursor = undefined;
  const ret = []
  
  while (true) {
    const { results, next_cursor:any } = await notion.users.list({
      start_cursor: cursor
    });
        
    results.forEach((u:any) => {
      if(!users.includes(u.id)) {
        users.push(u);
      }else{
        console.log("find:" + u.id);
      }
    });
    
    ret.push(...results);
    
    if (!next_cursor) {
      break
    }
    cursor = next_cursor;
  }
  
  return ret;
}

async function getSettingFromNotion(dbId: string, filter: any) {
  const config = [];
  let cursor = undefined;
  let next_cursor = undefined;
  
  while (true) {
    let nc = undefined;
    
    if(filter){
      const { results, next_cursor:any } = await notion.databases.query({
        database_id: dbId,
        filter: filter,
        start_cursor: cursor
      });
      config.push(...results);
      nc = next_cursor;
    }else{
      const { results, next_cursor:any } = await notion.databases.query({
        database_id: dbId,
        start_cursor: cursor
      });
      config.push(...results);
      nc = next_cursor;
    }
    
    if (!nc) {
      break;
    }
    
    cursor = nc
  }
  
  return config.map(page => {
    let json = prettyPageProperty(page);
    
    //必要な情報を設定しとく、かぶったら知らん…
    json.child_id = page.id;
    json.page_type = page.object;
    json.url = page.url;
      
    return json;
  });
}

async function getChildBlocks(pgId: string) {
  const contents = [];
  let cursor = undefined;
  let next_cursor = undefined;
  
  while (true) {
    const { results, next_cursor:any } = await notion.blocks.children.list({
    	block_id: pgId
    });
    contents.push(...results);
    if (!next_cursor) {
      break
    }
    cursor = next_cursor
  }
  return contents;
};

async function getPageContents(pgId: string, withChild: boolean) {
  let recursive_get_childs = async function(cts: any)
  {
    for(let i=0; i<cts.length; ++i)
    {
      let block = cts[i];
      if(block.has_children)
      {
        let children = await getChildBlocks(block.id);
        await recursive_get_childs(children);
        block.children = children;
      }
    }
  }
  
  let contents = await getChildBlocks(pgId);
  if(withChild)
  {
    await recursive_get_childs(contents);
  }
  return contents;
}

async function getNotionDatabase(dbId: string, filter: any) {
  const pages = []
  let cursor = undefined;
  let next_cursor = undefined;
  dbId = dbId.replace(/-/g, "");

  while (true) {
    let nc:any = undefined;
    if(filter){
      const { results, next_cursor:any } = await notion.databases.query({
        database_id: dbId,
        filter: filter,
        start_cursor: cursor
      });
      pages.push(...results);
      nc = next_cursor;
    } else {
      const { results, next_cursor:any } = await notion.databases.query({
        database_id: dbId,
        start_cursor: cursor
      });
      pages.push(...results);
      nc = next_cursor;
    }
    
    if (!nc) {
      break
    }
    
    cursor = nc
  }
  
  return pages;
}

async function searchNotionDatabases(query: string, filter: any) {
  const pages = [];
  let cursor = undefined;
  let next_cursor = undefined;
  
  while (true) {
    let nc = undefined;
    if(filter){
      const { results, next_cursor:any } = await notion.search({
        query: query,
        filter: filter,
        start_cursor: cursor,
        page_size: 50
      });
      pages.push(...results);
      nc = next_cursor;
    }else{
      const { results, next_cursor:any } = await notion.search({
        query: query,
        start_cursor: cursor,
        page_size: 50
      });
      pages.push(...results);
      nc = next_cursor;
    }
    
    if (!nc) {
      break
    }
    
    cursor = nc
  }
  
  return pages;
}



////

export async function getUserList()
{
	if(users.length == 0){
		await getNotionUsers();
	}
	return users;
}

export async function getConfig(dbId: string, filter: any = null)
{
	let config = await getSettingFromNotion(dbId, filter);
	return config;
}

export async function getPageProperties(pgId: string)
{
	let propeties = await notion.pages.retrieve({
		page_id: pgId
	});
	return propeties;
}

export async function searchDocs(query: string, filter: any)
{
	let pages = await searchNotionDatabases(query, filter);
	return pages;
}

export async function getDatabase(dbId: string, filter: any = null)
{
	let pages = await getNotionDatabase(dbId, filter);
	return pages;
}

export async function createPage(data: any)
{
  let response = await notion.pages.create(data);
  return response;
}

exports.getPageConf = async (pgId: string) =>
{
	let page = await notion.pages.retrieve({
		page_id: pgId
	});
	return prettyPageProperty(page);
}

export async function getContents(pgId: string, withChilds: boolean = false)
{
	let page = await getPageContents(pgId, withChilds);
	return page;
}

exports.auth = async (code: string) =>
{
  const credentials = Buffer.from(
    `${process.env.OAUTH_CLIENT_ID}:${process.env.OAUTH_CLIENT_SECRET}`
  ).toString('base64')
  
  console.log(JSON.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.REDIRECT_URL,
    }));
  
  const res = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: "https://in0rr8jya4.execute-api.ap-northeast-1.amazonaws.com/default/public_api_callback",
    }),
  })
  
  const data = await res.json()
  if (data.error) {
    console.log(res);
    throw new Error(data.error)
  }
  return data;
}

exports.extToken = (token: string) => 
{
  notion = new Client({ auth: token });
}


exports.convertToSlackBlock = (block: any, indent_level: number) => 
{
//  console.log(block)
  switch(block.type) {
  case "title":
    return { type: "header", "text": { type:"plain_text", "text": block.title[0].text.content, "emoji": true } };
  case "heading_1":
    return { type: "header", "text": { type:"plain_text", "text": block.heading_1.text[0].plain_text, "emoji": true } };
  case "heading_2":
  case "heading_3":
    return { type: "section", "text": { type:"plain_text", "text": block[block.type].text[0].plain_text, "emoji": true } };
  case "bulleted_list_item":
  case "paragraph":
    let text = "";
    for(let i=0; i<block[block.type].text.length; ++i){
      for(let j=0; j<indent_level; ++j){
        text += "　";
      }
      
      if(block.type == "bulleted_list_item")
      {
        text += "・";
      }
      
      if(block[block.type].text[i].href)
      {
        text += block[block.type].text[i].plain_text.replace(block[block.type].text[i].href, "<" + block[block.type].text[i].href + ">");
      }
      else
      {
        text += block[block.type].text[i].plain_text
      }
      text += "\n";
    }
    if(text == "") return null;
    return { type: "section", "text": { type:"mrkdwn", "text": text } };
  }
  /*
	"accessory": {
		"type": "button",
		"text": {
			"type": "plain_text",
			"text": "Click Me",
			"emoji": true
		},
		"value": "click_me_123",
		"url": "https://google.com",
		"action_id": "button-action"
			}
	*/
  return null;
}

exports.convertToSlackUser = (user: any) =>
{
  return {
    username: user.name,
    icon_url: user.avatar_url
  }
}

export type NotionPage = {
	Title:string;
	Page: Array<any>;
}

/*
(async function(){
	let config = await getNotionPages("2f4d5a0435b349e5ac21e6d38ba1da2a");
	console.log(config);
	return;
	
	let users = await getNotionUsers();
	console.log(users);
	return;
	
	let result = await getTasksFromNotionDatabase();
	
	console.log(JSON.stringify(result[0], null, 2));
	console.log(result[0]["作成者"].created_by);
	console.log(result[0]["Title"].title);
	console.log(result[0]["Title"].title);
	//let result2 = await getTasksFromNotionDatabase();
	//console.log(result);
})();
*/