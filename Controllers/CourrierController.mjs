import Courrier from "../Models/Courrier.mjs"; // Courrier model — register and login logic
import { errorController } from "./ErrorController.mjs"; // sends error pages on failure
import { HTTP_STATUS, UserRoles, OrderStatus } from "../Utils/constants.mjs"; // role, status, and order status constants
import { parseBody } from "../Utils/bodyParser.mjs"; // reads and decodes the POST request body
import { issueToken, verifyToken } from "../Utils/token.mjs";
import { renderHTML } from "../Utils/renderHTML.mjs"; // renders an HTML template with injected data
import DeliveryAssignmentRepository from "../Database/DeliveryAssignmentRepository.mjs"; // reads assignments for this courrier
import DeliveryAssignment from "../Models/DeliveryAssignment.mjs"; // updates assignment status

const assignmentRepo = new DeliveryAssignmentRepository(); // single instance reused across all courrier handlers

export const courrierController = {
  // handles POST /courrier/register — creates a new courrier account and logs them in
  register: async (req, res) => {
    try {
      const { phoneNumber, password } = await parseBody(req); // extracts phone number and password from the form
      const courrier = await Courrier.register(phoneNumber, password); // creates the courrier in the DB
      await issueToken(res, courrier, UserRoles.COURRIER);
      res.writeHead(HTTP_STATUS.TEMP_REDIRECT, {
        Location: "/courrier/dashboard",
      });
      res.end();
    } catch {
      errorController(HTTP_STATUS.BAD_REQUEST, req, res);
    }
  },

  // handles POST /courrier/login — verifies credentials and issues a JWT cookie
  login: async (req, res) => {
    try {
      const { phoneNumber, password } = await parseBody(req); // extracts phone number and password from the form
      const courrier = await Courrier.login(phoneNumber, password); // verifies phone number and password
      await issueToken(res, courrier, UserRoles.COURRIER);
      res.writeHead(HTTP_STATUS.TEMP_REDIRECT, {
        Location: "/courrier/dashboard",
      });
      res.end();
    } catch {
      errorController(HTTP_STATUS.UNAUTHORIZED, req, res);
    }
  },

  logout: async (req, res) => {
    await Courrier.logout(req, res);
    res.writeHead(HTTP_STATUS.TEMP_REDIRECT, { Location: "/" });
    res.end();
  },

  // handles GET /courrier/dashboard — renders the courrier dashboard with assigned deliveries
  dashboard: async (req, res) => {
    try {
      const { userId } = await verifyToken(req);
      const rows = await assignmentRepo.findByCourierId(userId); // fetches all assignments for this courrier from the DB
      const assignments = rows.length
        ? rows
            .map((a) => {
              const statusClass =
                {
                  "Waiting Courier": "waiting",
                  "On the way": "ontheway",
                  Arrived: "arrived",
                  Delivered: "delivered",
                }[a.status] ?? "submitted";

              let actionButton = "";

              if (a.status === OrderStatus.WAITING_COURIER) {
                actionButton = `
      <form method="POST" action="/courrier/status">
        <input type="hidden" name="assignmentId" value="${a.assignmentId}" />
        <input type="hidden" name="status" value="${OrderStatus.ONTHEWAY}" />
        <button type="submit" class="btn-outline">Receive Order</button>
      </form>
    `;
              }

              if (a.status === OrderStatus.ONTHEWAY) {
                actionButton = `
      <form method="POST" action="/courrier/status">
        <input type="hidden" name="assignmentId" value="${a.assignmentId}" />
        <input type="hidden" name="status" value="${OrderStatus.ARRIVED}" />
        <button type="submit" class="btn-outline">Arrived</button>
      </form>
    `;
              }

              return `
    <li>
      <div class="order-meta">
        <span>
          Order
          <code style="font-size:0.78rem; color:var(--text-muted);">
            #${a.orderId.slice(0, 8)}
          </code>
        </span>

        <span class="order-status">
          <span class="badge badge-${statusClass}">${a.status}</span>
        </span>
      </div>

      <div class="order-actions">
        ${actionButton}
      </div>
    </li>
  `;
            })
            .join("")
        : "<li class='empty'>No deliveries assigned yet.</li>";
      await renderHTML(res, "Dash-CourrierView.html", { assignments });
    } catch {
      res.writeHead(HTTP_STATUS.TEMP_REDIRECT, { Location: "/courrier/login" }); // token missing or expired — send courrier back to login
      res.end();
    }
  },

  // handles POST /courrier/status — updates the delivery status of an assigned order
  updateStatus: async (req, res) => {
    try {
      await verifyToken(req);
      const { assignmentId, status } = await parseBody(req); // extracts the assignment ID and new status from the form
      await DeliveryAssignment.updateStatus(assignmentId, status); // delegates the DB update to the model
      res.writeHead(HTTP_STATUS.TEMP_REDIRECT, {
        Location: "/courrier/dashboard",
      }); // redirects back to the dashboard to see the updated status
      res.end();
    } catch {
      errorController(HTTP_STATUS.SERVER_ERROR, req, res); // sends 500 if anything goes wrong
    }
  },
};
