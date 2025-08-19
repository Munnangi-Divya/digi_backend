
// backend/routes/auth.js
import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

// Default staff user
const DEFAULT_USER = {
  email: "divyamunnangi41@gmail.com",
  password: "password123", // 🔒 in real app, hash it
};

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === DEFAULT_USER.email && password === DEFAULT_USER.password) {
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "100h",
    });
    return res.json({ token });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

export default router;
