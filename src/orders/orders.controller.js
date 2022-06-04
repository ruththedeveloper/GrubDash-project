const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// Middleware functions:
const orderExists = (req, res, next) => {
  const orderId = req.params.orderId;
  res.locals.orderId = orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (!foundOrder) {
    return next({
      status: 404,
      message: `Order not found: ${orderId}`,
    });
  }
  res.locals.order = foundOrder;
};



////// order valid deliver to
const orderValidDeliverTo = (req, res, next) => {
  const { data = null } = req.body;
  res.locals.newOrderD = data;
  const orderdeliverTo = data.deliverTo;
  if (!orderdeliverTo || orderdeliverTo.length === 0) {
    return next({
      status: 400,
      message: "Order must include a deliverTo",
    });
  }
};


/// valid mobile Number 

const orderHasValidMobileNumber = (req, res, next) => {
  const orderMobileNumber = res.locals.newOrderD.mobileNumber;
  if (!orderMobileNumber || orderMobileNumber.length === 0) {
    return next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
  }
};

/// order has dishes 

const orderHasDishes = (req, res, next) => {
  const orderDishes = res.locals.newOrderD.dishes;
  if (!orderDishes || !Array.isArray(orderDishes) || orderDishes.length <= 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  res.locals.dishes = orderDishes;
};

///order has valid dishes 

const orderHasValidDishes = (req, res, next) => {
  const orderDishes = res.locals.dishes;
  orderDishes.forEach((dish) => {
    const dishQuantity = dish.quantity;
    if (!dishQuantity || typeof dishQuantity != "number" || dishQuantity <= 0) {
      return next({
        status: 400,
        message: `Dish ${orderDishes.indexOf(
          dish
        )} must have a quantity that is an integer greater than 0`,
      });
    }
  });
};

/// order id matches 

const orderIdMatches = (req, res, next) => {
  const paramId = res.locals.orderId;
  const { id = null } = res.locals.newOrderD;
  if (!id || id === null) {
    res.locals.newOrderD.id = res.locals.orderId;
  } else if (paramId != id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${paramId}`,
    });
  }
};

/// incoming status is valid 
const incomingStatusIsValid = (req, res, next) => {
  const { status = null } = res.locals.newOrderD;
  if (!status || status.length === 0 || status === "invalid") {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
};



const deliveredStatusIsValid = (req, res, next) => {
  const { status = null } = res.locals.order;
  if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
};

const StatusIsPending = (req, res, next) => {
  const { status = null } = res.locals.order;
  if (status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
};

//Clarity Middleware Functions
const createValidation = (req, res, next) => {
  orderValidDeliverTo(req, res, next);
  orderHasValidMobileNumber(req, res, next);
  orderHasDishes(req, res, next);
  orderHasValidDishes(req, res, next);
  next();
};

const readValidation = (req, res, next) => {
  orderExists(req, res, next);
  next();
};

const updateValidation = (req, res, next) => {
  orderExists(req, res, next);
  orderValidDeliverTo(req, res, next);
  orderHasValidMobileNumber(req, res, next);
  orderHasDishes(req, res, next);
  orderHasValidDishes(req, res, next);
  orderIdMatches(req, res, next);
  incomingStatusIsValid(req, res, next);
  deliveredStatusIsValid(req, res, next);
  next();
};

const deleteValidation = (req, res, next) => {
  orderExists(req, res, next);
  StatusIsPending(req, res, next);
  next();
};

 
//Handlers functions :
function create(req, res) {
  const newOrderData = res.locals.newOrderD;
  newOrderData.id = nextId();
  orders.push(newOrderData);
  res.status(201).json({ data: newOrderData });
}

function read(req, res) {
  res.status(200).json({ data: res.locals.order });
}
 ////// update
function update(req, res) {
  const newData = res.locals.newOrderD;
  const oldData = res.locals.order;
  const index = orders.indexOf(oldData);
  for (const key in newData) {
    orders[index][key] = newData[key];
  }
  res.status(200).json({ data: orders[index] });
}

/// List 
function list(req, res) {
  res.status(200).json({ data: orders });
}


///// Delete
function destroy(req, res) {
  const index = orders.indexOf(res.locals.order);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  create: [createValidation, create],
  read: [readValidation, read],
  update: [updateValidation, update],
  delete: [deleteValidation, destroy],
  list,
};
