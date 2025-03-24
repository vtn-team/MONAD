import { DataType, PagePropertyScheme, WordPropertyScheme, NotePropertyScheme, NotionDBInfo, TableInfo } from "./dataScheme"
import { getNodeWithRelations } from "./../lib/neo4j"

//対象のNeo4jのデータを返す
export async function getNode(type: DataType, dataKey: string) {
	let info = TableInfo[type];
	let result = await getNodeWithRelations(DataType.PAGE, info.DataKey, dataKey);
	
	if(!result) return null;
	if(result.records.length == 0) return null;
	
	let data = [];
	let baseNode = null;
	for(let md of result.records) {
		let db = md.get("monad");
		data.push(db.end);

		//必ずpageからのリレーションとなっているので、startはpageで確定
		if (baseNode == null && db.start.labels[0] == DataType.PAGE) {
			baseNode = db.start;
		}
	}
	
	baseNode = baseNode.properties;
	baseNode.Child = JSON.parse(baseNode.Child);
	baseNode.Contents = JSON.parse(baseNode.Contents);

	let returns:any = {
		Page: baseNode,
		Words: [],
		Notes: [],
	};

	for (let n of data) {
		switch (n.labels[0]) {
			case DataType.NOTE:
				{
					let node:any = n.properties;
					node.Contents = JSON.parse(node.Contents);
					returns.Notes.push(node);
				}
				break;

			case DataType.WORD:
				{
					let node:any = n.properties;
					node.Link = JSON.parse(node.Link);
					node.LastEditedBy = JSON.parse(node.LastEditedBy);
					node.Contents = JSON.parse(node.Contents);
					returns.Words.push(node);
				}
				break;
		}
	}


	console.log(returns);
	console.log(data);

	return returns;
}
