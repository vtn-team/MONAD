//�m�[�h�^�C�v�̒�`
export enum DataType {
	PAGE = "PAGE",
	WORD = "WORD",
	NOTE = "NOTE"
};

//�y�[�W��Notion�e�[�u���X�L�[�}
//NOTE: �J�����̒ǉ��͊ȒP�����f�[�^�����邱�Ƃ�ۏ؂��邱�Ƃ͓��
export const PagePropertyScheme:any = [
	{ Name: "Title", Style: "title", Type: "text" },
	{ Name: "Origin", Style: "rich_text", Type: "text" },
	{ Name: "Path", Style: "rich_text", Type: "text" }
];

//�P���Notion�e�[�u���X�L�[�}
//NOTE: �J�����̒ǉ��͊ȒP�����f�[�^�����邱�Ƃ�ۏ؂��邱�Ƃ͓��
export const WordPropertyScheme:any = [
	{ Name: "Word", Style: "title", Type: "text" },
	{ Name: "RefID", Style: "number", Type: "number" },
];

//�m�[�g��Notion�e�[�u���X�L�[�}
//NOTE: �J�����̒ǉ��͊ȒP�����f�[�^�����邱�Ƃ�ۏ؂��邱�Ƃ͓��
//NOTE: �m�[�g�̓y�[�W�̎q�I�u�W�F�N�g�Ƃ��č���Ă���
export const NotePropertyScheme:any = [
	{ Name: "Title", Style: "title", Type: "text" },
];

//Notion�f�[�^�x�[�X�ݒ�
export type NotionDBInfo = {
	DatabaseId: string;		//�f�[�^�x�[�X�̃��[�gID
	KeyName: string;		//��L�[
	UseContents: boolean;	//�y�[�W�����̃R���e���c���擾���邩�ǂ���(false�̓v���p�e�B�̂�)
};

//�f�[�^�x�[�X���
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