const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  console.log("AUTH HEADER:", authHeader);

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("DECODED TOKEN:", decoded);

    req.user = {
      _id: decoded.userId,
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.log("TOKEN ERROR:", error.message);
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  const currentRole = req.user?.role;

  console.log("CURRENT ROLE:", currentRole);
  console.log("ALLOWED ROLES:", roles);

  if (!currentRole || !roles.includes(currentRole)) {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }

  next();
};

const admin = (req, res, next) => {
  const currentRole = req.user?.role;

  if (currentRole !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin access only" });
  }

  next();
};

module.exports = {
  protect,
  authorizeRoles,
  admin,
};