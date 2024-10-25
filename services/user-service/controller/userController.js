const crypto = require("crypto");
const User = require("../model/userModel"); // Mongoose User model
const jwtHelper = require("../utils/jwtHelper");
const { trace } = require("@opentelemetry/api"); 
const tracer = trace.getTracer("user-service");
const getUserInfo = async (req, res) => {
  // Start a span for the getUserInfo function
  const span = tracer.startSpan("getUserInfo-function", {
    attributes: { "function.name": "getUserInfo" },
  });

  const { userId } = req.params; // Get the userId from the route parameters

  try {
    // Start a child span for database operations
    const dbSpan = tracer.startSpan("mongo-find-user", {
      parent: span,
      attributes: { "db.operation": "find", "db.collection": "users" },
    });

    // Find the user by ID
    const user = await User.findOne({ userId });

    dbSpan.end(); // End the child span after finding the user

    if (!user) {
      span.setAttribute("getUserInfo.status", "not_found");
      span.end();
      return res.status(404).json({ message: "User not found" });
    }

    span.setAttribute("getUserInfo.status", "success"); // Add a success attribute

    // Return the user information
    res.json({
      userId: user.userId,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    span.setAttribute("getUserInfo.status", "error");
    span.setAttribute("error.message", err.message);
    console.log("🚀 ~ getUserInfo ~ err:", err);
    res.status(500).json({ message: "An error occurred while fetching user information" });
  } finally {
    span.end(); // End the span
  }
};


const deleteUser = async (req, res) => {
  // Start a span for the deleteUser function
  const span = tracer.startSpan("deleteUser-function", {
    attributes: { "function.name": "deleteUser" },
  });

  const { userId } = req.params; // Get the userId from the route parameters

  try {
    // Start a child span for database operations
    const dbSpan = tracer.startSpan("mongo-delete-user", {
      parent: span, // Nest this span under the parent
      attributes: { "db.operation": "delete", "db.collection": "users" },
    });

    // Find the user by ID and delete
    const user = await User.findByIdAndDelete(userId);

    dbSpan.end(); // End the child span after deleting the user

    if (!user) {
      span.setAttribute("deleteUser.status", "not_found");
      span.end();
      return res.status(404).json({ message: "User not found" });
    }

    span.setAttribute("deleteUser.status", "success"); // Add a success attribute
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    span.setAttribute("deleteUser.status", "error");
    span.setAttribute("error.message", err.message);
    console.log("🚀 ~ deleteUser ~ err:", err);
    res.status(500).json({ message: "An error occurred while deleting the user" });
  } finally {
    span.end(); // End the span
  }
};


const register = async (req, res) => {
  // Start a span for the register function
  const span = tracer.startSpan("register-function", {
    attributes: { "function.name": "register" }, // Add function name as a tag
  });

  const { username, password, email, role } = req.body;
  const passHash = crypto.createHash("md5").update(password).digest("hex");

  try {
    // Start a child span for database operations
    const dbSpan = tracer.startSpan("mongo-save-user", {
      parent: span, // Nest this span under the parent
      attributes: { "db.operation": "save", "db.collection": "users" },
    });

    const user = new User({
      username,
      password: passHash,
      email,
      role,
    });

    await user.save(); // This operation is traced by dbSpan

    dbSpan.end(); // End the child span after saving the user

    span.setAttribute("register.status", "success"); // Add tag to span

    res.json({ message: "Registration successful", userId: user.userId });
  } catch (err) {
    span.setAttribute("register.status", "error"); // Mark error in span
    span.setAttribute("error.message", err.message);
    console.log("🚀 ~ register ~ err:", err);

    if (err.code === 11000) {
      res.status(409).json({ message: "Email already exists" });
    } else {
      res.status(500).json({ message: "An error occurred" });
    }
  } finally {
    span.end(); // End the span
  }
};

const login = async (req, res) => {
  // Start a span for the login function
  const span = tracer.startSpan("login-function", {
    attributes: { "function.name": "login" },
  });

  const { email, password } = req.body;
  const passHash = crypto.createHash("md5").update(password).digest("hex");

  try {
    // Start a child span for finding the user
    const dbSpan = tracer.startSpan("mongo-find-user", {
      parent: span,
      attributes: { "db.operation": "find", "db.collection": "users" },
    });

    const user = await User.findOne({
      email: email,
      password: passHash,
    });

    dbSpan.end(); // End the span after user is found

    if (user) {
      const tokenSpan = tracer.startSpan("jwt-generate-token", {
        parent: span,
        attributes: { "user.id": user._id.toString(), "user.role": user.role },
      });

      const token = await jwtHelper.generateToken({
        userId: user._id,
        role: user.role,
      });

      tokenSpan.end(); // End the span for token generation

      res.json({ token: token, userId: user._id, role: user.role });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    span.setAttribute("login.status", "error"); // Mark error in span
    span.setAttribute("error.message", err.message);
    console.log("🚀 ~ login ~ err:", err);
    res.status(500).json({ message: "An error occurred" });
  } finally {
    span.end(); // End the span
  }
};

const refreshToken = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  
  try {
    const { payload } = await jwtHelper.verifyToken(token);
    const { userId, role } = payload;

    if (!userId || !role) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    // Generate a new token
    const newToken = await jwtHelper.generateToken({ userId, role });
    res.json({ token: newToken });
  } catch (err) {
    console.log("🚀 ~ refreshToken ~ err:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};

const verifyToken = async (req, res) => {
  const { token } = req.body;

  try {
    const { payload } = await jwtHelper.verifyToken(token);
    const { userId, role } = payload;

    if (!userId || !role) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    res.json({ userId, role });
  } catch (err) {
    console.log("🚀 ~ verifyToken ~ err:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { getUserInfo, deleteUser, register, login, refreshToken, verifyToken };
