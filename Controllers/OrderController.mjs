import { v4 } from "uuid"; // generates a unique ID for each new order
import OrderRepository from "../Database/OrderRepository.mjs"; // persists orders and their items
import { errorController } from "./ErrorController.mjs"; // sends error pages on failure
import { HTTP_STATUS, OrderStatus, OrderLimits } from "../Utils/constants.mjs"; // status constants and business rule limits
import { parseBody } from "../Utils/bodyParser.mjs"; // reads and decodes the POST request body
import { verifyToken } from "../Utils/token.mjs"; // reads the JWT cookie to identify the logged-in customer
import { renderHTML } from "../Utils/renderHTML.mjs"; // renders an HTML template with injected data

const repository = new OrderRepository(); // single repository instance reused across all handlers

export const orderController = {
  // handles POST /cart/add — adds one item to the customer's in-progress cart for a restaurant
  addToCart: async (req, res) => {
    try {
      const { userId } = await verifyToken(req);
      const { restaurantId, itemName, itemPrice } = await parseBody(req);
      let cartOrder = await repository.findCartOrder(userId, restaurantId);
      if (!cartOrder) {
        const activeOrders = await repository.findActiveByCustomerId(userId);
        if (activeOrders.length >= OrderLimits.MAX_ACTIVE_ORDERS) {
          return errorController(HTTP_STATUS.BAD_REQUEST, req, res);
        }
        const orderId = v4();
        await repository.createOrder(orderId, userId, restaurantId, OrderStatus.INCOMPLETE);
        cartOrder = { orderId };
      }
      await repository.addOrderItem(cartOrder.orderId, itemName, Number(itemPrice));
      res.writeHead(HTTP_STATUS.TEMP_REDIRECT, { Location: `/restaurant/menu?id=${restaurantId}` });
      res.end();
    } catch {
      errorController(HTTP_STATUS.SERVER_ERROR, req, res);
    }
  },

  // handles POST /order/create — submits the customer's existing cart for this restaurant
  create: async (req, res) => {
    try {
      const { userId } = await verifyToken(req);
      const { restaurantId } = await parseBody(req);
      const cartOrder = await repository.findCartOrder(userId, restaurantId);
      if (!cartOrder) return errorController(HTTP_STATUS.BAD_REQUEST, req, res);
      await repository.updateStatus(cartOrder.orderId, OrderStatus.SUBMITTED);
      res.writeHead(HTTP_STATUS.TEMP_REDIRECT, { Location: `/order?id=${cartOrder.orderId}` });
      res.end();
    } catch {
      errorController(HTTP_STATUS.SERVER_ERROR, req, res);
    }
  },

  // handles GET /order?id=... — renders the order detail page for the logged-in customer
  view: async (req, res) => {
    try {
      await verifyToken(req);
      const url = new URL(req.url, `http://${req.headers.host}`); // parses the URL to extract query params
      const orderId = url.searchParams.get("id"); // reads the order ID from the ?id= query string
      const order = await repository.findById(orderId); // fetches the order row from the DB
      if (!order) return errorController(HTTP_STATUS.NOT_FOUND, req, res); // sends 404 if the order doesn't exist
      const items = await repository.findItemsByOrderId(orderId); // fetches all items belonging to this order
      const orderItems = items.length
        ? items.map(i => `<li><div class="order-meta"><span>${i.itemName}</span><small>× ${i.quantity || 1} — $${(Number(i.price) * (i.quantity || 1)).toFixed(2)}</small></div></li>`).join("")
        : "<li class='empty'>No items in this order.</li>";
      const totalPrice = items.reduce((sum, i) => sum + Number(i.price), 0).toFixed(2); // sums item prices to two decimals
      await renderHTML(res, "Customer-OrderView.html", {
        orderId: order.orderId, // injected into {{orderId}} in the view
        orderStatus: order.status, // injected into {{orderStatus}} in the view
        orderItems, // injected into {{orderItems}} in the view
        totalPrice, // injected into {{totalPrice}} in the view
      });
    } catch {
      errorController(HTTP_STATUS.UNAUTHORIZED, req, res); // sends 401 if token is missing or expired
    }
  },

  // handles POST /order/cancel — cancels an existing order if it has not yet been picked up
  cancel: async (req, res) => {
    try {
      const { userId } = await verifyToken(req); // confirms the customer is authenticated and reads their ID
      const { orderId } = await parseBody(req); // reads the order ID from the hidden form field
      const order = await repository.findById(orderId); // fetches the order to verify ownership and current status
      if (!order) return errorController(HTTP_STATUS.NOT_FOUND, req, res); // sends 404 if the order doesn't exist
      if (order.customerId !== userId) return errorController(HTTP_STATUS.UNAUTHORIZED, req, res); // prevents cancelling another customer's order
      if (order.status === OrderStatus.ONTHEWAY || order.status === OrderStatus.DELIVERED) { // can't cancel once a courrier has picked it up
        return errorController(HTTP_STATUS.BAD_REQUEST, req, res);
      }
      await repository.updateStatus(orderId, OrderStatus.INCOMPLETE); // marks the order as Incomplete Cart (cancelled)
      res.writeHead(HTTP_STATUS.TEMP_REDIRECT, { Location: "/home" }); // redirects back to the customer home page
      res.end();
    } catch {
      errorController(HTTP_STATUS.SERVER_ERROR, req, res); // sends 500 if anything goes wrong
    }
  },
};
