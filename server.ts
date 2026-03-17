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
  `);

  return db;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const db = await setupDatabase();

  // --- Client Management API ---

  // getClients()
  app.get('/api/clients', async (req, res) => {
    try {
      const clients = await db.all(`
        SELECT 
          c.*,
          COALESCE(SUM(i.total), 0) as total_spent,
          COALESCE(SUM(CASE WHEN i.status IN ('Unpaid', 'Partial') THEN i.total ELSE 0 END), 0) as outstanding_dues
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
          COALESCE(SUM(CASE WHEN i.status IN ('Unpaid', 'Partial') THEN i.total ELSE 0 END), 0) as outstanding_dues
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

    try {
      await db.run('BEGIN TRANSACTION');

      // Generate a simple invoice number (e.g., INV-YYYYMMDD-XXXX)
      const countResult = await db.get('SELECT COUNT(*) as count FROM invoices');
      const invoiceCount = countResult.count + 1;
      const invoice_number = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${invoiceCount.toString().padStart(4, '0')}`;

      const result = await db.run(
        `INSERT INTO invoices (
          invoice_number, client_id, client_name, date, due_date,
          subtotal, tax_rate, tax_amount, discount, total, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoice_number, client_id, client_name, date, due_date, subtotal, tax_rate, tax_amount, discount, total, status]
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
