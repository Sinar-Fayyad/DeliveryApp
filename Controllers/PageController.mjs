import { errorController } from "./ErrorController.mjs"; // sends error pages on failure
import { sendHTML } from "../Utils/sendHTML.mjs"; // sends a static HTML file with no data injection
import { sendCSS } from "../Utils/sendCSS.mjs"; // reads and sends a CSS file from Views/Styles/
import { renderHTML } from "../Utils/renderHTML.mjs"; // renders an HTML template with injected data
import { verifyToken } from "../Utils/token.mjs"; // reads and verifies the JWT from the request cookie
import { HTTP_STATUS } from "../Utils/constants.mjs"; // HTTP status code constants
import RestaurantRepository from "../Database/RestaurantRepository.mjs"; // reads restaurant and menu data from the DB
import OrderRepository from "../Database/OrderRepository.mjs"; // reads the customer's active cart for this restaurant

const restaurantRepo = new RestaurantRepository(); // single instance reused across all page handlers
const orderRepo = new OrderRepository();

export const pageController = {
  // serves GET /login — static login form, no data injection needed
  login: async (req, res) => {
    try {
      await sendHTML(res, "Auth-LoginView.html");
    } catch {
      errorController(HTTP_STATUS.SERVER_ERROR, req, res);
    }
  },

  // serves GET /register — static registration form, no data injection needed
  register: async (req, res) => {
    try {
      await sendHTML(res, "Auth-RegisterView.html");
    } catch {
      errorController(HTTP_STATUS.SERVER_ERROR, req, res);
    }
  },

  // serves GET /home — renders the customer home page with their email and restaurant list
  home: async (req, res) => {
    try {
      const { userEmail } = await verifyToken(req);
      const restaurants = await restaurantRepo.findAll(); // fetches every restaurant row from the DB
      const restaurantList = restaurants.length
        ? restaurants.map(r => `<li><div class="order-meta"><a href="/restaurant/menu?id=${r.restaurantId}" style="color:var(--text); text-decoration:none; font-weight:600;">${r.restaurantName}</a><small>Tap to browse menu</small></div></li>`).join("")
        : "<li class='empty'>No restaurants available yet.</li>";
      await renderHTML(res, "User-HomeView.html", {
        userEmail, // injected into {{userEmail}} in the view
        restaurantList, // injected into {{restaurantList}} in the view
      });
    } catch {
      res.writeHead(HTTP_STATUS.TEMP_REDIRECT, { Location: "/login" }); // token missing or expired — send user to login instead of error page
      res.end();
    }
  },

  // serves GET /restaurant/menu?id=... — renders a restaurant's menu page for a logged-in customer
  restaurantMenu: async (req, res) => {
    try {
      const { userId } = await verifyToken(req);
      const url = new URL(req.url, `http://${req.headers.host}`);
      const restaurantId = url.searchParams.get("id");
      const restaurant = await restaurantRepo.findById(restaurantId);
      if (!restaurant) return errorController(HTTP_STATUS.NOT_FOUND, req, res);

      const items = await restaurantRepo.findMenuByRestaurantId(restaurantId);
      const menuItems = items.length
        ? items.map(i =>
            `<li>
              <div class="order-meta">
                <span>${i.name} — <strong style="color:var(--red);">$${Number(i.price).toFixed(2)}</strong></span>
                <small>${i.description ?? ""}</small>
              </div>
              <div class="order-actions">
                <form method="POST" action="/cart/add" class="inline-form">
                  <input type="hidden" name="restaurantId" value="${restaurantId}" />
                  <input type="hidden" name="itemName" value="${i.name}" />
                  <input type="hidden" name="itemPrice" value="${i.price}" />
                  <button type="submit" class="btn-add">+ Add</button>
                </form>
              </div>
            </li>`).join("")
        : "<li class='empty'>No menu items yet.</li>";

      // load any existing in-progress cart for this customer + restaurant
      const cartOrder = await orderRepo.findCartOrder(userId, restaurantId);
      let cartItems = "<li class='empty'>Your cart is empty.</li>";
      let totalPrice = "0.00";
      let checkoutDisabled = "disabled";

      if (cartOrder) {
        const cartRows = await orderRepo.findItemsByOrderId(cartOrder.orderId);
        if (cartRows.length) {
          cartItems = cartRows
            .map(i => `<li><div class="order-meta"><span>${i.itemName}</span><small>× ${i.quantity} — $${(Number(i.price) * i.quantity).toFixed(2)}</small></div></li>`)
            .join("");
          totalPrice = cartRows
            .reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
            .toFixed(2);
          checkoutDisabled = "";
        }
      }

      await renderHTML(res, "Customer-RestaurantMenuView.html", {
        restaurantName: restaurant.restaurantName,
        menuItems,
        cartItems,
        totalPrice,
        restaurantId,
        checkoutDisabled,
      });
    } catch {
      res.writeHead(HTTP_STATUS.TEMP_REDIRECT, { Location: "/login" });
      res.end();
    }
  },

  // serves GET /restaurant/register — static registration form for restaurant managers
  restaurantRegister: async (req, res) => {
    try {
      await sendHTML(res, "Restaurant-RegisterView.html");
    } catch {
      errorController(HTTP_STATUS.SERVER_ERROR, req, res);
    }
  },

  // serves GET /restaurant/login — static login form for restaurant managers
  restaurantLogin: async (req, res) => {
    try {
      await sendHTML(res, "Restaurant-LoginView.html");
    } catch {
      errorController(HTTP_STATUS.SERVER_ERROR, req, res);
    }
  },

  // serves GET /courrier/register — static registration form for couriers
  courrierRegister: async (req, res) => {
    try {
      await sendHTML(res, "Courrier-RegisterView.html");
    } catch {
      errorController(HTTP_STATUS.SERVER_ERROR, req, res);
    }
  },

  // serves GET /courrier/login — static login form for couriers
  courrierLogin: async (req, res) => {
    try {
      await sendHTML(res, "Courrier-LoginView.html");
    } catch {
      errorController(HTTP_STATUS.SERVER_ERROR, req, res);
    }
  },

  // serves GET /index.css — stylesheet for login and register pages
  styleIndex: async (req, res) => {
    try {
      await sendCSS(res, "index.css");
    } catch {
      errorController(HTTP_STATUS.SERVER_ERROR, req, res);
    }
  },

  // serves GET /error.css — stylesheet for all error pages
  styleError: async (req, res) => {
    try {
      await sendCSS(res, "error.css");
    } catch {
      errorController(HTTP_STATUS.SERVER_ERROR, req, res);
    }
  },

  // serves GET /dashboard.css — stylesheet for all dashboard pages
  styleDashboard: async (req, res) => {
    try {
      await sendCSS(res, "dashboard.css");
    } catch {
      errorController(HTTP_STATUS.SERVER_ERROR, req, res);
    }
  },
};
