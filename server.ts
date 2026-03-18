import express from 'express';
import { createServer as createViteServer } from 'vite';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function setupDatabase() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      billing_address TEXT,
      tax_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      category TEXT,
      unit TEXT,
      cost_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      current_stock INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_item_id INTEGER NOT NULL,
      change_amount INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Add', 'Remove')),
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS print_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      client_id INTEGER NOT NULL,
      description TEXT,
      status TEXT NOT NULL CHECK(status IN ('Pending', 'In Production', 'Finishing', 'Ready for Pickup', 'Completed')),
      due_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      tax_id TEXT,
      supply_category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      supplier_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax_rate REAL NOT NULL,
      tax_amount REAL NOT NULL,
      discount REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Paid', 'Unpaid', 'Partial')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customer_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      receipt_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_number TEXT UNIQUE NOT NULL,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      date TEXT NOT NULL,
      valid_until TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax_rate REAL NOT NULL,
      tax_amount REAL NOT NULL,
      discount REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Draft', 'Sent', 'Accepted', 'Rejected')),
      terms TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vendor_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      bill_number TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      total REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('Paid', 'Unpaid', 'Partial')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS vendor_bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      inventory_item_id INTEGER,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_cost REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES vendor_bills(id) ON DELETE CASCADE,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS supplier_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      reference_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS staff_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Admin', 'Staff')),
      pin_code TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Initialize default Admin user if staff_users is empty
  const staffCount = await db.get('SELECT COUNT(*) as count FROM staff_users');
  if (staffCount.count === 0) {
    await db.run(
      `INSERT INTO staff_users (name, role, pin_code) VALUES (?, ?, ?)`,
      ['Owner', 'Admin', '1234']
    );
  }

  // Check if supplier_id exists in expenses (for migration)
  const expensesTableInfo = await db.all("PRAGMA table_info(expenses)");
  const hasSupplierId = expensesTableInfo.some((col: any) => col.name === 'supplier_id');
  if (!hasSupplierId) {
    await db.run('ALTER TABLE expenses ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL');
  }

  // Check if paid_amount exists in invoices (for migration)
  const invoicesTableInfo = await db.all("PRAGMA table_info(invoices)");
  const hasPaidAmount = invoicesTableInfo.some((col: any) => col.name === 'paid_amount');
  if (!hasPaidAmount) {
    await db.run('ALTER TABLE invoices ADD COLUMN paid_amount REAL DEFAULT 0');
    // Update existing paid invoices to have paid_amount = total
    await db.run('UPDATE invoices SET paid_amount = total WHERE status = "Paid"');
  }

  const hasQuoteIdInvoices = invoicesTableInfo.some((col: any) => col.name === 'quote_id');
  if (!hasQuoteIdInvoices) {
    await db.run('ALTER TABLE invoices ADD COLUMN quote_id INTEGER REFERENCES quotes(id) ON DELETE SET NULL');
  }

  // Check if quote_id exists in print_jobs (for migration)
  const printJobsTableInfo = await db.all("PRAGMA table_info(print_jobs)");
  const hasQuoteIdPrintJobs = printJobsTableInfo.some((col: any) => col.name === 'quote_id');
  if (!hasQuoteIdPrintJobs) {
    await db.run('ALTER TABLE print_jobs ADD COLUMN quote_id INTEGER REFERENCES quotes(id) ON DELETE SET NULL');
  }

  return db;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const db = await setupDatabase();

  // --- Auth API ---
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { pin_code } = req.body;
      if (!pin_code) {
        return res.status(400).json({ error: 'PIN code is required' });
      }

      const user = await db.get(
        'SELECT id, name, role, created_at FROM staff_users WHERE pin_code = ?',
        [pin_code]
      );

      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: 'Invalid PIN code' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- Staff Management API ---
  app.get('/api/staff', async (req, res) => {
    try {
      const staff = await db.all('SELECT id, name, role, pin_code, created_at FROM staff_users ORDER BY name ASC');
      res.json(staff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ error: 'Failed to fetch staff' });
    }
  });

  app.post('/api/staff', async (req, res) => {
    try {
      const { name, role, pin_code } = req.body;
      if (!name || !role || !pin_code) {
        return res.status(400).json({ error: 'Name, role, and PIN code are required' });
      }

      const result = await db.run(
        'INSERT INTO staff_users (name, role, pin_code) VALUES (?, ?, ?)',
        [name, role, pin_code]
      );

      const newStaff = await db.get('SELECT id, name, role, pin_code, created_at FROM staff_users WHERE id = ?', result.lastID);
      res.status(201).json(newStaff);
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'PIN code must be unique' });
      }
      console.error('Error creating staff:', error);
      res.status(500).json({ error: 'Failed to create staff' });
    }
  });

  app.put('/api/staff/:id', async (req, res) => {
    try {
      const { name, role, pin_code } = req.body;
      const { id } = req.params;

      if (!name || !role || !pin_code) {
        return res.status(400).json({ error: 'Name, role, and PIN code are required' });
      }

      await db.run(
        'UPDATE staff_users SET name = ?, role = ?, pin_code = ? WHERE id = ?',
        [name, role, pin_code, id]
      );

      const updatedStaff = await db.get('SELECT id, name, role, pin_code, created_at FROM staff_users WHERE id = ?', id);
      if (updatedStaff) {
        res.json(updatedStaff);
      } else {
        res.status(404).json({ error: 'Staff member not found' });
      }
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'PIN code must be unique' });
      }
      console.error('Error updating staff:', error);
      res.status(500).json({ error: 'Failed to update staff' });
    }
  });

  app.delete('/api/staff/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent deleting the last admin
      const adminCount = await db.get("SELECT COUNT(*) as count FROM staff_users WHERE role = 'Admin'");
      const userToDelete = await db.get("SELECT role FROM staff_users WHERE id = ?", [id]);
      
      if (userToDelete && userToDelete.role === 'Admin' && adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last Admin user' });
      }

      const result = await db.run('DELETE FROM staff_users WHERE id = ?', [id]);
      if (result.changes && result.changes > 0) {
        res.json({ message: 'Staff member deleted successfully' });
      } else {
        res.status(404).json({ error: 'Staff member not found' });
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      res.status(500).json({ error: 'Failed to delete staff' });
    }
  });

  // --- Client Management API ---

  // getClients()
  app.get('/api/clients', async (req, res) => {
    try {
      const clients = await db.all(`
        SELECT 
          c.*,
          COALESCE(SUM(i.total), 0) as total_spent,
          COALESCE(SUM(i.total - i.paid_amount), 0) as outstanding_dues
        FROM clients c
        LEFT JOIN invoices i ON c.id = CAST(i.client_id AS INTEGER)
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `);
      res.json(clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ error: 'Failed to fetch clients' });
    }
  });

  // getClientById(id)
  app.get('/api/clients/:id', async (req, res) => {
    try {
      const client = await db.get(`
        SELECT 
          c.*,
          COALESCE(SUM(i.total), 0) as total_spent,
          COALESCE(SUM(i.total - i.paid_amount), 0) as outstanding_dues
        FROM clients c
        LEFT JOIN invoices i ON c.id = CAST(i.client_id AS INTEGER)
        WHERE c.id = ?
        GROUP BY c.id
      `, req.params.id);
      
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      const invoices = await db.all('SELECT * FROM invoices WHERE client_id = ? ORDER BY date DESC', req.params.id);
      res.json({ ...client, invoices });
    } catch (error) {
      console.error('Error fetching client:', error);
      res.status(500).json({ error: 'Failed to fetch client' });
    }
  });

  // createClient(data)
  app.post('/api/clients', async (req, res) => {
    const { full_name, company_name, email, phone, billing_address, tax_id } = req.body;
    try {
      const result = await db.run(
        `INSERT INTO clients (full_name, company_name, email, phone, billing_address, tax_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [full_name, company_name, email, phone, billing_address, tax_id]
      );
      res.status(201).json({ id: result.lastID });
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({ error: 'Failed to create client' });
    }
  });

  // updateClient(id, data)
  app.put('/api/clients/:id', async (req, res) => {
    const { full_name, company_name, email, phone, billing_address, tax_id } = req.body;
    try {
      await db.run(
        `UPDATE clients SET full_name = ?, company_name = ?, email = ?, phone = ?, billing_address = ?, tax_id = ? 
         WHERE id = ?`,
        [full_name, company_name, email, phone, billing_address, tax_id, req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({ error: 'Failed to update client' });
    }
  });

  // POST /api/clients/:id/payments
  app.post('/api/clients/:id/payments', async (req, res) => {
    const clientId = req.params.id;
    const { amount, payment_date, payment_method, receipt_number, notes } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    try {
      await db.run('BEGIN TRANSACTION');

      // 1. Insert the payment record
      await db.run(
        `INSERT INTO customer_payments (client_id, amount, payment_date, payment_method, receipt_number, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [clientId, amount, payment_date, payment_method, receipt_number, notes]
      );

      // 2. Fetch unpaid/partial invoices for this client, ordered by date ASC (oldest first)
      const invoices = await db.all(
        `SELECT id, total, paid_amount, status 
         FROM invoices 
         WHERE client_id = ? AND status IN ('Unpaid', 'Partial') 
         ORDER BY date ASC`,
        [clientId]
      );

      let remainingPayment = parseFloat(amount);

      // 3. FIFO Allocation
      for (const invoice of invoices) {
        if (remainingPayment <= 0) break;

        const invoiceTotal = parseFloat(invoice.total);
        const currentPaid = parseFloat(invoice.paid_amount || 0);
        const amountDue = invoiceTotal - currentPaid;

        if (amountDue > 0) {
          const amountToApply = Math.min(remainingPayment, amountDue);
          const newPaidAmount = currentPaid + amountToApply;
          const newStatus = newPaidAmount >= invoiceTotal ? 'Paid' : 'Partial';

          await db.run(
            `UPDATE invoices SET paid_amount = ?, status = ? WHERE id = ?`,
            [newPaidAmount, newStatus, invoice.id]
          );

          remainingPayment -= amountToApply;
        }
      }

      await db.run('COMMIT');
      res.status(201).json({ success: true, message: 'Payment recorded and allocated successfully' });
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error recording payment:', error);
      res.status(500).json({ error: 'Failed to record payment' });
    }
  });

  // GET /api/clients/:id/ledger
  app.get('/api/clients/:id/ledger', async (req, res) => {
    const clientId = req.params.id;
    try {
      // Fetch invoices
      const invoices = await db.all(
        `SELECT id, invoice_number as reference, date, total as amount, 'invoice' as type, status
         FROM invoices 
         WHERE client_id = ?`,
        [clientId]
      );

      // Fetch payments
      const payments = await db.all(
        `SELECT id, receipt_number as reference, payment_date as date, amount, 'payment' as type, payment_method as status
         FROM customer_payments 
         WHERE client_id = ?`,
        [clientId]
      );

      // Combine and sort chronologically
      const ledger = [...invoices, ...payments].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      // Calculate running balance
      let balance = 0;
      const ledgerWithBalance = ledger.map(item => {
        const itemAmount = parseFloat(item.amount);
        if (item.type === 'invoice') {
          balance += itemAmount;
        } else {
          balance -= itemAmount;
        }
        return { ...item, balance };
      });

      res.json(ledgerWithBalance);
    } catch (error) {
      console.error('Error fetching ledger:', error);
      res.status(500).json({ error: 'Failed to fetch ledger' });
    }
  });

  // --- Inventory Management API ---

  // getInventory()
  app.get('/api/inventory', async (req, res) => {
    try {
      const items = await db.all('SELECT * FROM inventory_items ORDER BY name ASC');
      res.json(items);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  });

  // getInventoryById(id)
  app.get('/api/inventory/:id', async (req, res) => {
    try {
      const item = await db.get('SELECT * FROM inventory_items WHERE id = ?', req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      const transactions = await db.all('SELECT * FROM stock_transactions WHERE inventory_item_id = ? ORDER BY created_at DESC', req.params.id);
      res.json({ ...item, transactions });
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      res.status(500).json({ error: 'Failed to fetch inventory item' });
    }
  });

  // createInventoryItem(data)
  app.post('/api/inventory', async (req, res) => {
    const { name, sku, category, unit, cost_price, selling_price, current_stock, low_stock_threshold } = req.body;
    try {
      await db.run('BEGIN TRANSACTION');
      
      const result = await db.run(
        `INSERT INTO inventory_items (name, sku, category, unit, cost_price, selling_price, current_stock, low_stock_threshold) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, sku, category, unit, cost_price, selling_price, current_stock, low_stock_threshold]
      );
      
      const itemId = result.lastID;
      
      if (current_stock > 0) {
        await db.run(
          `INSERT INTO stock_transactions (inventory_item_id, change_amount, type, reason) VALUES (?, ?, ?, ?)`,
          [itemId, current_stock, 'Add', 'Initial Stock']
        );
      }
      
      await db.run('COMMIT');
      res.status(201).json({ id: itemId });
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error creating inventory item:', error);
      res.status(500).json({ error: 'Failed to create inventory item' });
    }
  });

  // updateInventoryItem(id, data)
  app.put('/api/inventory/:id', async (req, res) => {
    const { name, sku, category, unit, cost_price, selling_price, low_stock_threshold } = req.body;
    try {
      await db.run(
        `UPDATE inventory_items SET name = ?, sku = ?, category = ?, unit = ?, cost_price = ?, selling_price = ?, low_stock_threshold = ? 
         WHERE id = ?`,
        [name, sku, category, unit, cost_price, selling_price, low_stock_threshold, req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating inventory item:', error);
      res.status(500).json({ error: 'Failed to update inventory item' });
    }
  });

  // adjustStock(id, data)
  app.post('/api/inventory/:id/adjust', async (req, res) => {
    const { change_amount, type, reason } = req.body;
    const itemId = req.params.id;
    
    if (!['Add', 'Remove'].includes(type) || change_amount <= 0) {
      return res.status(400).json({ error: 'Invalid adjustment parameters' });
    }

    try {
      await db.run('BEGIN TRANSACTION');
      
      // Insert audit log
      await db.run(
        `INSERT INTO stock_transactions (inventory_item_id, change_amount, type, reason) VALUES (?, ?, ?, ?)`,
        [itemId, change_amount, type, reason]
      );
      
      // Update current stock
      const operator = type === 'Add' ? '+' : '-';
      await db.run(
        `UPDATE inventory_items SET current_stock = current_stock ${operator} ? WHERE id = ?`,
        [change_amount, itemId]
      );
      
      await db.run('COMMIT');
      res.json({ success: true });
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error adjusting stock:', error);
      res.status(500).json({ error: 'Failed to adjust stock' });
    }
  });

  // --- Job Production API ---

  // getJobs()
  app.get('/api/jobs', async (req, res) => {
    try {
      const jobs = await db.all(`
        SELECT j.*, c.full_name as client_name, c.company_name
        FROM print_jobs j
        LEFT JOIN clients c ON j.client_id = c.id
        ORDER BY j.due_date ASC
      `);
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  });

  // getJobById(id)
  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const job = await db.get(`
        SELECT j.*, c.full_name as client_name, c.company_name
        FROM print_jobs j
        LEFT JOIN clients c ON j.client_id = c.id
        WHERE j.id = ?
      `, req.params.id);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  });

  // createJob(data)
  app.post('/api/jobs', async (req, res) => {
    const { title, client_id, description, status, due_date } = req.body;
    try {
      const result = await db.run(
        `INSERT INTO print_jobs (title, client_id, description, status, due_date) 
         VALUES (?, ?, ?, ?, ?)`,
        [title, client_id, description, status || 'Pending', due_date]
      );
      res.status(201).json({ id: result.lastID });
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({ error: 'Failed to create job' });
    }
  });

  // updateJob(id, data)
  app.put('/api/jobs/:id', async (req, res) => {
    const { title, client_id, description, status, due_date } = req.body;
    try {
      await db.run(
        `UPDATE print_jobs 
         SET title = ?, client_id = ?, description = ?, status = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [title, client_id, description, status, due_date, req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ error: 'Failed to update job' });
    }
  });

  // updateJobStatus(id, status)
  app.patch('/api/jobs/:id/status', async (req, res) => {
    const { status } = req.body;
    if (!['Pending', 'In Production', 'Finishing', 'Ready for Pickup', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    try {
      await db.run(
        `UPDATE print_jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating job status:', error);
      res.status(500).json({ error: 'Failed to update job status' });
    }
  });

  // --- Finance & Expenses API ---

  // getExpenses()
  app.get('/api/expenses', async (req, res) => {
    const month = req.query.month; // Format: YYYY-MM
    try {
      let query = `
        SELECT e.*, s.company_name as supplier_name 
        FROM expenses e 
        LEFT JOIN suppliers s ON e.supplier_id = s.id
      `;
      const params = [];
      
      if (month) {
        query += ' WHERE strftime("%Y-%m", e.date) = ?';
        params.push(month);
      }
      
      query += ' ORDER BY e.date DESC, e.created_at DESC';
      
      const expenses = await db.all(query, params);
      res.json(expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  });

  // createExpense(data)
  app.post('/api/expenses', async (req, res) => {
    const { date, category, description, amount, payment_method, supplier_id } = req.body;
    try {
      const result = await db.run(
        `INSERT INTO expenses (date, category, description, amount, payment_method, supplier_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [date, category, description, amount, payment_method, supplier_id || null]
      );
      res.status(201).json({ id: result.lastID });
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ error: 'Failed to create expense' });
    }
  });

  // updateExpense(id, data)
  app.put('/api/expenses/:id', async (req, res) => {
    const { date, category, description, amount, payment_method, supplier_id } = req.body;
    try {
      await db.run(
        `UPDATE expenses SET date = ?, category = ?, description = ?, amount = ?, payment_method = ?, supplier_id = ? WHERE id = ?`,
        [date, category, description, amount, payment_method, supplier_id || null, req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ error: 'Failed to update expense' });
    }
  });

  // deleteExpense(id)
  app.delete('/api/expenses/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM expenses WHERE id = ?', req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ error: 'Failed to delete expense' });
    }
  });

  // getFinanceSummary()
  app.get('/api/finance/summary', async (req, res) => {
    const month = req.query.month; // Format: YYYY-MM
    
    try {
      let incomeQuery = "SELECT SUM(total) as total_income FROM invoices WHERE status = 'Paid'";
      let expenseQuery = "SELECT SUM(amount) as total_expenses FROM expenses";
      const params = [];

      if (month) {
        incomeQuery += " AND strftime('%Y-%m', issue_date) = ?";
        expenseQuery += " WHERE strftime('%Y-%m', date) = ?";
        params.push(month);
      }

      const incomeResult = await db.get(incomeQuery, params);
      const expenseResult = await db.get(expenseQuery, params);

      res.json({
        income: incomeResult?.total_income || 0,
        expenses: expenseResult?.total_expenses || 0
      });
    } catch (error) {
      console.error('Error fetching finance summary:', error);
      res.status(500).json({ error: 'Failed to fetch finance summary' });
    }
  });

  // --- Supplier & Vendor API ---

  // getSuppliers()
  app.get('/api/suppliers', async (req, res) => {
    try {
      const suppliers = await db.all(`
        SELECT 
          s.*, 
          COALESCE(SUM(vb.total), 0) as total_spent,
          COALESCE(SUM(vb.total - vb.paid_amount), 0) as outstanding_dues
        FROM suppliers s
        LEFT JOIN vendor_bills vb ON s.id = vb.supplier_id
        GROUP BY s.id
        ORDER BY s.company_name ASC
      `);
      res.json(suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
  });

  // getSupplierById(id)
  app.get('/api/suppliers/:id', async (req, res) => {
    try {
      const supplier = await db.get(`
        SELECT 
          s.*, 
          COALESCE(SUM(vb.total), 0) as total_spent,
          COALESCE(SUM(vb.total - vb.paid_amount), 0) as outstanding_dues
        FROM suppliers s
        LEFT JOIN vendor_bills vb ON s.id = vb.supplier_id
        WHERE s.id = ?
        GROUP BY s.id
      `, req.params.id);
      
      if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
      
      const expenses = await db.all(`
        SELECT * FROM expenses WHERE supplier_id = ? ORDER BY date DESC
      `, req.params.id);
      
      res.json({ ...supplier, expenses });
    } catch (error) {
      console.error('Error fetching supplier details:', error);
      res.status(500).json({ error: 'Failed to fetch supplier details' });
    }
  });

  // createSupplier(data)
  app.post('/api/suppliers', async (req, res) => {
    const { company_name, contact_person, phone, email, address, tax_id, supply_category } = req.body;
    try {
      const result = await db.run(
        `INSERT INTO suppliers (company_name, contact_person, phone, email, address, tax_id, supply_category) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [company_name, contact_person, phone, email, address, tax_id, supply_category]
      );
      res.status(201).json({ id: result.lastID });
    } catch (error) {
      console.error('Error creating supplier:', error);
      res.status(500).json({ error: 'Failed to create supplier' });
    }
  });

  // updateSupplier(id, data)
  app.put('/api/suppliers/:id', async (req, res) => {
    const { company_name, contact_person, phone, email, address, tax_id, supply_category } = req.body;
    try {
      await db.run(
        `UPDATE suppliers 
         SET company_name = ?, contact_person = ?, phone = ?, email = ?, address = ?, tax_id = ?, supply_category = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [company_name, contact_person, phone, email, address, tax_id, supply_category, req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ error: 'Failed to update supplier' });
    }
  });

  // deleteSupplier(id)
  app.delete('/api/suppliers/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM suppliers WHERE id = ?', req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ error: 'Failed to delete supplier' });
    }
  });

  // Create Settings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT
    );
  `);

  // Insert default settings if empty
  const settingsCount = await db.get("SELECT COUNT(*) as count FROM settings");
  if (settingsCount.count === 0) {
    const defaultSettings = [
      ['shop_name', 'My Print Shop'],
      ['owner_name', 'John Doe'],
      ['phone', '(555) 123-4567'],
      ['email', 'hello@myprintshop.com'],
      ['address', '123 Print Ave\nCity, State 12345'],
      ['currency_symbol', '$'],
      ['tax_rate', '10']
    ];
    
    const stmt = await db.prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)');
    for (const [key, value] of defaultSettings) {
      await stmt.run(key, value);
    }
    await stmt.finalize();
  }

  // --- Settings API ---

  // getSettings()
  app.get('/api/settings', async (req, res) => {
    try {
      const rows = await db.all('SELECT * FROM settings');
      const settings: Record<string, string> = {};
      rows.forEach(row => {
        settings[row.setting_key] = row.setting_value;
      });
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // updateSettings(data)
  app.put('/api/settings', async (req, res) => {
    const settings = req.body;
    try {
      await db.run('BEGIN TRANSACTION');
      const stmt = await db.prepare('INSERT OR REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)');
      for (const [key, value] of Object.entries(settings)) {
        await stmt.run(key, String(value));
      }
      await stmt.finalize();
      await db.run('COMMIT');
      res.json({ success: true });
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // --- Dashboard API ---

  // getDashboardStats()
  app.get('/api/dashboard/stats', async (req, res) => {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // Default to current month YYYY-MM
    
    try {
      const [revenueResult, duesResult, expensesResult, activeJobsResult] = await Promise.all([
        db.get("SELECT SUM(total) as total_revenue FROM invoices WHERE status = 'Paid' AND strftime('%Y-%m', date) = ?", [month]),
        db.get("SELECT SUM(total) as outstanding_dues FROM invoices WHERE status IN ('Unpaid', 'Partial') AND strftime('%Y-%m', date) = ?", [month]),
        db.get("SELECT SUM(amount) as total_expenses FROM expenses WHERE strftime('%Y-%m', date) = ?", [month]),
        db.get("SELECT COUNT(*) as active_jobs FROM print_jobs WHERE status != 'Completed'")
      ]);

      const revenue = revenueResult?.total_revenue || 0;
      const expenses = expensesResult?.total_expenses || 0;

      res.json({
        revenue,
        outstanding_dues: duesResult?.outstanding_dues || 0,
        expenses,
        net_profit: revenue - expenses,
        active_jobs: activeJobsResult?.active_jobs || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // getDashboardActivity()
  app.get('/api/dashboard/activity', async (req, res) => {
    try {
      // Fetch recent invoices
      const invoices = await db.all(`
        SELECT id, 'invoice' as type, invoice_number as reference, status, total as amount, created_at as timestamp 
        FROM invoices 
        ORDER BY created_at DESC LIMIT 5
      `);

      // Fetch recent print jobs
      const jobs = await db.all(`
        SELECT id, 'job' as type, title as reference, status, NULL as amount, created_at as timestamp 
        FROM print_jobs 
        ORDER BY created_at DESC LIMIT 5
      `);

      // Fetch recent expenses
      const expenses = await db.all(`
        SELECT id, 'expense' as type, category as reference, NULL as status, amount, created_at as timestamp 
        FROM expenses 
        ORDER BY created_at DESC LIMIT 5
      `);

      // Combine, sort, and slice
      const allActivity = [...invoices, ...jobs, ...expenses]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      res.json(allActivity);
    } catch (error) {
      console.error('Error fetching dashboard activity:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard activity' });
    }
  });

  // --- Electron IPC Backend Logic (Main Process Equivalent) ---

  // getInvoices()
  app.get('/api/invoices', async (req, res) => {
    try {
      const invoices = await db.all('SELECT * FROM invoices ORDER BY created_at DESC');
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  });

  // getInvoiceById(id)
  app.get('/api/invoices/:id', async (req, res) => {
    try {
      const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      const items = await db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', req.params.id);
      res.json({ ...invoice, items });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ error: 'Failed to fetch invoice' });
    }
  });

  // createInvoice(data)
  app.post('/api/invoices', async (req, res) => {
    const {
      client_id, client_name, date, due_date,
      subtotal, tax_rate, tax_amount, discount, total, status, items
    } = req.body;

    // Determine initial paid_amount based on status
    let paid_amount = 0;
    if (status === 'Paid') {
      paid_amount = total;
    }

    try {
      await db.run('BEGIN TRANSACTION');

      // Generate a simple invoice number (e.g., INV-YYYYMMDD-XXXX)
      const countResult = await db.get('SELECT COUNT(*) as count FROM invoices');
      const invoiceCount = countResult.count + 1;
      const invoice_number = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${invoiceCount.toString().padStart(4, '0')}`;

      const result = await db.run(
        `INSERT INTO invoices (
          invoice_number, client_id, client_name, date, due_date,
          subtotal, tax_rate, tax_amount, discount, total, status, paid_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoice_number, client_id, client_name, date, due_date, subtotal, tax_rate, tax_amount, discount, total, status, paid_amount]
      );

      const invoiceId = result.lastID;

      for (const item of items) {
        await db.run(
          `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
           VALUES (?, ?, ?, ?, ?)`,
          [invoiceId, item.description, item.quantity, item.unit_price, item.total]
        );
      }

      await db.run('COMMIT');
      res.status(201).json({ id: invoiceId, invoice_number });
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error creating invoice:', error);
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  });

  // --- Quotes Management API ---

  // getQuotes()
  app.get('/api/quotes', async (req, res) => {
    try {
      const quotes = await db.all('SELECT * FROM quotes ORDER BY created_at DESC');
      res.json(quotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      res.status(500).json({ error: 'Failed to fetch quotes' });
    }
  });

  // getQuoteById(id)
  app.get('/api/quotes/:id', async (req, res) => {
    try {
      const quote = await db.get('SELECT * FROM quotes WHERE id = ?', req.params.id);
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      const items = await db.all('SELECT * FROM quote_items WHERE quote_id = ?', req.params.id);
      res.json({ ...quote, items });
    } catch (error) {
      console.error('Error fetching quote:', error);
      res.status(500).json({ error: 'Failed to fetch quote' });
    }
  });

  // createQuote(data)
  app.post('/api/quotes', async (req, res) => {
    const {
      client_id, client_name, date, valid_until,
      subtotal, tax_rate, tax_amount, discount, total, status, terms, items
    } = req.body;

    try {
      await db.run('BEGIN TRANSACTION');

      const countResult = await db.get('SELECT COUNT(*) as count FROM quotes');
      const quoteCount = countResult.count + 1;
      const quote_number = `EST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${quoteCount.toString().padStart(4, '0')}`;

      const result = await db.run(
        `INSERT INTO quotes (
          quote_number, client_id, client_name, date, valid_until,
          subtotal, tax_rate, tax_amount, discount, total, status, terms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [quote_number, client_id, client_name, date, valid_until, subtotal, tax_rate, tax_amount, discount, total, status, terms]
      );

      const quoteId = result.lastID;

      for (const item of items) {
        await db.run(
          `INSERT INTO quote_items (quote_id, description, quantity, unit_price, total)
           VALUES (?, ?, ?, ?, ?)`,
          [quoteId, item.description, item.quantity, item.unit_price, item.total]
        );
      }

      await db.run('COMMIT');
      res.status(201).json({ id: quoteId, quote_number });
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error creating quote:', error);
      res.status(500).json({ error: 'Failed to create quote' });
    }
  });

  // updateQuoteStatus(id, status)
  app.patch('/api/quotes/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
      await db.run('UPDATE quotes SET status = ? WHERE id = ?', [status, req.params.id]);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating quote status:', error);
      res.status(500).json({ error: 'Failed to update quote status' });
    }
  });

  // convertQuoteToJob(id)
  app.post('/api/quotes/:id/convert-to-job', async (req, res) => {
    try {
      await db.run('BEGIN TRANSACTION');
      
      const quote = await db.get('SELECT * FROM quotes WHERE id = ?', req.params.id);
      if (!quote) {
        await db.run('ROLLBACK');
        return res.status(404).json({ error: 'Quote not found' });
      }

      const result = await db.run(
        `INSERT INTO print_jobs (title, client_id, description, status, due_date, quote_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`Job from Quote ${quote.quote_number}`, quote.client_id, `Converted from ${quote.quote_number}`, 'Pending', quote.valid_until, quote.id]
      );

      await db.run('UPDATE quotes SET status = ? WHERE id = ?', ['Accepted', quote.id]);

      await db.run('COMMIT');
      res.status(201).json({ id: result.lastID, message: 'Converted to Print Job successfully' });
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error converting quote to job:', error);
      res.status(500).json({ error: 'Failed to convert quote to job' });
    }
  });

  // convertQuoteToInvoice(id)
  app.post('/api/quotes/:id/convert-to-invoice', async (req, res) => {
    try {
      await db.run('BEGIN TRANSACTION');
      
      const quote = await db.get('SELECT * FROM quotes WHERE id = ?', req.params.id);
      if (!quote) {
        await db.run('ROLLBACK');
        return res.status(404).json({ error: 'Quote not found' });
      }

      const items = await db.all('SELECT * FROM quote_items WHERE quote_id = ?', req.params.id);

      const countResult = await db.get('SELECT COUNT(*) as count FROM invoices');
      const invoiceCount = countResult.count + 1;
      const invoice_number = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${invoiceCount.toString().padStart(4, '0')}`;

      const result = await db.run(
        `INSERT INTO invoices (
          invoice_number, client_id, client_name, date, due_date,
          subtotal, tax_rate, tax_amount, discount, total, status, paid_amount, quote_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoice_number, quote.client_id, quote.client_name, 
          new Date().toISOString().slice(0, 10), quote.valid_until, 
          quote.subtotal, quote.tax_rate, quote.tax_amount, quote.discount, quote.total, 
          'Unpaid', 0, quote.id
        ]
      );

      const invoiceId = result.lastID;

      for (const item of items) {
        await db.run(
          `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
           VALUES (?, ?, ?, ?, ?)`,
          [invoiceId, item.description, item.quantity, item.unit_price, item.total]
        );
      }

      await db.run('UPDATE quotes SET status = ? WHERE id = ?', ['Accepted', quote.id]);

      await db.run('COMMIT');
      res.status(201).json({ id: invoiceId, invoice_number, message: 'Converted to Invoice successfully' });
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error converting quote to invoice:', error);
      res.status(500).json({ error: 'Failed to convert quote to invoice' });
    }
  });

  // --- Vendor Bills & Supplier Payments API ---

  // getBills()
  app.get('/api/bills', async (req, res) => {
    try {
      const bills = await db.all(`
        SELECT vb.*, s.company_name as supplier_name
        FROM vendor_bills vb
        JOIN suppliers s ON vb.supplier_id = s.id
        ORDER BY vb.date DESC
      `);
      res.json(bills);
    } catch (error) {
      console.error('Error fetching vendor bills:', error);
      res.status(500).json({ error: 'Failed to fetch vendor bills' });
    }
  });

  // getBillById(id)
  app.get('/api/bills/:id', async (req, res) => {
    try {
      const bill = await db.get(`
        SELECT vb.*, s.company_name as supplier_name
        FROM vendor_bills vb
        JOIN suppliers s ON vb.supplier_id = s.id
        WHERE vb.id = ?
      `, req.params.id);
      
      if (!bill) {
        return res.status(404).json({ error: 'Vendor bill not found' });
      }
      
      const items = await db.all('SELECT * FROM vendor_bill_items WHERE bill_id = ?', req.params.id);
      res.json({ ...bill, items });
    } catch (error) {
      console.error('Error fetching vendor bill:', error);
      res.status(500).json({ error: 'Failed to fetch vendor bill' });
    }
  });

  // createBill(data)
  app.post('/api/bills', async (req, res) => {
    const { supplier_id, bill_number, date, due_date, total, items } = req.body;

    try {
      await db.run('BEGIN TRANSACTION');

      const result = await db.run(
        `INSERT INTO vendor_bills (supplier_id, bill_number, date, due_date, total, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [supplier_id, bill_number, date, due_date, total, 'Unpaid']
      );

      const billId = result.lastID;

      for (const item of items) {
        await db.run(
          `INSERT INTO vendor_bill_items (bill_id, inventory_item_id, description, quantity, unit_cost, total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [billId, item.inventory_item_id || null, item.description, item.quantity, item.unit_cost, item.total]
        );

        if (item.inventory_item_id) {
          await db.run(
            `UPDATE inventory_items SET current_stock = current_stock + ? WHERE id = ?`,
            [item.quantity, item.inventory_item_id]
          );

          await db.run(
            `INSERT INTO stock_transactions (inventory_item_id, change_amount, type, reason)
             VALUES (?, ?, ?, ?)`,
            [item.inventory_item_id, item.quantity, 'Add', `Restock from Bill #${bill_number}`]
          );
        }
      }

      await db.run('COMMIT');
      res.status(201).json({ id: billId, bill_number });
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error creating vendor bill:', error);
      res.status(500).json({ error: 'Failed to create vendor bill' });
    }
  });

  // getSupplierLedger(id)
  app.get('/api/suppliers/:id/ledger', async (req, res) => {
    try {
      const supplierId = req.params.id;
      
      const bills = await db.all(`
        SELECT 
          id, 
          bill_number as reference, 
          date, 
          total as amount, 
          'bill' as type,
          status
        FROM vendor_bills 
        WHERE supplier_id = ?
      `, supplierId);

      const payments = await db.all(`
        SELECT 
          id, 
          COALESCE(reference_number, 'Payment') as reference, 
          date, 
          amount, 
          'payment' as type,
          'Completed' as status
        FROM supplier_payments 
        WHERE supplier_id = ?
      `, supplierId);

      const ledger = [...bills, ...payments].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      let runningBalance = 0;
      const ledgerWithBalance = ledger.map(item => {
        if (item.type === 'bill') {
          runningBalance += item.amount;
        } else {
          runningBalance -= item.amount;
        }
        return { ...item, balance: runningBalance };
      });

      res.json(ledgerWithBalance.reverse());
    } catch (error) {
      console.error('Error fetching supplier ledger:', error);
      res.status(500).json({ error: 'Failed to fetch supplier ledger' });
    }
  });

  // recordSupplierPayment(id, data)
  app.post('/api/suppliers/:id/payments', async (req, res) => {
    const supplierId = req.params.id;
    const { amount, date, payment_method, reference_number } = req.body;

    try {
      await db.run('BEGIN TRANSACTION');

      await db.run(
        `INSERT INTO supplier_payments (supplier_id, amount, date, payment_method, reference_number)
         VALUES (?, ?, ?, ?, ?)`,
        [supplierId, amount, date, payment_method, reference_number]
      );

      const unpaidBills = await db.all(`
        SELECT * FROM vendor_bills 
        WHERE supplier_id = ? AND status IN ('Unpaid', 'Partial')
        ORDER BY date ASC
      `, supplierId);

      let remainingPayment = amount;

      for (const bill of unpaidBills) {
        if (remainingPayment <= 0) break;

        const amountDue = bill.total - bill.paid_amount;
        const paymentToApply = Math.min(remainingPayment, amountDue);
        
        const newPaidAmount = bill.paid_amount + paymentToApply;
        const newStatus = newPaidAmount >= bill.total ? 'Paid' : 'Partial';

        await db.run(
          `UPDATE vendor_bills SET paid_amount = ?, status = ? WHERE id = ?`,
          [newPaidAmount, newStatus, bill.id]
        );

        remainingPayment -= paymentToApply;
      }

      await db.run('COMMIT');
      res.status(201).json({ success: true });
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error recording supplier payment:', error);
      res.status(500).json({ error: 'Failed to record supplier payment' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
