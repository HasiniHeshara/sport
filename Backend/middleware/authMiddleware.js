const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  const currentRole = req.user?.role;

  if (!currentRole || !roles.includes(currentRole)) {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }

  next();
};

module.exports = {
  protect,
  authorizeRoles,
};
