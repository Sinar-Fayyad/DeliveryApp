import Courrier from "../Models/Courrier.mjs"; // Courrier model — register and login logic
import { errorController } from "./ErrorController.mjs"; // sends error pages on failure
import { HTTP_STATUS, UserRoles, OrderStatus } from "../Utils/constants.mjs"; // role, status, and order status constants
import { parseBody } from "../Utils/bodyParser.mjs"; // reads and decodes the POST request body
import { issueToken, verifyToken } from "../Utils/token.mjs";
import { renderHTML } from "../Utils/renderHTML.mjs"; // renders an HTML template with injected data
import DeliveryAssignmentRepository from "../Database/DeliveryAssignmentRepository.mjs"; // reads assignments for this courrier
import DeliveryAssignment from "../Models/DeliveryAssignment.mjs"; // updates assignment status
import OrderRepository from "../Database/OrderRepository.mjs"; // updates order status based on courier actions
import Database from "../Database/Database.mjs"; // for fetching orderId from assignmentId

const assignmentRepo = new DeliveryAssignmentRepository(); // single instance reused across all courrier handlers
const orderRepo = new OrderRepository(); // used to keep Order.status in sync with delivery assignment status
const db = Database.getInstance();


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
                  "Arrived": "arrived",
                  "Delivered": "delivered",
                };

              let actionButton = "";

              // NOTE: DeliveryAssignment.status should be an OrderStatus string.
              // If DB contains legacy values like "waiting" instead of "Waiting Courier",
              // normalize them to the correct OrderStatus before deciding on the button.
              // Normalize status values coming from DB so UI decisions are stable.
              // (Some legacy rows may store lower-case/partial values.)
              const rawStatus = (a.status ?? "").toString().trim();

              const normalizedCourierStatus =
                rawStatus === "waiting" || rawStatus === "Waiting Courier"
                  ? OrderStatus.WAITING_COURIER
                  : rawStatus === "ontheway" || rawStatus === "On the way"
                    ? OrderStatus.ONTHEWAY
                    : rawStatus === "arrived" || rawStatus === "Arrived"
                      ? OrderStatus.ARRIVED
                      : rawStatus === "delivered" || rawStatus === "Delivered"
                        ? OrderStatus.DELIVERED
                        : rawStatus;

              // Minimal fix: if DB has Submitted but this courier flow should start at
              // Waiting Courier, treat Submitted as Waiting Courier for UI purposes.
              const effectiveCourierStatus =
                normalizedCourierStatus === OrderStatus.SUBMITTED ||
                normalizedCourierStatus === "submitted"
                  ? OrderStatus.WAITING_COURIER
                  : normalizedCourierStatus;

              // Show "Receive Order" when the assignment is effectively waiting.
              if (effectiveCourierStatus === OrderStatus.WAITING_COURIER) {
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
      <form method="POST" action="/courrier/status" data-arrived-form>
        <input type="hidden" name="assignmentId" value="${a.assignmentId}" />
        <input type="hidden" name="status" value="${OrderStatus.ARRIVED}" />
        <button type="submit" class="btn-outline" disabled data-arrived-btn>Arrived</button>
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

      // 1) update assignment status (courrier-side)
      await DeliveryAssignment.updateStatus(assignmentId, status);

      // 2) keep Order.status in sync so the customer + restaurant dashboards react
      const [rows] = await db.query(
        `SELECT orderId FROM DeliveryAssignment WHERE assignmentId = ?`,
        [assignmentId],
      );
      if (!rows?.length) {
        // assignment not found; still consider assignment update completed but don't update order
        return res.end();
      }
      const { orderId } = rows[0];

      const orderStatusByCourierAction = {
        [OrderStatus.ONTHEWAY]: OrderStatus.ONTHEWAY,
        [OrderStatus.ARRIVED]: OrderStatus.ARRIVED,
        [OrderStatus.DELIVERED]: OrderStatus.DELIVERED,
      };

      const nextOrderStatus = orderStatusByCourierAction[status] ?? null;
      if (nextOrderStatus) {
        await orderRepo.updateStatus(orderId, nextOrderStatus);
      }

      res.writeHead(HTTP_STATUS.TEMP_REDIRECT, {
        Location: "/courrier/dashboard",
      });
      res.end();
    } catch (error) {
      console.log(error);
      errorController(HTTP_STATUS.SERVER_ERROR, req, res); // sends 500 if anything goes wrong
    }
  },
};
