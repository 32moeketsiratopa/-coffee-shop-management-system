
import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const money = value => `M ${Number(value).toFixed(2)}`;
const statuses = ["Pending", "Preparing", "Ready", "Collected"];

export default function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("home");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [lastOrder, setLastOrder] = useState(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [staff, setStaff] = useState(
    Boolean(localStorage.getItem("staffToken"))
  );

  const [orders, setOrders] = useState([]);

  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    available: true
  });

  const [editingId, setEditingId] = useState(null);

  async function loadMenu() {
    try {
      setMenu(await api("/api/menu"));
    } catch (e) {
      setError(e.message);
    }
  }

  async function loadOrders() {
    try {
      setOrders(await api("/api/orders"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    if (staff && page === "staff") {
      loadOrders();
    }
  }, [staff, page]);

  const cartTotal = useMemo(
    () => cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ),
    [cart]
  );

  function addToCart(item) {
    setCart(old => {
      const found = old.find(x => x.id === item.id);

      if (found) {
        return old.map(x =>
          x.id === item.id
            ? { ...x, quantity: x.quantity + 1 }
            : x
        );
      }

      return [...old, { ...item, quantity: 1 }];
    });

    setMessage(`${item.name} added to your cart.`);
    setError("");
  }

  function changeQuantity(id, quantity) {
    if (quantity < 1) {
      setCart(old => old.filter(x => x.id !== id));
    } else {
      setCart(old =>
        old.map(x =>
          x.id === id
            ? { ...x, quantity: Math.min(30, quantity) }
            : x
        )
      );
    }
  }

  async function placeOrder(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const order = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName,
          customerContact,
          items: cart.map(item => ({
            id: item.id,
            quantity: item.quantity
          }))
        })
      });

      setLastOrder(order.order);
      setCart([]);
      setCustomerName("");
      setCustomerContact("");
      setPage("confirmation");

    } catch (e) {
      setError(e.message);
    }
  }

  async function staffLogin(event) {
    event.preventDefault();
    setError("");

    try {
      const result = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      localStorage.setItem("staffToken", result.token);
      setStaff(true);
      setPassword("");
      setPage("staff");
      setMessage("Staff login successful.");

    } catch (e) {
      setError(e.message);
    }
  }

  function logout() {
    localStorage.removeItem("staffToken");
    setStaff(false);
    setOrders([]);
    setPage("home");
    setMessage("You have signed out.");
  }

  async function saveMenuItem(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = {
        ...itemForm,
        price: Number(itemForm.price)
      };

      if (editingId) {
        await api(`/api/menu/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });

        setMessage("Menu item updated.");
      } else {
        await api("/api/menu", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        setMessage("Menu item added.");
      }

      setItemForm({
        name: "",
        description: "",
        price: "",
        available: true
      });

      setEditingId(null);
      await loadMenu();

    } catch (e) {
      setError(e.message);
    }
  }

  function beginEdit(item) {
    setEditingId(item.id);

    setItemForm({
      name: item.name,
      description: item.description,
      price: item.price,
      available: item.available
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function deleteMenuItem(id) {
    if (!window.confirm("Delete this menu item?")) return;

    try {
      await api(`/api/menu/${id}`, {
        method: "DELETE"
      });

      setMessage("Menu item deleted.");
      await loadMenu();

    } catch (e) {
      setError(e.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      await api(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      setMessage("Order status updated.");
      await loadOrders();

    } catch (e) {
      setError(e.message);
    }
  }

  const today = new Date().toLocaleDateString();

  const todaysOrders = orders.filter(
    order =>
      new Date(order.createdAt).toLocaleDateString() === today
  );

  const todaysTotal = todaysOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  return (
    <div className="app">

      <header className="topbar">
        <div className="brand">☕ Corner Cup</div>

        <nav>
          <button onClick={() => setPage("home")}>
            Menu
          </button>

          <button onClick={() => setPage("cart")}>
            Cart ({cart.reduce((n, x) => n + x.quantity, 0)})
          </button>

          {staff ? (
            <button onClick={() => setPage("staff")}>
              Staff dashboard
            </button>
          ) : (
            <button onClick={() => setPage("login")}>
              Staff login
            </button>
          )}

          {staff && (
            <button onClick={logout}>
              Sign out
            </button>
          )}
        </nav>
      </header>

      <main className="container">

        <section className="hero">
          <p className="eyebrow">
            FRESHLY MADE • EVERY DAY
          </p>

          <h1>Your daily cup of happiness.</h1>

          <p>
            Browse our menu, choose your favourites
            and place your order.
          </p>
        </section>

        {message && (
          <div className="notice">{message}</div>
        )}

        {error && (
          <div className="error">{error}</div>
        )}

        {page === "home" && (
          <section>
            <div className="section-heading">
              <div>
                <p className="eyebrow">OUR MENU</p>
                <h2>Made with care</h2>
              </div>

              <button
                className="secondary"
                onClick={loadMenu}
              >
                Refresh menu
              </button>
            </div>

            <div className="menu-grid">
              {menu.map(item => (
                <article
                  className="menu-card"
                  key={item.id}
                >
                  <div className="coffee-icon">☕</div>

                  <div className="menu-card-content">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>

                    <div className="card-bottom">
                      <strong>{money(item.price)}</strong>

                      {item.available ? (
                        <button
                          onClick={() => addToCart(item)}
                        >
                          Add to cart
                        </button>
                      ) : (
                        <span className="unavailable">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {menu.length === 0 && (
              <p>No menu items are available yet.</p>
            )}
          </section>
        )}

        {page === "cart" && (
          <section className="panel">
            <p className="eyebrow">YOUR SELECTION</p>
            <h2>Your cart</h2>

            {cart.length === 0 ? (
              <p>
                Your cart is empty. Go to the menu to add items.
              </p>
            ) : (
              <>
                {cart.map(item => (
                  <div className="cart-row" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{money(item.price)} each</small>
                    </div>

                    <div className="quantity">
                      <button
                        onClick={() =>
                          changeQuantity(item.id, item.quantity - 1)
                        }
                      >
                        -
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() =>
                          changeQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>

                    <strong>
                      {money(item.price * item.quantity)}
                    </strong>
                  </div>
                ))}

                <div className="total">
                  <span>Total</span>
                  <strong>{money(cartTotal)}</strong>
                </div>

                <button onClick={() => setPage("checkout")}>
                  Continue to checkout
                </button>
              </>
            )}
          </section>
        )}

        {page === "checkout" && (
          <section className="panel narrow">
            <p className="eyebrow">FINAL STEP</p>
            <h2>Place your order</h2>

            <p>
              Order total: <strong>{money(cartTotal)}</strong>
            </p>

            <form onSubmit={placeOrder}>
              <label>
                Your name
                <input
                  required
                  minLength="2"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </label>

              <label>
                Contact details
                <input
                  required
                  minLength="3"
                  value={customerContact}
                  onChange={e => setCustomerContact(e.target.value)}
                  placeholder="Phone number or email"
                />
              </label>

              <button disabled={cart.length === 0}>
                Confirm order
              </button>
            </form>
          </section>
        )}

        {page === "confirmation" && lastOrder && (
          <section className="panel narrow center">
            <div className="success-icon">✓</div>

            <p className="eyebrow">ORDER RECEIVED</p>

            <h2>
              Thank you, {lastOrder.customerName}!
            </h2>

            <p>Your order number is</p>

            <div className="order-number">
              {lastOrder.orderNumber}
            </div>

            <p>
              Current status: <strong>{lastOrder.status}</strong>
            </p>

            <p>
              Total: <strong>{money(lastOrder.total)}</strong>
            </p>

            <button onClick={() => setPage("home")}>
              Back to menu
            </button>
          </section>
        )}

        {page === "login" && (
          <section className="panel narrow">
            <p className="eyebrow">TEAM ACCESS</p>
            <h2>Staff login</h2>

            <form onSubmit={staffLogin}>
              <label>
                Username
                <input
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </label>

              <label>
                Password
                <input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </label>

              <button>Sign in</button>
            </form>

            <p className="hint">
              Use the staff username and password configured
              in the backend .env file.
            </p>
          </section>
        )}

        {page === "staff" && staff && (
          <section>
            <div className="section-heading">
              <div>
                <p className="eyebrow">STAFF AREA</p>
                <h2>Management dashboard</h2>
              </div>

              <button
                className="secondary"
                onClick={loadOrders}
              >
                Refresh orders
              </button>
            </div>

          <div className="panel daily-sales">
  <h2>Daily Sales Summary</h2>

  <p className="eyebrow">
    TODAY'S PERFORMANCE
  </p>

  <div className="stats">
    <div className="stat">
      <span>Today's Revenue</span>
      <strong>{money(todaysTotal)}</strong>
    </div>

    <div className="stat">
      <span>Orders Today</span>
      <strong>{todaysOrders.length}</strong>
    </div>

    <div className="stat">
      <span>Collected Orders</span>
      <strong>
        {todaysOrders.filter(order => order.status === "Collected").length}
      </strong>
    </div>

    <div className="stat">
      <span>Pending Orders</span>
      <strong>
        {todaysOrders.filter(order => order.status === "Pending").length}
      </strong>
    </div>

    <div className="stat">
      <span>All Orders</span>
      <strong>{orders.length}</strong>
    </div>
  </div>
</div>

            <div className="panel">
              <h2>
                {editingId ? "Edit menu item" : "Add a menu item"}
              </h2>

              <form className="menu-form" onSubmit={saveMenuItem}>
                <label>
                  Item name
                  <input
                    required
                    value={itemForm.name}
                    onChange={e =>
                      setItemForm({
                        ...itemForm,
                        name: e.target.value
                      })
                    }
                  />
                </label>

                <label>
                  Description
                  <input
                    required
                    value={itemForm.description}
                    onChange={e =>
                      setItemForm({
                        ...itemForm,
                        description: e.target.value
                      })
                    }
                  />
                </label>

                <label>
                  Price (M)
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={itemForm.price}
                    onChange={e =>
                      setItemForm({
                        ...itemForm,
                        price: e.target.value
                      })
                    }
                  />
                </label>

                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={itemForm.available}
                    onChange={e =>
                      setItemForm({
                        ...itemForm,
                        available: e.target.checked
                      })
                    }
                  />
                  Available
                </label>

                <button>
                  {editingId ? "Save changes" : "Add item"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setEditingId(null);
                      setItemForm({
                        name: "",
                        description: "",
                        price: "",
                        available: true
                      });
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </form>

              <h3>Current menu</h3>

              {menu.map(item => (
                <div className="admin-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {money(item.price)} •{" "}
                      {item.available ? "Available" : "Unavailable"}
                    </small>
                  </div>

                  <div className="actions">
                    <button
                      className="secondary"
                      onClick={() => beginEdit(item)}
                    >
                      Edit
                    </button>

                    <button
                      className="danger"
                      onClick={() => deleteMenuItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="panel">
              <div className="section-heading">
                <h2>Customer orders</h2>
                <span>{orders.length} orders</span>
              </div>

              {orders.length === 0 && (
                <p>No orders have been placed yet.</p>
              )}

              {orders.map(order => (
                <article className="order-card" key={order.id}>
                  <div className="order-head">
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <small>
                        {order.customerName} • {order.customerContact}
                      </small>
                    </div>

                    <strong>{money(order.total)}</strong>
                  </div>

                  <p>
                    {order.items
                      .map(item => `${item.name} × ${item.quantity}`)
                      .join(", ")}
                  </p>

                  <div className="status-line">
                    <span>
                      Status: <strong>{order.status}</strong>
                    </span>

                    <select
                      value={order.status}
                      onChange={e =>
                        updateStatus(order.id, e.target.value)
                      }
                    >
                      {statuses.map(status => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {page === "staff" && !staff && (
          <section className="panel">
            <p>Please sign in as staff first.</p>

            <button onClick={() => setPage("login")}>
              Go to login
            </button>
          </section>
        )}

      </main>

      <footer>
        Corner Cup Coffee Shop • Management System
      </footer>

    </div>
  );
}
