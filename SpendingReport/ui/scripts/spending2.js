
//class Filter {
//	constructor() {

//	}
//}

//class Category {
//	constructor() {

//	}
//}

class Group {

	constructor(id, description) {
		this.id = id;
		this.description = description;
	}

	getName() {
		return this.id + ": " + this.description;
	}
}

class Transaction {

	constructor(id, inputFileId, amount, description, categoryId, tag, groupId) {
		this.id = id;
		this.inputFileId = inputFileId;
		this.amount = amount;
		this.description = description;
		this.categoryId = categoryId;
		this.tag = tag;
		this.groupId = groupId;
	}

	getName() {
		return this.id + ": " + this.amount + "e (" + this.description + ")"; 
	}
}


function sp2Test() {

	var t = new Transaction(1, 1, 100.5, "asdfasdasddf");
	console.log(t.getName());
}