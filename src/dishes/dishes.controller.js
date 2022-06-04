
   
const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

//Middleware functions:

/// if dishEXIST
const dishExists = (req, res, next) => {
   const dishId = req.params.dishId;
   res.locals.dishId = dishId;
   const foundDish = dishes.find((dish) => dish.id === dishId);
   if (!foundDish) {
      return next({
         status: 404, 
         message: `Dish not found: ${dishId}` });
   }
   res.locals.dish = foundDish;
};

/// IF DISH HAS A VALID NAME

const dishValidName = (req, res, next) => {
   const { data = null } = req.body;
   res.locals.newDish = data;
   const dishName = data.name;
   if (!dishName || dishName.length === 0) {
      return next({
         status: 400,
         message: "Dish must include a name",
      });
   }
};

/// IF DISH  HAS A DESCRIPTION 
const dishHasDescription = (req, res, next) => {
   const dishDescription = res.locals.newDish.description;
   if (!dishDescription || dishDescription.length === 0) {
      return next({
         status: 400,
         message: "Dish must include a description",
      });
   }
};

//// IF  DISH HAS A PRICE 
const dishHasPrice = (req, res, next) => {
   const dishPrice = res.locals.newDish.price;
   if (!dishPrice || typeof dishPrice != "number" || dishPrice <= 0) {
      return next({
         status: 400,
         message: "Dish must have a price that is an integer greater than 0",
      });
   }
};

// IF DISH HAS AN IMAGE 

const dishHasImg = (req, res, next) => {
   const dishImage = res.locals.newDish.image_url;
   if (!dishImage || dishImage.length === 0) {
      return next({
         status: 400,
         message: "Dish must include an image_url",
      });
   }
};

const dishIdMatches = (req, res, next) => {
   const paramId = res.locals.dishId;
   const { id = null } = res.locals.newDish;
   if (paramId != id && id) {
      return next({
         status: 400,
         message: `Dish id does not match route id. Dish: ${id}, Route: ${paramId}`,
      });
   }
};

// grouped validations 
const createValidation = (req, res, next) => {
   dishValidName(req, res, next);
   dishHasDescription(req, res, next);
   dishHasPrice(req, res, next);
   dishHasImg(req, res, next);
   next();
};

const readValidation = (req, res, next) => {
   dishExists(req, res, next);
   next();
};

const updateValidation = (req, res, next) => {
   dishExists(req, res, next);
   dishValidName(req, res, next);
   dishHasDescription(req, res, next);
   dishHasPrice(req, res, next);
   dishHasImg(req, res, next);
   dishIdMatches(req, res, next);
   next();
};

//Handlers:
function create(req, res) {
   const newDishData = res.locals.newDish;
   newDishData.id = nextId();
   dishes.push(newDishData);
   res.status(201).json({ data: newDishData });
}

function read(req, res) {
   res.status(200).json({ data: res.locals.dish });
}

function update(req, res) {
   const newData = res.locals.newDish;
   const oldData = res.locals.dish;
   const index = dishes.indexOf(oldData);
   for (const key in newData) {
      dishes[index][key] = newData[key];
   }
   res.status(200).json({ data: dishes[index] });
}

function list(req, res) {
   res.status(200).json({ data: dishes });
}

module.exports = {
   create: [createValidation, create],
   read: [readValidation, read],
   update: [updateValidation, update],
   list,
};
