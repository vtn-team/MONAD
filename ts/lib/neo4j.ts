var neo4j = require('neo4j-driver');
import { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } from "./../config/config"
const { v4: uuidv4 } = require('uuid')

let driver:any = null;

export async function setupNeo4j() {
	driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
    const serverInfo = await driver.getServerInfo()
    console.log('Connection established')
    console.log(serverInfo)
}

// キーワードの取得
export async function getNode(typeName: string, keyName: string, keyString: string) {
	const session = driver.session();

	try {
		const result = await session.run(
		  `MATCH (n:${typeName} { ${keyName}: $keyString }) RETURN n`,
		  { keyString }
		);
		return result;
	} catch (error) {
		console.error('Error find keyword:', error);
	} finally {
		await session.close();
	}
	
	return null;
}

// キーワードの取得
export async function getNodeWithRelations(typeName: string, keyName: string, keyString: string, depth: number = 0) {
	const session = driver.session();

	try {
		let query = "";
		if(depth <= 1){
			query = `MATCH monad = (n:${typeName} { ${keyName}: $keyString })-[]-(o) RETURN monad`;
		}else{
			query = `MATCH monad = (n:${typeName} { ${keyName}: $keyString })-[:RELATED*1..${depth}]-(o) RETURN monad`;
		}
		
		const result = await session.run(
		  query,
		  { keyString }
		);
		return result;
	} catch (error) {
		console.error('Error find node:', error);
	} finally {
		await session.close();
	}
	
	return null;
}

export async function createNode(typeName: string, data: any) {
	const session = driver.session();

	try {
		data.Neo4jID = uuidv4();
		await session.run(
			`CREATE (n:${typeName} $data)`,
      		{ data }
		);
		console.log(`Node has been created.`);
		return data.Neo4jID;
	} catch (error) {
		console.error('Error creating node:', error);
	} finally {
		await session.close();
	}
	
	return null;
}

export async function createRelationship(baseId: string, targetId: string, relation: string) {
	const session = driver.session();
	try {
		// まずは、キーワードが存在するか確認しながら関連性を作成
		await session.run(
			`
			MATCH (a { Neo4jID: $baseId })
			MATCH (b { Neo4jID: $targetId })
			MERGE (a)-[r:RELEVANCY]->(b)
			SET r.relation = $relation
			`,
			{ baseId, targetId, relation }
	);
	console.log(`Relationship created between "${baseId}" and "${targetId}" with relation: ${relation}`);
	
	} catch (error) {
		console.error('Error creating relationship:', error);
	} finally {
		await session.close();
	}
}

export async function updateNode(typeName: string, nodeId: string, data: any) {
	const session = driver.session();

	try {
		// Remove Neo4jID from data to prevent overwriting it
		const updateData = { ...data };
		delete updateData.Neo4jID;
		
		// Update the node properties
		const result = await session.run(
			`
			MATCH (n:${typeName} { Neo4jID: $nodeId })
			SET n += $updateData
			RETURN n
			`,
			{ nodeId, updateData }
		);
		
		if (result.records.length === 0) {
			console.log(`Node with ID ${nodeId} not found.`);
			return null;
		}
		
		console.log(`Node with ID ${nodeId} has been updated.`);
		return result.records[0].get('n').properties;
	} catch (error) {
		console.error('Error updating node:', error);
	} finally {
		await session.close();
	}
	
	return null;
}

export async function deleteNode(typeName: string, nodeId: string) {
	const session = driver.session();

	try {
		// First, delete all relationships connected to this node
		await session.run(
			`
			MATCH (n:${typeName} { Neo4jID: $nodeId })-[r]-()
			DELETE r
			`,
			{ nodeId }
		);
		
		// Then delete the node itself
		const result = await session.run(
			`
			MATCH (n:${typeName} { Neo4jID: $nodeId })
			DELETE n
			RETURN count(n) as deletedCount
			`,
			{ nodeId }
		);
		
		const deletedCount = result.records[0].get('deletedCount').toNumber();
		if (deletedCount === 0) {
			console.log(`Node with ID ${nodeId} not found.`);
			return false;
		}
		
		console.log(`Node with ID ${nodeId} has been deleted.`);
		return true;
	} catch (error) {
		console.error('Error deleting node:', error);
	} finally {
		await session.close();
	}
	
	return false;
}

export async function deleteRelationship(baseId: string, targetId: string, relation?: string) {
	const session = driver.session();
	try {
		let query;
		let params;
		
		if (relation) {
			// Delete specific relationship type
			query = `
				MATCH (a { Neo4jID: $baseId })-[r:RELEVANCY { relation: $relation }]->(b { Neo4jID: $targetId })
				DELETE r
				RETURN count(r) as deletedCount
			`;
			params = { baseId, targetId, relation };
		} else {
			// Delete any relationship between the nodes
			query = `
				MATCH (a { Neo4jID: $baseId })-[r:RELEVANCY]->(b { Neo4jID: $targetId })
				DELETE r
				RETURN count(r) as deletedCount
			`;
			params = { baseId, targetId };
		}
		
		const result = await session.run(query, params);
		const deletedCount = result.records[0].get('deletedCount').toNumber();
		
		if (deletedCount === 0) {
			console.log(`No relationship found between "${baseId}" and "${targetId}"`);
			return false;
		}
		
		console.log(`Relationship deleted between "${baseId}" and "${targetId}"`);
		return true;
	} catch (error) {
		console.error('Error deleting relationship:', error);
	} finally {
		await session.close();
	}
	
	return false;
}


// キーワードの取得
export async function getKeywords(keyword: string, category: string) {
	const session = driver.session();

	try {
		const result = await session.run(
		  'MATCH (k:Keyword { Word: $keyword, Category: $category }) RETURN k',
		  { keyword, category }
		);
		return result;
	} catch (error) {
		console.error('Error find keyword:', error);
	} finally {
		await session.close();
	}
	
	return null;
}

// キーワードとリレーションの取得
export async function deepSearchKeywordOnly(keyword: string, depth: number) {
	const session = driver.session();

	try {
		let query = "";
		if(depth <= 1){
			query = `MATCH kw = (k:Keyword { Word: $keyword })-[]-(other:Keyword) RETURN kw`;
		}else{
			query = `MATCH kw = (k:Keyword { Word: $keyword })-[:RELATED*1..${depth}]-(other:Keyword) RETURN kw`;
		}
		const result = await session.run(
		  query,
		  { keyword }
		);
		return result;
	} catch (error) {
		console.error('Error find keyword:', error);
	} finally {
		await session.close();
	}
	
	return null;
}

// キーワードとリレーションの取得
export async function deepSearch(keyword: string, category: string, depth: number) {
	const session = driver.session();

	try {
		let query = "";
		if(depth <= 1){
			query = `MATCH kw = (k:Keyword { Word: $keyword, Category: $category })-[]-(other:Keyword) RETURN kw`;
		}else{
			query = `MATCH kw = (k:Keyword { Word: $keyword, Category: $category })-[:RELATED*1..${depth}]-(other:Keyword) RETURN kw`;
		}
		const result = await session.run(
		  query,
		  { keyword, category }
		);
		return result;
	} catch (error) {
		console.error('Error find keyword:', error);
	} finally {
		await session.close();
	}
	
	return null;
}
