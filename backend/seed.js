require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Shelf = require('./models/Shelf');
const InventoryItem = require('./models/InventoryItem');
const Equipment = require('./models/Equipment');
const Alert = require('./models/Alert');
const MovementHistory = require('./models/MovementHistory');
const { syncSystemAlerts } = require('./services/alertService');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected! Cleaning old data...');

    // Clean existing collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await Shelf.deleteMany({});
    await InventoryItem.deleteMany({});
    await Equipment.deleteMany({});
    await Alert.deleteMany({});
    await MovementHistory.deleteMany({});

    console.log('Creating Users...');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@twinware.com',
      password: 'adminpassword123',
      role: 'admin',
    });

    const managerUser = await User.create({
      username: 'warehouse_mgr',
      email: 'manager@twinware.com',
      password: 'managerpassword123',
      role: 'manager',
    });

    await User.create({
      username: 'warehouse_auditor',
      email: 'viewer@twinware.com',
      password: 'viewerpassword123',
      role: 'viewer',
    });

    console.log('Creating Shelves (2D Warehouse Layout)...');
    // Zone A: 3 Rows x 4 Columns = 12 Shelves
    const shelfDocs = [];
    for (let r = 1; r <= 3; r++) {
      for (let c = 1; c <= 4; c++) {
        const codeNum = (r - 1) * 4 + c;
        const codeStr = codeNum < 10 ? `0${codeNum}` : `${codeNum}`;
        shelfDocs.push({
          code: `A-${codeStr}`,
          zone: 'Zone A',
          row: r,
          column: c,
          capacity: [80, 100, 120, 150][(r + c) % 4],
          status: 'Active',
          description: `Zone A High-Bay Rack Tier ${r}, Bay ${c}`,
        });
      }
    }

    // Zone B: 2 Rows x 4 Columns = 8 Shelves
    for (let r = 1; r <= 2; r++) {
      for (let c = 1; c <= 4; c++) {
        const codeNum = (r - 1) * 4 + c;
        const codeStr = codeNum < 10 ? `0${codeNum}` : `${codeNum}`;
        shelfDocs.push({
          code: `B-${codeStr}`,
          zone: 'Zone B',
          row: r,
          column: c,
          capacity: [100, 150, 200, 120][(r + c) % 4],
          status: r === 2 && c === 4 ? 'Maintenance' : 'Active',
          description: `Zone B Bulk Pallet Rack Tier ${r}, Bay ${c}`,
        });
      }
    }

    const createdShelves = await Shelf.insertMany(shelfDocs);

    console.log('Creating Products...');
    const productsData = [
      {
        sku: 'ELC-101',
        name: 'Industrial IoT Gateway Module',
        category: 'Electronics',
        price: 249.99,
        reorderLevel: 15,
        unit: 'Units',
        description: 'Multi-protocol DIN rail mount edge gateway with RS485 and LoRaWAN.',
      },
      {
        sku: 'ELC-102',
        name: 'LiFePO4 48V Battery Module',
        category: 'Electronics',
        price: 580.00,
        reorderLevel: 10,
        unit: 'Packs',
        description: 'Lithium iron phosphate battery pack for heavy warehouse robotics.',
      },
      {
        sku: 'AUT-201',
        name: 'Heavy Duty Hydraulic Fluid (20L)',
        category: 'Automotive',
        price: 65.50,
        reorderLevel: 25,
        unit: 'Drums',
        description: 'ISO VG 46 high performance anti-wear hydraulic oil for forklifts.',
      },
      {
        sku: 'AUT-202',
        name: 'V-Groove Industrial Drive Belts',
        category: 'Automotive',
        price: 32.00,
        reorderLevel: 30,
        unit: 'Pcs',
        description: 'Reinforced rubber belts for high-load conveyor drives.',
      },
      {
        sku: 'RAW-301',
        name: 'Precision Aluminum Extrusions 40x40',
        category: 'Raw Materials',
        price: 45.00,
        reorderLevel: 20,
        unit: 'Bars',
        description: '3-meter anodized T-slot aluminum profiles for modular frames.',
      },
      {
        sku: 'RAW-302',
        name: 'Carbon Fiber Weave Roll (1.2m x 50m)',
        category: 'Raw Materials',
        price: 420.00,
        reorderLevel: 5,
        unit: 'Rolls',
        description: '3K 200g/m² twill weave carbon fiber composite fabric.',
      },
      {
        sku: 'PKG-401',
        name: 'Heavy-Duty Corrugated Shipping Boxes (XL)',
        category: 'Packaging',
        price: 4.50,
        reorderLevel: 50,
        unit: 'Bundles',
        description: 'Double-walled export quality carton boxes (600x400x400mm).',
      },
      {
        sku: 'PKG-402',
        name: 'Biodegradable Stretch Wrap (500mm)',
        category: 'Packaging',
        price: 18.00,
        reorderLevel: 20,
        unit: 'Rolls',
        description: 'Eco-friendly pallet wrap film with 300% pre-stretch rating.',
      },
      {
        sku: 'SAF-501',
        name: 'Smart Safety Helmet with Beacon',
        category: 'Safety',
        price: 89.00,
        reorderLevel: 12,
        unit: 'Units',
        description: 'ANSI Z89.1 certified helmet with integrated proximity sensor tag.',
      },
      {
        sku: 'SAF-502',
        name: 'Cut-Resistant Grip Gloves (Level 5)',
        category: 'Safety',
        price: 14.50,
        reorderLevel: 40,
        unit: 'Pairs',
        description: 'Nitrile coated HPPE fiber handling gloves.',
      },
    ];

    const createdProducts = await Product.insertMany(productsData);

    console.log('Stocking Shelves (InventoryItems & Initial Movements)...');
    // Map shelves by code for easy stocking
    const shelfMap = {};
    createdShelves.forEach(s => { shelfMap[s.code] = s; });

    // Stock assignments (deliberately leaving some shelves empty or with various levels)
    const stockAllocations = [
      { prodIndex: 0, shelfCode: 'A-01', qty: 28, batch: 'BAT-2026-A1' },
      { prodIndex: 0, shelfCode: 'A-02', qty: 14, batch: 'BAT-2026-A2' },
      { prodIndex: 1, shelfCode: 'A-03', qty: 8, batch: 'BAT-2026-B1' },  // 8 <= 10 -> Low stock trigger!
      { prodIndex: 2, shelfCode: 'A-05', qty: 45, batch: 'BAT-2026-C1' },
      { prodIndex: 3, shelfCode: 'A-06', qty: 60, batch: 'BAT-2026-D1' },
      { prodIndex: 4, shelfCode: 'A-09', qty: 35, batch: 'BAT-2026-E1' },
      { prodIndex: 5, shelfCode: 'A-10', qty: 3, batch: 'BAT-2026-F1' },   // 3 <= 5 -> Low stock trigger!
      { prodIndex: 6, shelfCode: 'B-01', qty: 90, batch: 'BAT-2026-G1' },
      { prodIndex: 7, shelfCode: 'B-02', qty: 35, batch: 'BAT-2026-H1' },
      { prodIndex: 8, shelfCode: 'B-05', qty: 25, batch: 'BAT-2026-I1' },
      { prodIndex: 9, shelfCode: 'B-06', qty: 55, batch: 'BAT-2026-J1' },
      { prodIndex: 2, shelfCode: 'A-01', qty: 15, batch: 'BAT-2026-C2' }, // Multiple products on A-01
    ];

    const inventoryDocs = [];
    const movementDocs = [];

    for (const alloc of stockAllocations) {
      const product = createdProducts[alloc.prodIndex];
      const shelf = shelfMap[alloc.shelfCode];

      inventoryDocs.push({
        product: product._id,
        shelf: shelf._id,
        quantity: alloc.qty,
        batchNumber: alloc.batch,
        lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 5)),
      });

      movementDocs.push({
        type: 'STOCK_IN',
        product: product._id,
        shelf: shelf._id,
        quantity: alloc.qty,
        user: adminUser._id,
        referenceNo: `RCV-${Math.floor(100000 + Math.random() * 900000)}`,
        notes: `Initial stock induction of ${alloc.qty} ${product.unit}`,
        date: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7)),
      });
    }

    // Add a couple of realistic STOCK_OUT historical movements
    movementDocs.push({
      type: 'STOCK_OUT',
      product: createdProducts[0]._id,
      shelf: shelfMap['A-01']._id,
      quantity: 5,
      user: managerUser._id,
      referenceNo: 'DISP-892110',
      notes: 'Outbound dispatch for Assembly Plant Line 3',
      date: new Date(Date.now() - 86400000 * 2),
    });

    movementDocs.push({
      type: 'STOCK_OUT',
      product: createdProducts[2]._id,
      shelf: shelfMap['A-05']._id,
      quantity: 10,
      user: managerUser._id,
      referenceNo: 'DISP-892115',
      notes: 'Scheduled routine maintenance fluid draw',
      date: new Date(Date.now() - 86400000 * 1),
    });

    await InventoryItem.insertMany(inventoryDocs);
    await MovementHistory.insertMany(movementDocs);

    console.log('Creating Equipment Fleet...');
    const equipmentData = [
      {
        code: 'FL-01',
        name: 'Crown Reach Forklift Alpha',
        type: 'Forklift',
        zone: 'Zone A',
        status: 'Operational',
        healthPercentage: 94,
        operator: 'John Doe (Badge #401)',
        notes: 'Electric reach truck, battery serviced recently.',
      },
      {
        code: 'FL-02',
        name: 'Toyota High-Capacity Forklift',
        type: 'Forklift',
        zone: 'Zone B',
        status: 'Maintenance',
        healthPercentage: 58,
        operator: 'Unassigned',
        notes: 'Hydraulic seal inspection in progress at Bay 4.',
      },
      {
        code: 'CV-101',
        name: 'Intralox Automated Sorting Conveyor',
        type: 'Conveyor',
        zone: 'Zone A',
        status: 'Operational',
        healthPercentage: 88,
        operator: 'Station 1 Automated System',
        notes: 'Variable speed main intake feeder conveyor.',
      },
      {
        code: 'AGV-03',
        name: 'KUKA Autonomous Mobile Tugger',
        type: 'Robot AGV',
        zone: 'Zone B',
        status: 'Offline',
        healthPercentage: 42,
        operator: 'Unassigned',
        notes: 'LiDAR calibration fault reported on drive axle.',
      },
      {
        code: 'CR-01',
        name: 'Demag Overhead Gantry Crane',
        type: 'Crane',
        zone: 'Zone B',
        status: 'Operational',
        healthPercentage: 98,
        operator: 'David Miller (Certified)',
        notes: '5-ton capacity hoist inspected and cleared.',
      },
      {
        code: 'SC-05',
        name: 'Zebra TC8300 Mobile Terminal Fleet',
        type: 'Scanner',
        zone: 'Zone A',
        status: 'Operational',
        healthPercentage: 82,
        operator: 'Shift A Pickers',
        notes: 'Long-range 2D imager dock.',
      },
    ];

    await Equipment.insertMany(equipmentData);

    console.log('Synchronizing automated alerts...');
    await syncSystemAlerts();

    const activeAlerts = await Alert.countDocuments({ status: 'Active' });
    console.log(`Seed completed successfully! Generated ${activeAlerts} active database alerts.`);
    console.log('Demo Credentials:');
    console.log('  Admin:   admin@twinware.com   / adminpassword123');
    console.log('  Manager: manager@twinware.com / managerpassword123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
