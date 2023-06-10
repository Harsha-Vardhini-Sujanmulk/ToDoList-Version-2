const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("Public"));
mongoose.set("strictQuery", false);

// Define the database URL to connect to.
const mongoDB = "mongodb://127.0.0.1/todolistDB";

// Wait for database to connect, logging an error if there is a problem
main().catch((err) => console.log(err));
async function main() {
	await mongoose.connect(mongoDB);
}
const itemsSchema = {
	name: String,
};
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
	name: "Welcome to your todolist!",
});
const item2 = new Item({
	name: "Hit the + button to add a new item.",
});
const item3 = new Item({
	name: "<-- Hit this to delete an item.",
});
const defaultItems = [item1, item2, item3];

const listSchema = {
	name: String,
	items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);
app.get("/", (req, res) => {
	Item.find().then(function (foundItems) {
		if (foundItems.length === 0) {
			Item.insertMany(defaultItems)
				.then(function () {
					console.log("Successfully saved default items to DB");
				})
				.catch(function (err) {
					console.log(err);
				});
			res.redirect("/");
		} else {
			res.render("list", {
				listTitle: "Today",
				newListItems: foundItems,
			});
		}
	});
});

app.post("/", (req, res) => {
	const itemName = req.body.newItem;
	const listName = req.body.list;
	const item = new Item({
		name: itemName,
	});
	if (listName === "Today") {
		item.save();
		res.redirect("/");
	} else {
		List.findOne({ name: listName })
			.then((foundList) => {
				foundList.items.push(item);
				foundList.save();
				res.redirect("/" + listName);
			})
			.catch((err) => {
				console.log(err);
			});
	}
});
// app.js : ToDoList Version - 1\app.js
// about.ejs : views\about.ejs

app.get("/:customListName", (req, res) => {
	const customListName = _.capitalize(req.params.customListName);

	List.findOne({ name: customListName })
		.then((foundList) => {
			if (!foundList) {
				const list = new List({
					name: customListName,
					items: defaultItems,
				});
				list.save();
				res.redirect("/" + customListName);
			} else {
				// show an existing list
				res.render("list", {
					listTitle: foundList.name,
					newListItems: foundList.items,
				});
			}
		})
		.catch((err) => {
			console.log(err);
		});
});

app.post("/delete", (req, res) => {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;
	if (listName === "Today") {
		Item.findByIdAndRemove(checkedItemId).then(function (foundItems) {
			res.redirect("/");
		});
	} else {
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { items: { _id: checkedItemId } } }
		).then(function (foundList) {
			res.redirect("/" + listName);
		});
	}
});
app.get("/about", (req, res) => {
	res.render("about");
});
app.listen(3000, () => {
	console.log("server started on port 3000");
});
