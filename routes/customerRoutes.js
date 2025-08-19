
// backend/routes/customers.js
import express from "express";
import Customer from "../models/Customer.js";
import PDFDocument from "pdfkit";

const router = express.Router();

// GET all customers with optional search
router.get("/", async (req, res) => {
  const search = req.query.search || "";
  const customers = await Customer.find({
    $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } }
    ]
  }).sort({ createdAt: -1 });
  res.json(customers);
});

// POST new customer
router.post("/", async (req, res) => {
  const { name, email, phone, address, pincode } = req.body;
  const customer = new Customer({ name, email, phone, address, pincode });
  await customer.save();
  res.json(customer);
});

// PUT update customer
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, pincode } = req.body;
  const updated = await Customer.findByIdAndUpdate(
    id,
    { name, email, phone, address, pincode },
    { new: true }
  );
  res.json(updated);
});

// DELETE customer
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await Customer.findByIdAndDelete(id);
  res.json({ message: "Customer deleted" });
});

/* ==================== REPORTS ==================== */

// GET PDF report: weekly or monthly
router.get("/report/:period", async (req, res) => {
  try {
    const { period } = req.params;
    let startDate = new Date();

    if (period === "weekly") startDate.setDate(startDate.getDate() - 7);
    else if (period === "monthly") startDate.setMonth(startDate.getMonth() - 1);
    else return res.status(400).json({ message: "Invalid period" });

    const customers = await Customer.find({ createdAt: { $gte: startDate } }).sort({ createdAt: -1 });

    // Create PDF
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=customer_${period}_report.pdf`);
    doc.pipe(res);

    // Title
    doc.fontSize(20).fillColor("#007bff").text(`Customer ${period.charAt(0).toUpperCase() + period.slice(1)} Report`, { align: "center" });
    doc.moveDown(1);

    // Total customers
    doc.fontSize(12).fillColor("#000").text(`Total Customers: ${customers.length}`, { align: "center" });
    doc.moveDown(1);

    // Table headers
    doc.fontSize(12).fillColor("#000");
    doc.text("No", 30, doc.y, { continued: true, width: 30 });
    doc.text("Name", 70, doc.y, { continued: true, width: 120 });
    doc.text("Email", 190, doc.y, { continued: true, width: 150 });
    doc.text("Phone", 340, doc.y, { continued: true, width: 80 });
    doc.text("Pincode", 420, doc.y, { continued: true, width: 60 });
    doc.text("Address", 480, doc.y, { width: 100 });
    doc.moveDown(0.5);
    doc.moveTo(30, doc.y).lineTo(550, doc.y).stroke();

    // Table rows with alternating colors
    let y = doc.y + 5;
    customers.forEach((c, i) => {
      if (i % 2 === 0) doc.rect(30, y - 2, 520, 20).fill("#f2f2f2").fillColor("#000");
      doc.text(i + 1, 30, y, { width: 30 });
      doc.text(c.name, 70, y, { width: 120 });
      doc.text(c.email, 190, y, { width: 150 });
      doc.text(c.phone, 340, y, { width: 80 });
      doc.text(c.pincode, 420, y, { width: 60 });
      doc.text(c.address, 480, y, { width: 100 });
      y += 20;
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
