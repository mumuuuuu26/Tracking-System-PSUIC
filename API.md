# API Documentation

The IT Support System provides a RESTful API documented using **Swagger/OpenAPI**.

## 📖 Accessing Documentation

Once the server is running, you can access the interactive API docs at:

**[http://localhost:5002/api-docs](http://localhost:5002/api-docs)** 
*(Replace `localhost` with your server IP if accessing remotely)*

## 🔑 Authentication
Most endpoints require a valid JWT Token.
1.  Login via `/api/auth/login`.
2.  Copy the `token` from the response.
3.  In Swagger UI, click **Authorize** button (top right).
4.  Enter the token (Bearer format is handled automatically by the configuration).

## 🛠 Common Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Login to get token |
| **GET** | `/api/user/me` | Get current user profile |
| **GET** | `/api/tickets` | List all tickets (wit filters) |
| **POST** | `/api/tickets` | Create a new ticket |
| **GET** | `/api/equipment` | List assets/equipment |

## 📝 Updating Documentation
The API documentation is auto-generated from JSDoc comments in the route files.
To update docs:
1.  Go to `routes/*.js`.
2.  Edit the `@swagger` comments above the routes.
3.  Restart the server to see changes.
