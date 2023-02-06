//jshint esversion:8
 
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();
 
mongoose.set('strictQuery', false);
 
const app = express();
 
const PORT = process.env.PORT || 3000;
 
app.set('view engine', 'ejs');
mongoose.set('strictQuery', true);
 
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
 
// Connection process with moded env
const connectDB = async () => {
  try {
    mongoose.connect('mongodb+srv://' + process.env.ADMIN_NAME + ':' + process.env.ADMIN_PASS + '@cluster0.yw3nhgj.mongodb.net/todolistDB', {
      useNewUrlParser: true
    });
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.log("NEW ERROR JAGG " + error);
    process.exit(1);
  }
};
 
 
const itemsSchema = {
  name: String
};
 
const Item = mongoose.model("Item", itemsSchema);
 
const item1 = new Item({
  name: "Welcome to your todolist!"
});
 
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
 
const item3 = new Item({
  name: "<-- Hit this to delete an item.>"
});
 
const defaultItems = [item1, item2, item3];
 
const listSchema = {
  name: String,
  items: [itemsSchema]
};
 
const List = mongoose.model("List", listSchema);
 
app.get("/", function (req, res) {
 
  Item.find({}, (err, items) => {
    if (items.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: items
      });
    }
  });
});
 
app.post("/", function (req, res) {
 
  const itemName = req.body.newItem;
  const listName = req.body.list;
 
  const item = new Item({
    name: itemName
  });
 
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
 
app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
 
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log(checkedItemId + " removed from database.");
        res.redirect("/");
      }
    });
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.pull({_id: checkedItemId});
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
 
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
 
  List.findOne({
    name: customListName
  }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
 
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show an existing list
 
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});
 
app.get("/about", function (req, res) {
  res.render("about");
});
 
 
// Connect to the database before listening
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("JAGG listening for requests");
  });
});