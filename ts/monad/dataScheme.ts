//ノードタイプの定義
export enum DataType {
	PAGE = "PAGE",
	WORD = "WORD",
	NOTE = "NOTE"
};

//ページのNotionテーブルスキーマ
//NOTE: カラムの追加は簡単だがデータがあることを保証することは難しい
export const PagePropertyScheme:any = [
	{ Name: "Title", Style: "title", Type: "text" },
	{ Name: "Origin", Style: "rich_text", Type: "text" },
	{ Name: "Path", Style: "rich_text", Type: "text" }
];

//単語のNotionテーブルスキーマ
//NOTE: カラムの追加は簡単だがデータがあることを保証することは難しい
export const WordPropertyScheme:any = [
	{ Name: "Word", Style: "title", Type: "text" },
	{ Name: "RefID", Style: "number", Type: "number" },
];

//ノートのNotionテーブルスキーマ
//NOTE: カラムの追加は簡単だがデータがあることを保証することは難しい
//NOTE: ノートはページの子オブジェクトとして作っている
export const NotePropertyScheme:any = [
	{ Name: "Title", Style: "title", Type: "text" },
];

//Notionデータベース設定
export type NotionDBInfo = {
	DatabaseId: string;		//データベースのルートID
	KeyName: string;		//主キー
	UseContents: boolean;	//ページ内部のコンテンツを取得するかどうか(falseはプロパティのみ)
};

//データベース情報
export const TableInfo:any = {
	PAGE: {
		DatabaseId : "1b839cbfbab980b49498f62844cb12b9",
		DataKey: "URI",
		DataType: "rich_text",
		UseContents: true,
		Scheme: PagePropertyScheme,
	},
	WORD: {
		DatabaseId : "1ba39cbfbab980adaf6bc97edae68811",
		DataKey: "Word",
		DataType: "title",
		UseContents: false,
		Scheme: WordPropertyScheme,
	},
	NOTE: {
		DatabaseId : "ROOT",
		DataKey: "Title",
		DataType: "title",
		UseContents: true,
		Scheme: NotePropertyScheme,
	},
};