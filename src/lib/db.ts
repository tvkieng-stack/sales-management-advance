import {
  ActivityLog,
  ActivityActionType,
  ActivitySeverity,
  ActivityTargetType,
  Category,
  Customer,
  CustomerTier,
  Employee,
  Invoice,
  InvoiceDetail,
  LoyaltyTransaction,
  LoyaltyTransactionType,
  PaymentMethod,
  Product,
  Promotion,
  Purchase,
  PurchaseDetail,
  Role,
  Status,
  StockTransaction,
  Supplier,
  User,
} from '../types';

const DB_KEY = 'sales_management_db_v1';

export const LOYALTY_CONFIG = {
  POINTS_PER_VND_SPENT: 1 / 10000, // 1 point per 10,000 VND base
  VND_PER_POINT_REDEEM: 100, // 1 point = 100 VND discount
  TIERS: {
    BRONZE: { name: 'Thành viên Chuẩn (Bronze)', minPoints: 0, multiplier: 1.0, badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
    SILVER: { name: 'Thành viên Bạc (Silver)', minPoints: 100, multiplier: 1.2, badgeBg: 'bg-slate-200 text-slate-800 border-slate-300' },
    GOLD: { name: 'Thành viên Vàng (Gold)', minPoints: 300, multiplier: 1.5, badgeBg: 'bg-yellow-100 text-yellow-900 border-yellow-400' },
    DIAMOND: { name: 'Thành viên Kim Cương (Diamond)', minPoints: 1000, multiplier: 2.0, badgeBg: 'bg-purple-100 text-purple-900 border-purple-300' },
  },
};

export const calculateCustomerTier = (points: number): CustomerTier => {
  if (points >= 1000) return 'DIAMOND';
  if (points >= 300) return 'GOLD';
  if (points >= 100) return 'SILVER';
  return 'BRONZE';
};

export const getTierMultiplier = (tier?: CustomerTier): number => {
  switch (tier) {
    case 'DIAMOND':
      return 2.0;
    case 'GOLD':
      return 1.5;
    case 'SILVER':
      return 1.2;
    case 'BRONZE':
    default:
      return 1.0;
  }
};

export const getTierInfo = (points: number) => {
  const tier = calculateCustomerTier(points);
  const info = LOYALTY_CONFIG.TIERS[tier];
  let nextTier: CustomerTier | null = null;
  let pointsToNext = 0;
  let progressPercent = 100;

  if (tier === 'BRONZE') {
    nextTier = 'SILVER';
    pointsToNext = 100 - points;
    progressPercent = Math.min(100, Math.max(0, (points / 100) * 100));
  } else if (tier === 'SILVER') {
    nextTier = 'GOLD';
    pointsToNext = 300 - points;
    progressPercent = Math.min(100, Math.max(0, ((points - 100) / 200) * 100));
  } else if (tier === 'GOLD') {
    nextTier = 'DIAMOND';
    pointsToNext = 1000 - points;
    progressPercent = Math.min(100, Math.max(0, ((points - 300) / 700) * 100));
  }

  return {
    tier,
    tierName: info.name,
    multiplier: info.multiplier,
    badgeBg: info.badgeBg,
    nextTier,
    pointsToNext: Math.max(0, pointsToNext),
    progressPercent: Math.round(progressPercent),
  };
};

interface DBState {
  users: User[];
  employees: Employee[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  invoiceDetails: InvoiceDetail[];
  purchases: Purchase[];
  purchaseDetails: PurchaseDetail[];
  stockTransactions: StockTransaction[];
  promotions: Promotion[];
  loyaltyTransactions: LoyaltyTransaction[];
  activityLogs: ActivityLog[];
}

const getInitialSeedData = (): DBState => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const formatDateTime = (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19);

  const employees: Employee[] = [
    {
      id: 1,
      name: 'Nguyễn Văn Quản Trị',
      phone: '0901234567',
      email: 'admin@cuahang.vn',
      address: '123 Nguyễn Huệ, Q.1, TP.HCM',
      position: 'Quản trị viên hệ thống',
      salary: 25000000,
      status: 'ACTIVE',
      createdAt: '2025-01-01 08:00:00',
    },
    {
      id: 2,
      name: 'Trần Thị Quản Lý',
      phone: '0912345678',
      email: 'manager@cuahang.vn',
      address: '45 Lê Lợi, Q.1, TP.HCM',
      position: 'Quản lý cửa hàng',
      salary: 18000000,
      status: 'ACTIVE',
      createdAt: '2025-01-05 08:30:00',
    },
    {
      id: 3,
      name: 'Lê Hoàng Thu Ngân',
      phone: '0987654321',
      email: 'staff@cuahang.vn',
      address: '89 Điện Biên Phủ, Bình Thạnh, TP.HCM',
      position: 'Nhân viên thu ngân',
      salary: 9000000,
      status: 'ACTIVE',
      createdAt: '2025-01-10 09:00:00',
    },
  ];

  const users: User[] = [
    {
      id: 1,
      username: 'admin',
      passwordHash: 'admin123',
      roleId: 1,
      roleName: 'ADMIN',
      employeeId: 1,
      employeeName: 'Nguyễn Văn Quản Trị',
      status: 'ACTIVE',
      createdAt: '2025-01-01 08:00:00',
    },
    {
      id: 2,
      username: 'manager',
      passwordHash: '123456',
      roleId: 2,
      roleName: 'MANAGER',
      employeeId: 2,
      employeeName: 'Trần Thị Quản Lý',
      status: 'ACTIVE',
      createdAt: '2025-01-05 08:30:00',
    },
    {
      id: 3,
      username: 'staff',
      passwordHash: '123456',
      roleId: 3,
      roleName: 'EMPLOYEE',
      employeeId: 3,
      employeeName: 'Lê Hoàng Thu Ngân',
      status: 'ACTIVE',
      createdAt: '2025-01-10 09:00:00',
    },
  ];

  const categories: Category[] = [
    { id: 1, name: 'Đồ uống & Giải khát', description: 'Nước ngọt, trà, cà phê, nước suối', status: 'ACTIVE' },
    { id: 2, name: 'Bánh kẹo & Snack', description: 'Bánh ngọt, snack khoai tây, kẹo dẻo', status: 'ACTIVE' },
    { id: 3, name: 'Thực phẩm tiện lợi', description: 'Mì gói, cháo ăn liền, xúc xích', status: 'ACTIVE' },
    { id: 4, name: 'Gia vị & Hàng khô', description: 'Nước mắm, dầu ăn, đường, muối', status: 'ACTIVE' },
    { id: 5, name: 'Hóa mỹ phẩm & Chăm sóc cá nhân', description: 'Dầu gội, xà phòng, khăn giấy', status: 'ACTIVE' },
  ];

  const products: Product[] = [
    {
      id: 1,
      barcode: '893456001001',
      name: 'Nước khoáng Lavie 500ml',
      categoryId: 1,
      categoryName: 'Đồ uống & Giải khát',
      unit: 'Chai',
      costPrice: 4000,
      sellingPrice: 7000,
      stockQuantity: 120,
      minimumStock: 20,
      status: 'ACTIVE',
      createdAt: '2025-01-01 08:00:00',
      updatedAt: '2025-01-01 08:00:00',
    },
    {
      id: 2,
      barcode: '893456001002',
      name: 'Nước ngọt Coca Cola 330ml',
      categoryId: 1,
      categoryName: 'Đồ uống & Giải khát',
      unit: 'Lon',
      costPrice: 7500,
      sellingPrice: 12000,
      stockQuantity: 85,
      minimumStock: 15,
      status: 'ACTIVE',
      createdAt: '2025-01-01 08:00:00',
      updatedAt: '2025-01-01 08:00:00',
    },
    {
      id: 3,
      barcode: '893456001003',
      name: 'Trà Xanh Không Độ 455ml',
      categoryId: 1,
      categoryName: 'Đồ uống & Giải khát',
      unit: 'Chai',
      costPrice: 6500,
      sellingPrice: 11000,
      stockQuantity: 45,
      minimumStock: 15,
      status: 'ACTIVE',
      createdAt: '2025-01-01 08:00:00',
      updatedAt: '2025-01-01 08:00:00',
    },
    {
      id: 4,
      barcode: '893456002001',
      name: 'Snack Oishi Tôm Cay 40g',
      categoryId: 2,
      categoryName: 'Bánh kẹo & Snack',
      unit: 'Gói',
      costPrice: 4200,
      sellingPrice: 7000,
      stockQuantity: 60,
      minimumStock: 20,
      status: 'ACTIVE',
      createdAt: '2025-01-01 08:00:00',
      updatedAt: '2025-01-01 08:00:00',
    },
    {
      id: 5,
      barcode: '893456002002',
      name: 'Bánh Chocopie Hộp 6 Cái',
      categoryId: 2,
      categoryName: 'Bánh kẹo & Snack',
      unit: 'Hộp',
      costPrice: 24000,
      sellingPrice: 35000,
      stockQuantity: 8, // Low stock warning
      minimumStock: 10,
      status: 'ACTIVE',
      createdAt: '2025-01-01 08:00:00',
      updatedAt: '2025-01-01 08:00:00',
    },
    {
      id: 6,
      barcode: '893456003001',
      name: 'Mì Hảo Hảo Tôm Chua Cay 75g',
      categoryId: 3,
      categoryName: 'Thực phẩm tiện lợi',
      unit: 'Gói',
      costPrice: 3200,
      sellingPrice: 5000,
      stockQuantity: 250,
      minimumStock: 50,
      status: 'ACTIVE',
      createdAt: '2025-01-01 08:00:00',
      updatedAt: '2025-01-01 08:00:00',
    },
    {
      id: 7,
      barcode: '893456003002',
      name: 'Xúc xích Vissan Heo 4 Cây',
      categoryId: 3,
      categoryName: 'Thực phẩm tiện lợi',
      unit: 'Gói',
      costPrice: 12000,
      sellingPrice: 18000,
      stockQuantity: 4, // Low stock warning
      minimumStock: 10,
      status: 'ACTIVE',
      createdAt: '2025-01-01 08:00:00',
      updatedAt: '2025-01-01 08:00:00',
    },
    {
      id: 8,
      barcode: '893456004001',
      name: 'Dầu Ăn Simply Nguyên Chất 1L',
      categoryId: 4,
      categoryName: 'Gia vị & Hàng khô',
      unit: 'Chai',
      costPrice: 42000,
      sellingPrice: 56000,
      stockQuantity: 30,
      minimumStock: 8,
      status: 'ACTIVE',
      createdAt: '2025-01-01 08:00:00',
      updatedAt: '2025-01-01 08:00:00',
    },
    {
      id: 9,
      barcode: '893456005001',
      name: 'Khăn giấy lụa Pulppy 100 tờ',
      categoryId: 5,
      categoryName: 'Hóa mỹ phẩm & Chăm sóc cá nhân',
      unit: 'Hộp',
      costPrice: 16000,
      sellingPrice: 23000,
      stockQuantity: 35,
      minimumStock: 10,
      status: 'ACTIVE',
      createdAt: '2025-01-01 08:00:00',
      updatedAt: '2025-01-01 08:00:00',
    },
  ];

  const customers: Customer[] = [
    {
      id: 1,
      name: 'Hoàng Anh Dũng',
      phone: '0933112233',
      email: 'dung.hoang@gmail.com',
      address: '12 Nguyễn Trãi, Q.5, TP.HCM',
      loyaltyPoints: 45,
      tier: 'BRONZE',
      totalEarnedPoints: 45,
      totalRedeemedPoints: 0,
      createdAt: '2025-01-15 10:00:00',
    },
    {
      id: 2,
      name: 'Phạm Thị Mai',
      phone: '0977889900',
      email: 'mai.pham@gmail.com',
      address: '78 Hai Bà Trưng, Q.3, TP.HCM',
      loyaltyPoints: 120,
      tier: 'SILVER',
      totalEarnedPoints: 170,
      totalRedeemedPoints: 50,
      createdAt: '2025-01-20 14:15:00',
    },
    {
      id: 3,
      name: 'Vũ Đức Minh',
      phone: '0908997766',
      email: 'minh.vu@gmail.com',
      address: '250 CMT8, Q.10, TP.HCM',
      loyaltyPoints: 15,
      tier: 'BRONZE',
      totalEarnedPoints: 15,
      totalRedeemedPoints: 0,
      createdAt: '2025-02-01 11:30:00',
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: 1,
      name: 'Công ty TNHH Phân Phối Đồ Uống Sài Gòn',
      phone: '02838383838',
      email: 'order@saigondrinks.vn',
      address: 'KCN Tân Bình, Tân Phú, TP.HCM',
      status: 'ACTIVE',
    },
    {
      id: 2,
      name: 'Nhà Phân Phối Hàng Tiêu Dùng Á Châu',
      phone: '02839999999',
      email: 'contact@asiaconsumer.vn',
      address: 'KCN Vĩnh Lộc, Bình Chánh, TP.HCM',
      status: 'ACTIVE',
    },
    {
      id: 3,
      name: 'Tổng Đại Lý Thực Phẩm Tiện Lợi Miền Nam',
      phone: '02837777777',
      email: 'sales@miennamfood.vn',
      address: 'KCN Sóng Thần, Dĩ An, Bình Dương',
      status: 'ACTIVE',
    },
  ];

  const promotions: Promotion[] = [
    {
      id: 1,
      name: 'Ưu đãi Khai xuân Giảm 10%',
      description: 'Giảm 10% cho tất cả đơn hàng trên toàn hệ thống',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startDate: '2025-01-01',
      endDate: '2026-12-31',
      status: 'ACTIVE',
    },
    {
      id: 2,
      name: 'Giảm ngay 20.000đ cho đơn từ 200k',
      description: 'Khấu trừ trực tiếp 20.000 VNĐ vào hóa đơn',
      discountType: 'FIXED_AMOUNT',
      discountValue: 20000,
      startDate: '2025-01-01',
      endDate: '2026-12-31',
      status: 'ACTIVE',
    },
  ];

  // Generate realistic seed invoices and details across the last 30 days
  const sampleInvoices: Invoice[] = [];
  const sampleInvoiceDetails: InvoiceDetail[] = [];
  let nextInvId = 1;
  let nextDetailId = 1;

  const catalog = [
    { id: 1, name: 'Nước khoáng Lavie 500ml', barcode: '893456001001', price: 7000, cost: 4000 },
    { id: 2, name: 'Nước ngọt Coca Cola 330ml', barcode: '893456001002', price: 12000, cost: 8500 },
    { id: 3, name: 'Trà Xanh Không Độ 455ml', barcode: '893456001003', price: 10000, cost: 7000 },
    { id: 4, name: 'Snack Oishi Tôm Cay 40g', barcode: '893456002001', price: 7000, cost: 4500 },
    { id: 5, name: 'Bánh Chocopie Hộp 6 Cái', barcode: '893456002002', price: 35000, cost: 24000 },
    { id: 6, name: 'Mì Hảo Hảo Tôm Chua Cay 75g', barcode: '893456003001', price: 5000, cost: 3200 },
    { id: 7, name: 'Xúc xích Vissan Heo 4 Cây', barcode: '893456003002', price: 18000, cost: 12000 },
    { id: 8, name: 'Dầu Ăn Simply Nguyên Chất 1L', barcode: '893456004001', price: 56000, cost: 42000 },
    { id: 9, name: 'Khăn giấy lụa Pulppy 100 tờ', barcode: '893456005001', price: 23000, cost: 16000 },
  ];

  const custOptions = [
    { id: 1, name: 'Hoàng Anh Dũng' },
    { id: 2, name: 'Phạm Thị Mai' },
    { id: 3, name: 'Trần Quốc Bảo' },
    { id: 4, name: 'Vũ Thị Lan' },
    { id: null, name: 'Khách lẻ vãng lai' },
  ];

  const paymentMethods: PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD'];

  // Seed invoices for each of the last 30 days
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const dayDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dayDateStr = dayDate.toISOString().split('T')[0];
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

    // 2 to 5 transactions per day (weekends have more transactions)
    const txCount = isWeekend ? 3 + (dayOffset % 3) : 2 + (dayOffset % 2);

    for (let t = 0; t < txCount; t++) {
      const invId = nextInvId++;
      const hour = 8 + Math.floor(t * 3) + (dayOffset % 3);
      const minute = 10 + ((t * 17 + dayOffset * 7) % 45);
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      const createdAt = `${dayDateStr} ${timeStr}`;

      const cust = custOptions[(dayOffset + t) % custOptions.length];
      const pMethod = paymentMethods[(dayOffset + t) % paymentMethods.length];

      // Pick 2 to 4 items
      const numItems = 2 + ((dayOffset + t) % 3);
      const pickedItems: Array<{ prod: typeof catalog[0]; qty: number }> = [];
      for (let pIdx = 0; pIdx < numItems; pIdx++) {
        const prod = catalog[(t * 2 + pIdx + dayOffset) % catalog.length];
        const qty = 1 + ((pIdx + dayOffset + t) % 4);
        pickedItems.push({ prod, qty });
      }

      let subtotal = 0;
      for (const item of pickedItems) {
        const itemSubtotal = item.qty * item.prod.price;
        subtotal += itemSubtotal;
        sampleInvoiceDetails.push({
          id: nextDetailId++,
          invoiceId: invId,
          productId: item.prod.id,
          productName: item.prod.name,
          barcode: item.prod.barcode,
          quantity: item.qty,
          unitPrice: item.prod.price,
          discount: 0,
          subtotal: itemSubtotal,
        });
      }

      // Occasional discount for loyalty customers
      const discount = cust.id && subtotal > 100000 ? Math.round(subtotal * 0.05) : 0;
      const total = subtotal - discount;

      const codeSuffix = invId.toString().padStart(4, '0');
      const invoiceCode = `HD-${dayDateStr.replace(/-/g, '')}-${codeSuffix}`;

      sampleInvoices.push({
        id: invId,
        invoiceCode,
        employeeId: 3,
        employeeName: 'Lê Hoàng Thu Ngân',
        customerId: cust.id,
        customerName: cust.name,
        subtotal,
        discount,
        total,
        paymentMethod: pMethod,
        status: 'PAID',
        createdAt,
      });
    }
  }

  const samplePurchases: Purchase[] = [
    {
      id: 1,
      purchaseCode: 'PN-20250210-0001',
      supplierId: 1,
      supplierName: 'Công ty TNHH Phân Phối Đồ Uống Sài Gòn',
      employeeId: 2,
      employeeName: 'Trần Thị Quản Lý',
      totalCost: 1500000,
      status: 'COMPLETED',
      createdAt: `${todayStr} 08:00:00`,
    },
  ];

  const samplePurchaseDetails: PurchaseDetail[] = [
    {
      id: 1,
      purchaseId: 1,
      productId: 1,
      productName: 'Nước khoáng Lavie 500ml',
      quantity: 100,
      unitCost: 4000,
      subtotal: 400000,
    },
    {
      id: 2,
      purchaseId: 1,
      productId: 2,
      productName: 'Nước ngọt Coca Cola 330ml',
      quantity: 100,
      unitCost: 7500,
      subtotal: 750000,
    },
    {
      id: 3,
      purchaseId: 1,
      productId: 3,
      productName: 'Trà Xanh Không Độ 455ml',
      quantity: 50,
      unitCost: 6500,
      subtotal: 325000,
    },
  ];

  const stockTransactions: StockTransaction[] = [
    {
      id: 1,
      productId: 1,
      productName: 'Nước khoáng Lavie 500ml',
      employeeId: 2,
      employeeName: 'Trần Thị Quản Lý',
      type: 'PURCHASE',
      quantity: 100,
      referenceType: 'PURCHASE',
      referenceId: 1,
      note: 'Nhập hàng theo phiếu PN-20250210-0001',
      createdAt: `${todayStr} 08:00:00`,
    },
    {
      id: 2,
      productId: 1,
      productName: 'Nước khoáng Lavie 500ml',
      employeeId: 3,
      employeeName: 'Lê Hoàng Thu Ngân',
      type: 'SALE',
      quantity: -5,
      referenceType: 'INVOICE',
      referenceId: 1,
      note: 'Bán hàng - hóa đơn HD-20250220-0001',
      createdAt: `${todayStr} 09:15:00`,
    },
  ];

  const sampleActivityLogs: ActivityLog[] = [
    {
      id: 1,
      userId: 1,
      username: 'admin',
      userRole: 'ADMIN',
      employeeName: 'Nguyễn Văn Quản Trị',
      action: 'SYSTEM_RESET',
      actionTitle: 'Khởi tạo hệ thống',
      targetType: 'SYSTEM',
      targetId: 'SYS-INIT',
      targetName: 'Hệ thống Quản lý Bán hàng',
      details: 'Khởi tạo cơ sở dữ liệu và cấu hình danh mục sản phẩm ban đầu',
      severity: 'INFO',
      ipAddress: '192.168.1.1',
      createdAt: '2025-01-01 08:00:00',
    },
    {
      id: 2,
      userId: 2,
      username: 'manager',
      userRole: 'MANAGER',
      employeeName: 'Trần Thị Quản Lý',
      action: 'PURCHASE_CONFIRM',
      actionTitle: 'Xác nhận nhập hàng',
      targetType: 'INVENTORY',
      targetId: 'PN-20250210-0001',
      targetName: 'Công ty TNHH Phân Phối Đồ Uống Sài Gòn',
      details: 'Nhập kho 100 sản phẩm Nước khoáng Lavie 500ml (Tổng giá trị: 1,500,000 đ)',
      metadata: { purchaseCode: 'PN-20250210-0001', totalCost: 1500000, supplierId: 1 },
      severity: 'INFO',
      ipAddress: '192.168.1.15',
      createdAt: `${todayStr} 08:00:00`,
    },
    {
      id: 3,
      userId: 2,
      username: 'manager',
      userRole: 'MANAGER',
      employeeName: 'Trần Thị Quản Lý',
      action: 'STOCK_ADJUSTMENT',
      actionTitle: 'Điều chỉnh số lượng tồn kho',
      targetType: 'PRODUCT',
      targetId: 1,
      targetName: 'Nước khoáng Lavie 500ml',
      details: 'Điều chỉnh số lượng tồn từ 105 chai thành 95 chai (Chênh lệch: -10)',
      metadata: { productId: 1, oldStock: 105, newStock: 95, diff: -10, reason: 'Kiểm kê định kỳ & hư hại bao bì' },
      severity: 'WARNING',
      ipAddress: '192.168.1.15',
      createdAt: `${todayStr} 08:30:00`,
    },
    {
      id: 4,
      userId: 1,
      username: 'admin',
      userRole: 'ADMIN',
      employeeName: 'Nguyễn Văn Quản Trị',
      action: 'REPORT_EXPORT',
      actionTitle: 'Xuất báo cáo tài chính',
      targetType: 'FINANCE',
      targetId: 'FIN-EXPORT',
      targetName: 'Báo cáo doanh thu & lợi nhuận CSV',
      details: 'Xuất file CSV tổng hợp doanh thu, giá vốn và tỷ suất lợi nhuận kỳ 30 ngày',
      metadata: { period: '30DAYS', format: 'CSV' },
      severity: 'INFO',
      ipAddress: '192.168.1.1',
      createdAt: `${todayStr} 09:00:00`,
    },
    {
      id: 5,
      userId: 1,
      username: 'admin',
      userRole: 'ADMIN',
      employeeName: 'Nguyễn Văn Quản Trị',
      action: 'PRODUCT_DELETE',
      actionTitle: 'Vô hiệu hóa sản phẩm',
      targetType: 'PRODUCT',
      targetId: 10,
      targetName: 'Bánh gạo One One Vị Ngọt Dịu 150g',
      details: 'Chuyển trạng thái sản phẩm sang INACTIVE (Ngừng bán)',
      metadata: { productId: 10, previousStatus: 'ACTIVE', newStatus: 'INACTIVE', reason: 'Nhà sản xuất ngừng phân phối' },
      severity: 'CRITICAL',
      ipAddress: '192.168.1.1',
      createdAt: `${todayStr} 09:45:00`,
    },
    {
      id: 6,
      userId: 3,
      username: 'cashier',
      userRole: 'EMPLOYEE',
      employeeName: 'Lê Hoàng Thu Ngân',
      action: 'USER_LOGIN',
      actionTitle: 'Đăng nhập hệ thống',
      targetType: 'USER',
      targetId: 3,
      targetName: 'cashier',
      details: 'Đăng nhập ca làm việc thu ngân buổi sáng',
      severity: 'INFO',
      ipAddress: '192.168.1.20',
      createdAt: `${todayStr} 07:45:00`,
    },
  ];

  const sampleLoyaltyTransactions: LoyaltyTransaction[] = [
    {
      id: 1,
      customerId: 2,
      customerName: 'Phạm Thị Mai',
      type: 'EARN',
      points: 120,
      balanceAfter: 120,
      note: 'Tích điểm đơn hàng mua sắm đầu năm',
      createdAt: '2025-01-20 14:30:00',
    },
    {
      id: 2,
      customerId: 2,
      customerName: 'Phạm Thị Mai',
      type: 'EARN',
      points: 50,
      balanceAfter: 170,
      note: 'Tích điểm đơn hàng đồ uống và bánh kẹo',
      createdAt: '2025-02-10 16:00:00',
    },
    {
      id: 3,
      customerId: 2,
      customerName: 'Phạm Thị Mai',
      type: 'REDEEM',
      points: -50,
      balanceAfter: 120,
      note: 'Đổi 50 điểm giảm 5.000đ khi thanh toán',
      createdAt: '2025-02-14 11:20:00',
    },
    {
      id: 4,
      customerId: 1,
      customerName: 'Hoàng Anh Dũng',
      type: 'EARN',
      points: 45,
      balanceAfter: 45,
      note: 'Tích điểm đơn hàng tạp hóa & nước ngọt',
      createdAt: '2025-01-15 10:30:00',
    },
    {
      id: 5,
      customerId: 3,
      customerName: 'Vũ Đức Minh',
      type: 'EARN',
      points: 15,
      balanceAfter: 15,
      note: 'Tích điểm đơn hàng gia dụng',
      createdAt: '2025-02-01 11:45:00',
    },
  ];

  return {
    users,
    employees,
    categories,
    products,
    customers,
    suppliers,
    invoices: sampleInvoices,
    invoiceDetails: sampleInvoiceDetails,
    purchases: samplePurchases,
    purchaseDetails: samplePurchaseDetails,
    stockTransactions,
    promotions,
    loyaltyTransactions: sampleLoyaltyTransactions,
    activityLogs: sampleActivityLogs,
  };
};

class DBManager {
  private state: DBState;

  constructor() {
    this.state = this.load();
  }

  private load(): DBState {
    try {
      const serialized = localStorage.getItem(DB_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        if (!parsed.activityLogs) {
          parsed.activityLogs = getInitialSeedData().activityLogs;
        }
        if (!parsed.loyaltyTransactions) {
          parsed.loyaltyTransactions = getInitialSeedData().loyaltyTransactions;
        }
        if (parsed.customers && parsed.customers.length > 0 && parsed.customers[0].tier === undefined) {
          parsed.customers = parsed.customers.map((c: Customer) => ({
            ...c,
            tier: calculateCustomerTier(c.loyaltyPoints || 0),
            totalEarnedPoints: c.totalEarnedPoints ?? c.loyaltyPoints ?? 0,
            totalRedeemedPoints: c.totalRedeemedPoints ?? 0,
          }));
        }
        if (!parsed.invoices || parsed.invoices.length <= 2) {
          const fresh = getInitialSeedData();
          parsed.invoices = fresh.invoices;
          parsed.invoiceDetails = fresh.invoiceDetails;
          this.save(parsed);
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load database from localStorage, initializing fresh seed', e);
    }
    const fresh = getInitialSeedData();
    this.save(fresh);
    return fresh;
  }

  private save(state: DBState) {
    this.state = state;
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to persist database to localStorage', e);
    }
  }

  public getState(): DBState {
    return { ...this.state };
  }

  public resetToDefault() {
    const fresh = getInitialSeedData();
    this.save(fresh);
    return fresh;
  }

  public restoreFromBackup(backupState: DBState) {
    if (!backupState.users || !backupState.products) {
      throw new Error('Định dạng file sao lưu không hợp lệ.');
    }
    this.save(backupState);
    return this.state;
  }

  // --- USERS & AUTH ---
  public getUsers(): User[] {
    return [...this.state.users];
  }

  public getUserByUsername(username: string): User | undefined {
    return this.state.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
  }

  public createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const exists = this.getUserByUsername(user.username);
    if (exists) throw new Error(`Tên đăng nhập "${user.username}" đã tồn tại.`);

    const id = this.state.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    this.save({
      ...this.state,
      users: [...this.state.users, newUser],
    });
    return newUser;
  }

  public toggleUserStatus(userId: number): User {
    const updatedUsers = this.state.users.map((u) => {
      if (u.id === userId) {
        return { ...u, status: (u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE') as Status };
      }
      return u;
    });
    this.save({ ...this.state, users: updatedUsers });
    return updatedUsers.find((u) => u.id === userId)!;
  }

  public updateUserPassword(userId: number, newHash: string) {
    const updatedUsers = this.state.users.map((u) => {
      if (u.id === userId) {
        return { ...u, passwordHash: newHash };
      }
      return u;
    });
    this.save({ ...this.state, users: updatedUsers });
  }

  // --- EMPLOYEES ---
  public getEmployees(): Employee[] {
    return [...this.state.employees];
  }

  public createEmployee(emp: Omit<Employee, 'id' | 'createdAt'>): Employee {
    const id = this.state.employees.reduce((max, e) => Math.max(max, e.id), 0) + 1;
    const newEmp: Employee = {
      ...emp,
      id,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    this.save({
      ...this.state,
      employees: [...this.state.employees, newEmp],
    });
    return newEmp;
  }

  public updateEmployee(emp: Employee): Employee {
    const updated = this.state.employees.map((e) => (e.id === emp.id ? emp : e));
    this.save({ ...this.state, employees: updated });
    return emp;
  }

  public deactivateEmployee(id: number) {
    const updated = this.state.employees.map((e) =>
      e.id === id ? { ...e, status: 'INACTIVE' as Status } : e
    );
    this.save({ ...this.state, employees: updated });
  }

  // --- CATEGORIES ---
  public getCategories(): Category[] {
    return [...this.state.categories];
  }

  public createCategory(cat: Omit<Category, 'id'>): Category {
    const id = this.state.categories.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const newCat: Category = { ...cat, id };
    this.save({
      ...this.state,
      categories: [...this.state.categories, newCat],
    });
    return newCat;
  }

  public updateCategory(cat: Category): Category {
    const updated = this.state.categories.map((c) => (c.id === cat.id ? cat : c));
    this.save({ ...this.state, categories: updated });
    return cat;
  }

  public deactivateCategory(id: number) {
    const updated = this.state.categories.map((c) =>
      c.id === id ? { ...c, status: 'INACTIVE' as Status } : c
    );
    this.save({ ...this.state, categories: updated });
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    const catMap = new Map(this.state.categories.map((c) => [c.id, c.name]));
    return this.state.products.map((p) => ({
      ...p,
      categoryName: p.categoryId ? catMap.get(p.categoryId) || 'Khác' : 'Chưa phân loại',
    }));
  }

  public createProduct(prod: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    if (prod.barcode) {
      const exists = this.state.products.find((p) => p.barcode === prod.barcode);
      if (exists) throw new Error(`Mã vạch "${prod.barcode}" đã tồn tại cho sản phẩm khác.`);
    }
    const id = this.state.products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newProd: Product = {
      ...prod,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.save({
      ...this.state,
      products: [...this.state.products, newProd],
    });
    return newProd;
  }

  public updateProduct(prod: Product): Product {
    if (prod.barcode) {
      const exists = this.state.products.find((p) => p.barcode === prod.barcode && p.id !== prod.id);
      if (exists) throw new Error(`Mã vạch "${prod.barcode}" đã tồn tại cho sản phẩm khác.`);
    }
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated = this.state.products.map((p) =>
      p.id === prod.id ? { ...prod, updatedAt: now } : p
    );
    this.save({ ...this.state, products: updated });
    return prod;
  }

  public deactivateProduct(id: number) {
    const updated = this.state.products.map((p) =>
      p.id === id ? { ...p, status: 'INACTIVE' as Status } : p
    );
    this.save({ ...this.state, products: updated });
  }

  public adjustProductStock(
    productId: number,
    newQuantity: number,
    employeeId: number | null,
    employeeName: string,
    reason: string
  ) {
    const product = this.state.products.find((p) => p.id === productId);
    if (!product) throw new Error('Không tìm thấy sản phẩm');

    const diff = newQuantity - product.stockQuantity;
    if (diff === 0) return product;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updatedProducts = this.state.products.map((p) =>
      p.id === productId ? { ...p, stockQuantity: newQuantity, updatedAt: now } : p
    );

    const txId = this.state.stockTransactions.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const newTx: StockTransaction = {
      id: txId,
      productId,
      productName: product.name,
      employeeId,
      employeeName,
      type: 'ADJUSTMENT',
      quantity: diff,
      note: reason || 'Điều chỉnh tồn kho thủ công',
      createdAt: now,
    };

    this.save({
      ...this.state,
      products: updatedProducts,
      stockTransactions: [newTx, ...this.state.stockTransactions],
    });

    return updatedProducts.find((p) => p.id === productId)!;
  }

  // --- CUSTOMERS & LOYALTY ---
  public getCustomers(): Customer[] {
    return this.state.customers.map((c) => ({
      ...c,
      tier: c.tier || calculateCustomerTier(c.loyaltyPoints || 0),
      totalEarnedPoints: c.totalEarnedPoints ?? c.loyaltyPoints ?? 0,
      totalRedeemedPoints: c.totalRedeemedPoints ?? 0,
    }));
  }

  public getLoyaltyTransactions(customerId?: number): LoyaltyTransaction[] {
    const list = this.state.loyaltyTransactions || [];
    if (customerId) {
      return list
        .filter((tx) => tx.customerId === customerId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createCustomer(
    cust: Omit<Customer, 'id' | 'loyaltyPoints' | 'tier' | 'totalEarnedPoints' | 'totalRedeemedPoints' | 'createdAt'>
  ): Customer {
    const id = this.state.customers.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newCust: Customer = {
      ...cust,
      id,
      loyaltyPoints: 0,
      tier: 'BRONZE',
      totalEarnedPoints: 0,
      totalRedeemedPoints: 0,
      createdAt: now,
    };
    this.save({
      ...this.state,
      customers: [...this.state.customers, newCust],
    });
    return newCust;
  }

  public updateCustomer(cust: Customer): Customer {
    const tier = calculateCustomerTier(cust.loyaltyPoints || 0);
    const updatedCust = { ...cust, tier };
    const updated = this.state.customers.map((c) => (c.id === cust.id ? updatedCust : c));
    this.save({ ...this.state, customers: updated });
    return updatedCust;
  }

  public adjustCustomerPoints(params: {
    customerId: number;
    pointsDelta: number;
    note: string;
    employeeId?: number;
    employeeName?: string;
  }): { customer: Customer; transaction: LoyaltyTransaction } {
    const { customerId, pointsDelta, note, employeeId, employeeName } = params;
    const targetCust = this.state.customers.find((c) => c.id === customerId);
    if (!targetCust) {
      throw new Error(`Không tìm thấy khách hàng có ID ${customerId}`);
    }

    const currentPoints = targetCust.loyaltyPoints || 0;
    const newPoints = currentPoints + pointsDelta;
    if (newPoints < 0) {
      throw new Error(`Điểm tích lũy không thể âm. Điểm hiện tại: ${currentPoints}, giảm: ${Math.abs(pointsDelta)}`);
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newTier = calculateCustomerTier(newPoints);
    const totalEarned = pointsDelta > 0 ? (targetCust.totalEarnedPoints || currentPoints) + pointsDelta : (targetCust.totalEarnedPoints || currentPoints);
    const totalRedeemed = pointsDelta < 0 ? (targetCust.totalRedeemedPoints || 0) + Math.abs(pointsDelta) : (targetCust.totalRedeemedPoints || 0);

    const updatedCustomer: Customer = {
      ...targetCust,
      loyaltyPoints: newPoints,
      tier: newTier,
      totalEarnedPoints: totalEarned,
      totalRedeemedPoints: totalRedeemed,
    };

    const txId = (this.state.loyaltyTransactions || []).reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const newTransaction: LoyaltyTransaction = {
      id: txId,
      customerId,
      customerName: targetCust.name,
      type: 'ADJUSTMENT',
      points: pointsDelta,
      balanceAfter: newPoints,
      note: note || 'Điều chỉnh điểm thủ công bởi nhân viên',
      createdAt: now,
    };

    const updatedCustomers = this.state.customers.map((c) => (c.id === customerId ? updatedCustomer : c));
    const updatedTransactions = [newTransaction, ...(this.state.loyaltyTransactions || [])];

    // Log Activity
    const existingLogs = this.state.activityLogs || [];
    const logId = existingLogs.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    const newLog: ActivityLog = {
      id: logId,
      userId: employeeId || 1,
      username: employeeName || 'Nhân viên',
      userRole: 'EMPLOYEE',
      employeeName: employeeName || 'Nhân viên quản lý',
      action: 'CUSTOMER_POINTS_ADJUST',
      actionTitle: 'Điều chỉnh điểm tích lũy',
      targetType: 'CUSTOMER',
      targetId: customerId,
      targetName: targetCust.name,
      details: `${pointsDelta > 0 ? 'Cộng' : 'Trừ'} ${Math.abs(pointsDelta)} điểm cho khách hàng ${targetCust.name}. Điểm mới: ${newPoints} (${newTier}). Lý do: ${note}`,
      severity: 'INFO',
      createdAt: now,
    };

    this.save({
      ...this.state,
      customers: updatedCustomers,
      loyaltyTransactions: updatedTransactions,
      activityLogs: [newLog, ...existingLogs],
    });

    return { customer: updatedCustomer, transaction: newTransaction };
  }

  // --- SUPPLIERS ---
  public getSuppliers(): Supplier[] {
    return [...this.state.suppliers];
  }

  public createSupplier(sup: Omit<Supplier, 'id'>): Supplier {
    const id = this.state.suppliers.reduce((max, s) => Math.max(max, s.id), 0) + 1;
    const newSup: Supplier = { ...sup, id };
    this.save({
      ...this.state,
      suppliers: [...this.state.suppliers, newSup],
    });
    return newSup;
  }

  public updateSupplier(sup: Supplier): Supplier {
    const updated = this.state.suppliers.map((s) => (s.id === sup.id ? sup : s));
    this.save({ ...this.state, suppliers: updated });
    return sup;
  }

  public deactivateSupplier(id: number) {
    const updated = this.state.suppliers.map((s) =>
      s.id === id ? { ...s, status: 'INACTIVE' as Status } : s
    );
    this.save({ ...this.state, suppliers: updated });
  }

  // --- PROMOTIONS ---
  public getPromotions(): Promotion[] {
    return [...this.state.promotions];
  }

  public createPromotion(promo: Omit<Promotion, 'id'>): Promotion {
    const id = this.state.promotions.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const newPromo: Promotion = { ...promo, id };
    this.save({
      ...this.state,
      promotions: [...this.state.promotions, newPromo],
    });
    return newPromo;
  }

  public updatePromotion(promo: Promotion): Promotion {
    const updated = this.state.promotions.map((p) => (p.id === promo.id ? promo : p));
    this.save({ ...this.state, promotions: updated });
    return promo;
  }

  public deactivatePromotion(id: number) {
    const updated = this.state.promotions.map((p) =>
      p.id === id ? { ...p, status: 'INACTIVE' as Status } : p
    );
    this.save({ ...this.state, promotions: updated });
  }

  // --- CHECKOUT & POS (Transaction-safe) ---
  public checkoutInvoice(params: {
    employeeId: number;
    employeeName: string;
    customerId: number | null;
    items: { product: Product; quantity: number; unitPrice: number; discount: number }[];
    discount: number;
    pointsRedeemed?: number;
    paymentMethod: PaymentMethod;
  }): Invoice {
    const { employeeId, employeeName, customerId, items, discount, pointsRedeemed = 0, paymentMethod } = params;

    if (!items || items.length === 0) {
      throw new Error('Giỏ hàng đang trống.');
    }

    // Check stock for all items
    for (const item of items) {
      const currentProduct = this.state.products.find((p) => p.id === item.product.id);
      if (!currentProduct) {
        throw new Error(`Sản phẩm "${item.product.name}" không tồn tại trong hệ thống.`);
      }
      if (currentProduct.stockQuantity < item.quantity) {
        throw new Error(
          `Không đủ tồn kho cho "${currentProduct.name}". Tồn hiện tại: ${currentProduct.stockQuantity}, yêu cầu: ${item.quantity}`
        );
      }
    }

    const now = new Date();
    const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceNum = String(this.state.invoices.length + 1).padStart(4, '0');
    const invoiceCode = `HD-${dateCode}-${invoiceNum}`;
    const invoiceId = this.state.invoices.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const nowFormatted = now.toISOString().replace('T', ' ').slice(0, 19);

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const pointsDiscount = Math.max(0, pointsRedeemed * LOYALTY_CONFIG.VND_PER_POINT_REDEEM);
    const totalDiscount = discount + pointsDiscount;
    const total = Math.max(0, subtotal - totalDiscount);

    let customerName = 'Khách vãng lai';
    let updatedCustomers = [...this.state.customers];
    let newLoyaltyTransactions: LoyaltyTransaction[] = [];
    let startLoyaltyTxId = (this.state.loyaltyTransactions || []).reduce((max, t) => Math.max(max, t.id), 0) + 1;
    let earnedPoints = 0;

    if (customerId) {
      const cust = this.state.customers.find((c) => c.id === customerId);
      if (cust) {
        customerName = cust.name;
        const currentPoints = cust.loyaltyPoints || 0;

        if (pointsRedeemed > currentPoints) {
          throw new Error(`Khách hàng chỉ có ${currentPoints} điểm, không thể đổi ${pointsRedeemed} điểm.`);
        }

        let postRedeemBalance = currentPoints;
        if (pointsRedeemed > 0) {
          postRedeemBalance -= pointsRedeemed;
          newLoyaltyTransactions.push({
            id: startLoyaltyTxId++,
            customerId: cust.id,
            customerName: cust.name,
            type: 'REDEEM',
            points: -pointsRedeemed,
            balanceAfter: postRedeemBalance,
            invoiceId,
            invoiceCode,
            note: `Đổi ${pointsRedeemed} điểm giảm ${pointsDiscount.toLocaleString('vi-VN')}đ cho đơn ${invoiceCode}`,
            createdAt: nowFormatted,
          });
        }

        // Calculate earned points with customer tier multiplier
        const currentTier = cust.tier || calculateCustomerTier(currentPoints);
        const tierMultiplier = getTierMultiplier(currentTier);
        earnedPoints = Math.floor((total / 10000) * tierMultiplier);

        const finalBalance = postRedeemBalance + earnedPoints;
        const finalTier = calculateCustomerTier(finalBalance);

        if (earnedPoints > 0) {
          newLoyaltyTransactions.push({
            id: startLoyaltyTxId++,
            customerId: cust.id,
            customerName: cust.name,
            type: 'EARN',
            points: earnedPoints,
            balanceAfter: finalBalance,
            invoiceId,
            invoiceCode,
            note: `Tích ${earnedPoints} điểm từ đơn hàng ${invoiceCode} (Hạng ${currentTier} x${tierMultiplier})`,
            createdAt: nowFormatted,
          });
        }

        const updatedCustomerRecord: Customer = {
          ...cust,
          loyaltyPoints: finalBalance,
          tier: finalTier,
          totalEarnedPoints: (cust.totalEarnedPoints || currentPoints) + earnedPoints,
          totalRedeemedPoints: (cust.totalRedeemedPoints || 0) + pointsRedeemed,
        };

        updatedCustomers = this.state.customers.map((c) => (c.id === customerId ? updatedCustomerRecord : c));
      }
    }

    const createdDetails: InvoiceDetail[] = [];
    let startDetailId = this.state.invoiceDetails.reduce((max, d) => Math.max(max, d.id), 0) + 1;
    let startTxId = this.state.stockTransactions.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const newStockTransactions: StockTransaction[] = [];

    // Deduct stock and record transactions
    const updatedProducts = this.state.products.map((prod) => {
      const cartMatch = items.find((it) => it.product.id === prod.id);
      if (cartMatch) {
        const detailSubtotal = cartMatch.quantity * cartMatch.unitPrice - cartMatch.discount;
        createdDetails.push({
          id: startDetailId++,
          invoiceId,
          productId: prod.id,
          productName: prod.name,
          barcode: prod.barcode,
          quantity: cartMatch.quantity,
          unitPrice: cartMatch.unitPrice,
          discount: cartMatch.discount,
          subtotal: detailSubtotal,
        });

        newStockTransactions.push({
          id: startTxId++,
          productId: prod.id,
          productName: prod.name,
          employeeId,
          employeeName,
          type: 'SALE',
          quantity: -cartMatch.quantity,
          referenceType: 'INVOICE',
          referenceId: invoiceId,
          note: `Bán hàng - hóa đơn ${invoiceCode}`,
          createdAt: nowFormatted,
        });

        return {
          ...prod,
          stockQuantity: prod.stockQuantity - cartMatch.quantity,
          updatedAt: nowFormatted,
        };
      }
      return prod;
    });

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceCode,
      employeeId,
      employeeName,
      customerId,
      customerName,
      subtotal,
      discount: totalDiscount,
      pointsEarned: earnedPoints > 0 ? earnedPoints : undefined,
      pointsRedeemed: pointsRedeemed > 0 ? pointsRedeemed : undefined,
      pointsDiscount: pointsDiscount > 0 ? pointsDiscount : undefined,
      total,
      paymentMethod,
      status: 'PAID',
      createdAt: nowFormatted,
      items: createdDetails,
    };

    // Log Activity
    const existingLogs = this.state.activityLogs || [];
    const logId = existingLogs.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    const newLog: ActivityLog = {
      id: logId,
      userId: employeeId,
      username: employeeName,
      userRole: 'EMPLOYEE',
      employeeName,
      action: 'INVOICE_CHECKOUT',
      actionTitle: 'Thanh toán hóa đơn POS',
      targetType: 'INVOICE',
      targetId: invoiceId,
      targetName: invoiceCode,
      details: `Hóa đơn ${invoiceCode} - Khách: ${customerName} - Tổng tiền: ${total.toLocaleString('vi-VN')}đ (${paymentMethod})${
        pointsRedeemed > 0 ? ` [Đổi: ${pointsRedeemed}đ]` : ''
      }${earnedPoints > 0 ? ` [Tích: +${earnedPoints}đ]` : ''}`,
      severity: 'INFO',
      createdAt: nowFormatted,
    };

    this.save({
      ...this.state,
      customers: updatedCustomers,
      products: updatedProducts,
      invoices: [newInvoice, ...this.state.invoices],
      invoiceDetails: [...this.state.invoiceDetails, ...createdDetails],
      stockTransactions: [...newStockTransactions, ...this.state.stockTransactions],
      loyaltyTransactions: [...newLoyaltyTransactions, ...(this.state.loyaltyTransactions || [])],
      activityLogs: [newLog, ...existingLogs],
    });

    return newInvoice;
  }

  // --- PURCHASE / NHẬP HÀNG (Transaction-safe) ---
  public confirmPurchase(params: {
    supplierId: number;
    employeeId: number;
    employeeName: string;
    items: { product: Product; quantity: number; unitCost: number }[];
  }): Purchase {
    const { supplierId, employeeId, employeeName, items } = params;

    if (!items || items.length === 0) {
      throw new Error('Danh sách hàng nhập đang trống.');
    }

    const supplier = this.state.suppliers.find((s) => s.id === supplierId);
    if (!supplier) throw new Error('Vui lòng chọn nhà cung cấp hợp lệ.');

    const now = new Date();
    const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');
    const purchaseNum = String(this.state.purchases.length + 1).padStart(4, '0');
    const purchaseCode = `PN-${dateCode}-${purchaseNum}`;
    const purchaseId = this.state.purchases.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const nowFormatted = now.toISOString().replace('T', ' ').slice(0, 19);

    const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    const createdDetails: PurchaseDetail[] = [];
    let startDetailId = this.state.purchaseDetails.reduce((max, d) => Math.max(max, d.id), 0) + 1;
    let startTxId = this.state.stockTransactions.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const newStockTransactions: StockTransaction[] = [];

    // Increase stock and update cost price
    const updatedProducts = this.state.products.map((prod) => {
      const match = items.find((it) => it.product.id === prod.id);
      if (match) {
        const subtotal = match.quantity * match.unitCost;
        createdDetails.push({
          id: startDetailId++,
          purchaseId,
          productId: prod.id,
          productName: prod.name,
          quantity: match.quantity,
          unitCost: match.unitCost,
          subtotal,
        });

        newStockTransactions.push({
          id: startTxId++,
          productId: prod.id,
          productName: prod.name,
          employeeId,
          employeeName,
          type: 'PURCHASE',
          quantity: match.quantity,
          referenceType: 'PURCHASE',
          referenceId: purchaseId,
          note: `Nhập hàng theo phiếu ${purchaseCode}`,
          createdAt: nowFormatted,
        });

        return {
          ...prod,
          costPrice: match.unitCost,
          stockQuantity: prod.stockQuantity + match.quantity,
          updatedAt: nowFormatted,
        };
      }
      return prod;
    });

    const newPurchase: Purchase = {
      id: purchaseId,
      purchaseCode,
      supplierId,
      supplierName: supplier.name,
      employeeId,
      employeeName,
      totalCost,
      status: 'COMPLETED',
      createdAt: nowFormatted,
      items: createdDetails,
    };

    this.save({
      ...this.state,
      products: updatedProducts,
      purchases: [newPurchase, ...this.state.purchases],
      purchaseDetails: [...this.state.purchaseDetails, ...createdDetails],
      stockTransactions: [...newStockTransactions, ...this.state.stockTransactions],
    });

    return newPurchase;
  }

  // --- INVOICES & PURCHASES QUERIES ---
  public getInvoices(): Invoice[] {
    const detailsByInvoice = new Map<number, InvoiceDetail[]>();
    for (const d of this.state.invoiceDetails) {
      if (!detailsByInvoice.has(d.invoiceId)) detailsByInvoice.set(d.invoiceId, []);
      detailsByInvoice.get(d.invoiceId)!.push(d);
    }

    return this.state.invoices.map((inv) => ({
      ...inv,
      items: detailsByInvoice.get(inv.id) || [],
    }));
  }

  public getInvoiceById(id: number): Invoice | undefined {
    const inv = this.state.invoices.find((i) => i.id === id);
    if (!inv) return undefined;
    const items = this.state.invoiceDetails.filter((d) => d.invoiceId === id);
    return { ...inv, items };
  }

  public getPurchases(): Purchase[] {
    const detailsByPurchase = new Map<number, PurchaseDetail[]>();
    for (const d of this.state.purchaseDetails) {
      if (!detailsByPurchase.has(d.purchaseId)) detailsByPurchase.set(d.purchaseId, []);
      detailsByPurchase.get(d.purchaseId)!.push(d);
    }
    return this.state.purchases.map((p) => ({
      ...p,
      items: detailsByPurchase.get(p.id) || [],
    }));
  }

  public getStockTransactions(): StockTransaction[] {
    return [...this.state.stockTransactions];
  }

  // --- ACTIVITY LOGS & AUDIT TRAIL ---
  public getActivityLogs(): ActivityLog[] {
    return [...(this.state.activityLogs || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public logActivity(log: Omit<ActivityLog, 'id' | 'createdAt'>): ActivityLog {
    const existingLogs = this.state.activityLogs || [];
    const id = existingLogs.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newLog: ActivityLog = {
      ...log,
      id,
      createdAt: now,
    };

    // Keep up to 2,000 most recent logs in localStorage to ensure snappy performance
    const updatedLogs = [newLog, ...existingLogs].slice(0, 2000);
    this.save({
      ...this.state,
      activityLogs: updatedLogs,
    });

    return newLog;
  }

  public clearActivityLogs(currentUser?: { username: string; roleName: Role; employeeName?: string }) {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const purgeAuditLog: ActivityLog = {
      id: 1,
      username: currentUser?.username || 'admin',
      userRole: currentUser?.roleName || 'ADMIN',
      employeeName: currentUser?.employeeName || 'Quản trị viên',
      action: 'LOGS_CLEARED',
      actionTitle: 'Dọn dẹp nhật ký hoạt động',
      targetType: 'SYSTEM',
      targetId: 'AUDIT-PURGE',
      targetName: 'Hệ thống Audit Log',
      details: 'Quản trị viên đã thực hiện dọn dẹp lịch sử nhật ký hoạt động cũ.',
      severity: 'WARNING',
      createdAt: now,
    };

    this.save({
      ...this.state,
      activityLogs: [purgeAuditLog],
    });
  }
}

export const db = new DBManager();
