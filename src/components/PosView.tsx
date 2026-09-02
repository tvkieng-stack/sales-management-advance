import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, LOYALTY_CONFIG, getTierInfo } from '../lib/db';
import { CartItem, Customer, PaymentMethod, PosTab, Product, Promotion, Invoice } from '../types';
import { useAuth } from '../context/AuthContext';
import { InvoicePrintModal } from './InvoicePrintModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { playScanSound, isSoundEnabled, setSoundEnabled } from '../lib/sound';
import {
  Search,
  Plus,
  Trash2,
  ShoppingCart,
  User,
  Tag,
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Package,
  ScanLine,
  Volume2,
  VolumeX,
  Zap,
  Printer,
  Award,
  Sparkles,
  Gift,
  Coins,
  ShieldCheck,
} from 'lucide-react';

export const PosView: React.FC = () => {
  const { currentUser } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerSelectRef = useRef<HTMLSelectElement>(null);
  const promoSelectRef = useRef<HTMLSelectElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);

  // Products and helpers
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');

  // Barcode Scanner & Sound State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [scanToast, setScanToast] = useState<{
    text: string;
    productName: string;
    barcode?: string;
    sellingPrice: number;
    timestamp: number;
  } | null>(null);

  // Buffer for fast hardware HID barcode scanners
  const barcodeBufferRef = useRef<string>('');
  const lastCharTimeRef = useRef<number>(0);

  // Multi-tab Orders State
  const [tabs, setTabs] = useState<PosTab[]>([
    {
      id: 'tab-1',
      title: 'Đơn 1',
      cart: [],
      customerId: null,
      promotionId: null,
      customDiscount: 0,
      paymentMethod: 'CASH',
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [tabCounter, setTabCounter] = useState(1);

  // Receipt Modal State (Supports both completed invoices and active transaction drafts)
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [printModalInvoice, setPrintModalInvoice] = useState<Invoice | null>(null);
  const [isPrintDraft, setIsPrintDraft] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  // Reload base catalog
  const reloadData = () => {
    setProducts(db.getProducts().filter((p) => p.status === 'ACTIVE'));
    setCategories(db.getCategories().filter((c) => c.status === 'ACTIVE'));
    setCustomers(db.getCustomers());

    const todayStr = new Date().toISOString().split('T')[0];
    setPromotions(
      db.getPromotions().filter((p) => p.status === 'ACTIVE' && p.startDate <= todayStr && p.endDate >= todayStr)
    );
  };

  useEffect(() => {
    reloadData();
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const updateActiveTab = (updates: Partial<PosTab>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, ...updates } : t))
    );
  };

  // Cart operations
  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCheckoutMessage(null);
    const currentCart = activeTab.cart;
    const existingIndex = currentCart.findIndex((it) => it.product.id === product.id);

    if (existingIndex > -1) {
      const existing = currentCart[existingIndex];
      const newQty = existing.quantity + quantity;
      if (newQty > product.stockQuantity) {
        setCheckoutMessage({
          type: 'error',
          text: `Không đủ tồn kho cho "${product.name}". Tồn kho hiện tại: ${product.stockQuantity}`,
        });
        playScanSound('error');
        return false;
      }
      const updatedCart = [...currentCart];
      updatedCart[existingIndex] = {
        ...existing,
        quantity: newQty,
        subtotal: newQty * existing.unitPrice - existing.discount,
      };
      updateActiveTab({ cart: updatedCart });
    } else {
      if (quantity > product.stockQuantity) {
        setCheckoutMessage({
          type: 'error',
          text: `Không đủ tồn kho cho "${product.name}". Tồn kho hiện tại: ${product.stockQuantity}`,
        });
        playScanSound('error');
        return false;
      }
      const newItem: CartItem = {
        product,
        quantity,
        unitPrice: product.sellingPrice,
        discount: 0,
        subtotal: quantity * product.sellingPrice,
      };
      updateActiveTab({ cart: [...currentCart, newItem] });
    }

    return true;
  }, [activeTab, updateActiveTab]);

  // Handle scanned barcode (from hardware scanner, search enter, or camera modal)
  const handleBarcodeScanned = useCallback((scannedCode: string): boolean => {
    const raw = scannedCode.trim();
    if (!raw) return false;

    // Search for product with exact barcode match
    const matched = products.find(
      (p) =>
        p.barcode?.toLowerCase() === raw.toLowerCase() ||
        p.id.toString() === raw ||
        p.name.toLowerCase() === raw.toLowerCase()
    );

    if (matched) {
      if (matched.stockQuantity <= 0) {
        playScanSound('error');
        setCheckoutMessage({
          type: 'error',
          text: `Sản phẩm "${matched.name}" đã hết hàng trong kho.`,
        });
        return false;
      }

      const added = addToCart(matched, 1);
      if (added) {
        playScanSound('success');
        setScanToast({
          text: `Đã thêm vào giỏ: ${matched.name} (+1)`,
          productName: matched.name,
          barcode: matched.barcode,
          sellingPrice: matched.sellingPrice,
          timestamp: Date.now(),
        });
        setSearchQuery('');
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return true;
      }
      return false;
    } else {
      playScanSound('error');
      setCheckoutMessage({
        type: 'error',
        text: `Không tìm thấy sản phẩm có mã vạch: "${raw}"`,
      });
      return false;
    }
  }, [products, addToCart]);

  // Auto-dismiss scan toast after 2.5s
  useEffect(() => {
    if (scanToast) {
      const timer = setTimeout(() => {
        setScanToast(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [scanToast]);

  // Calculations
  const subtotal = activeTab.cart.reduce((sum, it) => sum + it.subtotal, 0);

  let promotionDiscount = 0;
  if (activeTab.promotionId) {
    const promo = promotions.find((p) => p.id === activeTab.promotionId);
    if (promo) {
      if (promo.discountType === 'PERCENTAGE') {
        promotionDiscount = (subtotal * promo.discountValue) / 100;
      } else {
        promotionDiscount = promo.discountValue;
      }
    }
  }

  const selectedCustomer = customers.find((c) => c.id === activeTab.customerId);
  const customerPoints = selectedCustomer?.loyaltyPoints || 0;
  const pointsRedeemed = Math.min(customerPoints, activeTab.redeemPoints || 0);
  const pointsDiscount = pointsRedeemed * LOYALTY_CONFIG.VND_PER_POINT_REDEEM;

  const totalDiscount = promotionDiscount + (Number(activeTab.customDiscount) || 0) + pointsDiscount;
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  const customerTierInfo = selectedCustomer ? getTierInfo(selectedCustomer.loyaltyPoints) : null;
  const projectedEarnPoints = selectedCustomer
    ? Math.floor((grandTotal / 10000) * (customerTierInfo?.multiplier || 1.0))
    : 0;

  // Handle Checkout
  const handleCheckout = useCallback(() => {
    if (activeTab.cart.length === 0) {
      setCheckoutMessage({ type: 'error', text: 'Giỏ hàng đang trống.' });
      playScanSound('error');
      return;
    }

    try {
      const invoice = db.checkoutInvoice({
        employeeId: currentUser?.employeeId || 1,
        employeeName: currentUser?.employeeName || currentUser?.username || 'Nhân viên',
        customerId: activeTab.customerId,
        items: activeTab.cart,
        discount: promotionDiscount + (Number(activeTab.customDiscount) || 0),
        pointsRedeemed: pointsRedeemed > 0 ? pointsRedeemed : undefined,
        paymentMethod: activeTab.paymentMethod,
      });

      playScanSound('success');
      setLastInvoice(invoice);
      setPrintModalInvoice(invoice);
      setIsPrintDraft(false);
      setCheckoutMessage({
        type: 'success',
        text: `Thanh toán thành công! Mã đơn: ${invoice.invoiceCode}${
          pointsRedeemed > 0 ? ` (Đã đổi ${pointsRedeemed} điểm)` : ''
        }${invoice.pointsEarned ? ` (Tích +${invoice.pointsEarned} điểm)` : ''}`,
      });

      // Clear the checked out tab cart and refresh catalog stock
      clearCart();
      reloadData();
    } catch (err: any) {
      playScanSound('error');
      setCheckoutMessage({ type: 'error', text: err.message || 'Lỗi xử lý thanh toán.' });
    }
  }, [activeTab, promotionDiscount, pointsRedeemed, currentUser, reloadData]);

  // Keep a ref to handleCheckout for hotkey handler
  const handleCheckoutRef = useRef(handleCheckout);
  handleCheckoutRef.current = handleCheckout;

  // Dedicated Print Receipt handler for current transaction or last invoice
  const handlePrintReceipt = useCallback(() => {
    if (activeTab.cart.length > 0) {
      // Build a pro-forma / draft invoice for the active transaction
      const customer = customers.find((c) => c.id === activeTab.customerId);
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
        now.getHours()
      )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const draftInvoice: Invoice = {
        id: 0,
        invoiceCode: `DRAFT-${Date.now().toString().slice(-6)}`,
        employeeId: currentUser?.employeeId || 1,
        employeeName: currentUser?.employeeName || currentUser?.username || 'Nhân viên bán hàng',
        customerId: activeTab.customerId,
        customerName: customer ? `${customer.name} - ${customer.phone}` : 'Khách lẻ vãng lai',
        subtotal,
        discount: totalDiscount,
        pointsRedeemed: pointsRedeemed > 0 ? pointsRedeemed : undefined,
        pointsDiscount: pointsDiscount > 0 ? pointsDiscount : undefined,
        pointsEarned: projectedEarnPoints > 0 ? projectedEarnPoints : undefined,
        total: grandTotal,
        paymentMethod: activeTab.paymentMethod,
        status: 'DRAFT',
        createdAt: nowStr,
        items: activeTab.cart.map((it) => ({
          id: it.product.id,
          invoiceId: 0,
          productId: it.product.id,
          productName: it.product.name,
          barcode: it.product.barcode,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discount,
          subtotal: it.subtotal,
        })),
      };

      setPrintModalInvoice(draftInvoice);
      setIsPrintDraft(true);
      playScanSound('beep');
    } else if (lastInvoice) {
      setPrintModalInvoice(lastInvoice);
      setIsPrintDraft(false);
      playScanSound('beep');
    } else {
      setCheckoutMessage({
        type: 'error',
        text: 'Giỏ hàng đang trống. Vui lòng thêm sản phẩm vào giỏ hàng để in phiếu tạm tính.',
      });
      playScanSound('error');
    }
  }, [
    activeTab,
    customers,
    currentUser,
    subtotal,
    totalDiscount,
    pointsRedeemed,
    pointsDiscount,
    projectedEarnPoints,
    grandTotal,
    lastInvoice,
  ]);

  const handlePrintReceiptRef = useRef(handlePrintReceipt);
  handlePrintReceiptRef.current = handlePrintReceipt;

  // Sound toggle helper
  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  // Keyboard Shortcuts (F1: search, F2: Barcode scanner, F4: Customer, F6: Promo, F7: Discount, F8: Payment, F9: Checkout, F10: Print, Ctrl+T: new tab)
  // Plus Global Hardware HID Barcode Scanner Wedge listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isSearchInput = target?.id === 'input-pos-search';
      const isOtherInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT') &&
        !isSearchInput;

      // 1. Function Keys & Global POS shortcuts
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      } else if (e.key === 'F2') {
        e.preventDefault();
        setShowScannerModal((prev) => !prev);
        return;
      } else if (e.key === 'F4') {
        e.preventDefault();
        customerSelectRef.current?.focus();
        return;
      } else if (e.key === 'F6') {
        e.preventDefault();
        promoSelectRef.current?.focus();
        return;
      } else if (e.key === 'F7') {
        e.preventDefault();
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
        return;
      } else if (e.key === 'F8') {
        e.preventDefault();
        // Cycle payment methods: CASH -> BANK_TRANSFER -> CREDIT_CARD
        const methods: PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD'];
        const currentMethod = activeTab.paymentMethod || 'CASH';
        const currentIndex = methods.indexOf(currentMethod);
        const nextMethod = methods[(currentIndex + 1) % methods.length];
        updateActiveTab({ paymentMethod: nextMethod });
        return;
      } else if (e.key === 'F9' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
        e.preventDefault();
        handleCheckoutRef.current();
        return;
      } else if (e.key === 'F10' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        handlePrintReceiptRef.current();
        return;
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleAddTab();
        return;
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        if (tabs.length > 1) {
          e.preventDefault();
          const nextTabs = tabs.filter((t) => t.id !== activeTabId);
          setTabs(nextTabs);
          setActiveTabId(nextTabs[0].id);
        }
        return;
      } else if (e.altKey && e.key === '1') {
        e.preventDefault();
        updateActiveTab({ paymentMethod: 'CASH' });
        return;
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        updateActiveTab({ paymentMethod: 'BANK_TRANSFER' });
        return;
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        updateActiveTab({ paymentMethod: 'CREDIT_CARD' });
        return;
      } else if (e.key === '/' && !isOtherInput && !isSearchInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      } else if (e.key === 'Escape') {
        if (isSearchInput) {
          setSearchQuery('');
          searchInputRef.current?.blur();
        }
        setCheckoutMessage(null);
      }

      // If user is editing another input form (like discount amount, customer select), skip scanner wedge
      if (isOtherInput) {
        return;
      }

      const now = Date.now();
      const elapsed = now - lastCharTimeRef.current;

      if (e.key === 'Enter') {
        const buffered = barcodeBufferRef.current.trim();
        if (buffered.length >= 3) {
          // Hardware scanner completed stream
          e.preventDefault();
          handleBarcodeScanned(buffered);
          barcodeBufferRef.current = '';
          return;
        } else if (isSearchInput && searchQuery.trim()) {
          // User pressed Enter inside search input
          e.preventDefault();
          const query = searchQuery.trim();
          const exactBarcodeMatch = products.find(
            (p) => p.barcode?.toLowerCase() === query.toLowerCase()
          );

          if (exactBarcodeMatch) {
            handleBarcodeScanned(query);
          } else {
            // Check if there is match in search results
            const filtered = products.filter((p) => {
              const q = query.toLowerCase();
              return (
                p.name.toLowerCase().includes(q) ||
                (p.barcode && p.barcode.toLowerCase().includes(q))
              );
            });

            if (filtered.length >= 1) {
              handleBarcodeScanned(filtered[0].barcode || filtered[0].id.toString());
            } else {
              handleBarcodeScanned(query);
            }
          }
        }
        barcodeBufferRef.current = '';
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Hardware barcode scanners send keys very rapidly (< 50-70ms interval)
        if (elapsed > 90 && !isSearchInput) {
          // Fresh sequence started
          barcodeBufferRef.current = e.key;
        } else {
          barcodeBufferRef.current += e.key;
        }
        lastCharTimeRef.current = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBarcodeScanned, searchQuery, products, activeTab, tabs, activeTabId]);

  // Tab operations
  const handleAddTab = () => {
    const nextNum = tabCounter + 1;
    setTabCounter(nextNum);
    const newTab: PosTab = {
      id: `tab-${Date.now()}`,
      title: `Đơn ${nextNum}`,
      cart: [],
      customerId: null,
      promotionId: null,
      customDiscount: 0,
      paymentMethod: 'CASH',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) return; // Keep at least one tab
    const nextTabs = tabs.filter((t) => t.id !== id);
    setTabs(nextTabs);
    if (activeTabId === id) {
      setActiveTabId(nextTabs[0].id);
    }
  };

  const updateQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const currentCart = activeTab.cart;
    const item = currentCart.find((it) => it.product.id === productId);
    if (!item) return;

    if (newQty > item.product.stockQuantity) {
      setCheckoutMessage({
        type: 'error',
        text: `Số lượng vượt quá tồn kho (${item.product.stockQuantity})`,
      });
      playScanSound('error');
      return;
    }

    const updatedCart = currentCart.map((it) =>
      it.product.id === productId
        ? {
            ...it,
            quantity: newQty,
            subtotal: newQty * it.unitPrice - it.discount,
          }
        : it
    );
    updateActiveTab({ cart: updatedCart });
  };

  const removeFromCart = (productId: number) => {
    updateActiveTab({ cart: activeTab.cart.filter((it) => it.product.id !== productId) });
  };

  const clearCart = () => {
    updateActiveTab({ cart: [], customDiscount: 0, promotionId: null });
  };

  // Search filter
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const selectedCustomer = customers.find((c) => c.id === activeTab.customerId);

  return (
    <div className="space-y-4 relative">
      {/* Floating Scan Toast for High-Speed Barcode Scanning */}
      {scanToast && (
        <div className="fixed top-20 right-8 z-40 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3.5 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span>Đã quét mã vạch</span>
              <span className="font-mono text-[10px] text-slate-400">({scanToast.barcode || 'N/A'})</span>
            </div>
            <div className="font-semibold text-slate-100 mt-0.5 truncate max-w-xs">{scanToast.productName}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              +1 vào <span className="text-white font-bold">{activeTab.title}</span> &bull; {formatCurrency(scanToast.sellingPrice)}
            </div>
          </div>
          <button
            onClick={() => setScanToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Orders Tab Bar */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const itemCount = tab.cart.reduce((s, i) => s + i.quantity, 0);
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{tab.title}</span>
                {itemCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {itemCount}
                  </span>
                )}
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className={`p-0.5 rounded-md transition ${
                      isActive
                        ? 'hover:bg-blue-700 text-blue-200'
                        : 'hover:bg-slate-200 text-slate-400'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            id="btn-add-tab"
            onClick={handleAddTab}
            title="Mở thêm hóa đơn mới (Ctrl+T)"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm đơn (Ctrl+T)</span>
          </button>
        </div>

        {/* Scanner & Sound & Hotkey Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Print Receipt Button */}
          <button
            id="btn-pos-quick-print"
            onClick={handlePrintReceipt}
            title="In phiếu tạm tính / Xem trước hóa đơn giao dịch hiện tại (F10 hoặc Ctrl+P)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">In phiếu</span>
            <span className="text-[10px] bg-slate-100 px-1 py-0.2 rounded font-mono border border-slate-200">F10</span>
          </button>

          {/* Barcode Scanner Modal Button */}
          <button
            id="btn-open-scanner"
            onClick={() => setShowScannerModal(true)}
            title="Mở máy quét mã vạch & Camera (F2)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition shadow-2xs cursor-pointer"
          >
            <ScanLine className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Quét mã vạch</span>
            <span className="text-[10px] bg-blue-200/80 px-1 rounded font-mono">F2</span>
          </button>

          {/* Sound Beeper Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Tắt âm thanh bíp máy quét' : 'Bật âm thanh bíp máy quét'}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              soundOn
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Hotkey hints */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">F1: Tìm</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">F9: TT</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">F10: In</span>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {checkoutMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-sm ${
            checkoutMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {checkoutMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="font-medium">{checkoutMessage.text}</span>
          </div>
          <button
            onClick={() => setCheckoutMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main POS Grid: Product Catalog (Left) + Cart & Checkout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Product Catalog (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          {/* Search bar & Barcode Scanner input & Category filters */}
          <div className="space-y-3">
            <div className="relative flex items-center">
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                id="input-pos-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Quét mã vạch hoặc gõ tên sản phẩm, nhấn Enter để thêm (F1)..."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowScannerModal(true)}
                  title="Mở máy quét Camera / Giả lập (F2)"
                  className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Quét</span>
                </button>
              </div>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 text-sm">
                Không tìm thấy sản phẩm phù hợp.
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isOutOfStock = p.stockQuantity <= 0;
                return (
                  <button
                    key={p.id}
                    id={`pos-prod-${p.id}`}
                    disabled={isOutOfStock}
                    onClick={() => {
                      addToCart(p);
                      playScanSound('beep');
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition group relative cursor-pointer ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white hover:bg-blue-50/40 hover:border-blue-300 border-slate-200 active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>{p.unit}</span>
                        <span
                          className={`font-semibold ${
                            p.stockQuantity <= p.minimumStock
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          Tồn: {p.stockQuantity}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                        {p.name}
                      </div>
                      {p.barcode && (
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono flex items-center gap-1">
                          <ScanLine className="w-2.5 h-2.5 text-slate-300" />
                          <span>{p.barcode}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-blue-600">
                        {formatCurrency(p.sellingPrice)}
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 flex items-center justify-center transition">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Cart, Customer & Checkout (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <ShoppingCart className="w-4.5 h-4.5 text-blue-600" />
              <span>Giỏ hàng ({activeTab.title})</span>
            </div>
            {activeTab.cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa hết</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {activeTab.cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <ShoppingCart className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                <span>Chưa có món nào trong giỏ hàng.</span>
                <span className="text-xs text-slate-400">Quét mã vạch hoặc bấm sản phẩm để thêm</span>
              </div>
            ) : (
              activeTab.cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{item.product.name}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                      <span>{formatCurrency(item.unitPrice)} / {item.product.unit}</span>
                      {item.product.barcode && (
                        <span className="font-mono text-[10px] text-slate-400">[{item.product.barcode}]</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity adjustment buttons */}
                  <div className="flex items-center gap-1.5 bg-white px-1.5 py-0.5 rounded-lg border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.product.id, parseInt(e.target.value) || 0)
                      }
                      className="w-8 text-center font-bold text-slate-900 focus:outline-none"
                    />
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="text-right min-w-[70px]">
                    <div className="font-bold text-slate-900">{formatCurrency(item.subtotal)}</div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Customer Selection & Loyalty Section */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Khách hàng thành viên</span>
                  <kbd className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 text-slate-500 rounded text-[10px] font-mono">F4</kbd>
                </span>
                {selectedCustomer && customerTierInfo && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${customerTierInfo.badgeBg}`}>
                    {customerTierInfo.tierName} (x{customerTierInfo.multiplier})
                  </span>
                )}
              </label>
              <select
                ref={customerSelectRef}
                id="select-pos-customer"
                value={activeTab.customerId || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  updateActiveTab({ customerId: val, redeemPoints: 0 });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Khách vãng lai (Không tích điểm)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.phone} ({c.loyaltyPoints} điểm &bull; {c.tier || 'BRONZE'})
                  </option>
                ))}
              </select>
            </div>

            {/* Loyalty Points Redemption Box */}
            {selectedCustomer && customerTierInfo && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Điểm khả dụng: <strong className="text-amber-700 font-mono text-sm">{customerPoints}</strong> điểm</span>
                  </div>
                  <span className="text-[11px] text-amber-700 font-medium font-mono">
                    ≈ {formatCurrency(customerPoints * LOYALTY_CONFIG.VND_PER_POINT_REDEEM)}
                  </span>
                </div>

                {customerPoints > 0 ? (
                  <div className="pt-1.5 border-t border-amber-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-medium flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-amber-600" />
                        <span>Đổi điểm giảm giá:</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          id="input-pos-redeem-points"
                          type="number"
                          min="0"
                          max={customerPoints}
                          value={activeTab.redeemPoints || ''}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(customerPoints, Number(e.target.value) || 0));
                            updateActiveTab({ redeemPoints: val });
                          }}
                          placeholder="0"
                          className="w-20 px-2 py-1 bg-white border border-amber-300 rounded-lg text-right font-bold text-amber-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <span className="text-slate-500 text-[11px]">điểm</span>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {customerPoints >= 50 && (
                        <button
                          type="button"
                          onClick={() => updateActiveTab({ redeemPoints: 50 })}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer ${
                            activeTab.redeemPoints === 50
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          50đ (-5k)
                        </button>
                      )}
                      {customerPoints >= 100 && (
                        <button
                          type="button"
                          onClick={() => updateActiveTab({ redeemPoints: 100 })}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer ${
                            activeTab.redeemPoints === 100
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          100đ (-10k)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const maxRedeem = Math.min(
                            customerPoints,
                            Math.floor((subtotal - promotionDiscount - (Number(activeTab.customDiscount) || 0)) / LOYALTY_CONFIG.VND_PER_POINT_REDEEM)
                          );
                          updateActiveTab({ redeemPoints: Math.max(0, maxRedeem) });
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-200 hover:bg-amber-300 text-amber-900 border border-amber-300 transition cursor-pointer"
                      >
                        Dùng tối đa
                      </button>
                      {activeTab.redeemPoints && activeTab.redeemPoints > 0 ? (
                        <button
                          type="button"
                          onClick={() => updateActiveTab({ redeemPoints: 0 })}
                          className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 hover:text-red-600 transition cursor-pointer"
                        >
                          Bỏ dùng
                        </button>
                      ) : null}
                    </div>

                    {pointsRedeemed > 0 && (
                      <div className="text-[11px] text-amber-800 font-medium bg-amber-100/80 px-2 py-1 rounded flex items-center justify-between">
                        <span>Giảm trực tiếp vào hóa đơn:</span>
                        <b className="font-mono">-{formatCurrency(pointsDiscount)}</b>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-700 italic">Khách hàng chưa có điểm tích lũy.</p>
                )}

                {/* Earning preview */}
                <div className="pt-1.5 border-t border-amber-200/50 flex items-center justify-between text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Dự kiến tích sau đơn này:</span>
                  </span>
                  <span className="font-bold text-emerald-600 font-mono">+{projectedEarnPoints} điểm</span>
                </div>
              </div>
            )}

            {/* Promotion & Custom Discount */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>Khuyến mãi</span>
                  </span>
                  <kbd className="px-1 py-0.2 bg-slate-100 border border-slate-200 text-slate-500 rounded text-[9px] font-mono">F6</kbd>
                </label>
                <select
                  ref={promoSelectRef}
                  id="select-pos-promotion"
                  value={activeTab.promotionId || ''}
                  onChange={(e) =>
                    updateActiveTab({
                      promotionId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Không áp dụng</option>
                  {promotions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.discountType === 'PERCENTAGE' ? `-${p.discountValue}%` : `-${p.discountValue}đ`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                  <span>Giảm giá thêm (VNĐ)</span>
                  <kbd className="px-1 py-0.2 bg-slate-100 border border-slate-200 text-slate-500 rounded text-[9px] font-mono">F7</kbd>
                </label>
                <input
                  ref={discountInputRef}
                  id="input-pos-discount"
                  type="number"
                  min="0"
                  value={activeTab.customDiscount || ''}
                  onChange={(e) =>
                    updateActiveTab({ customDiscount: Math.max(0, Number(e.target.value) || 0) })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Payment Method Pills */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                <span>Phương thức thanh toán</span>
                <span className="text-[10px] text-slate-400 font-mono">F8: Chuyển tiếp &bull; Alt+1/2/3</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH', label: 'Tiền mặt', icon: Banknote, hotkey: 'Alt+1' },
                  { id: 'BANK_TRANSFER', label: 'Chuyển khoản', icon: QrCode, hotkey: 'Alt+2' },
                  { id: 'CREDIT_CARD', label: 'Thẻ POS', icon: CreditCard, hotkey: 'Alt+3' },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = activeTab.paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => updateActiveTab({ paymentMethod: pm.id as PaymentMethod })}
                      className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer relative ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{pm.label}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{pm.hotkey}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated QR Code for Bank Transfer */}
            {activeTab.paymentMethod === 'BANK_TRANSFER' && grandTotal > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                <div className="w-14 h-14 bg-white border border-blue-200 rounded-lg p-1 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-11 h-11 text-blue-700" />
                </div>
                <div className="text-xs text-blue-900">
                  <div className="font-bold">Quét mã VietQR chuyển khoản</div>
                  <div className="text-[11px] text-blue-700 mt-0.5">
                    Số tiền: <b>{formatCurrency(grandTotal)}</b>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Tự động đối soát thanh toán</div>
                </div>
              </div>
            )}

            {/* Financial Summary Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Tạm tính hàng hóa:</span>
                <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              {promotionDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Khuyến mãi áp dụng:</span>
                  <span>-{formatCurrency(promotionDiscount)}</span>
                </div>
              )}
              {activeTab.customDiscount ? (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Chiết khấu thêm:</span>
                  <span>-{formatCurrency(Number(activeTab.customDiscount) || 0)}</span>
                </div>
              ) : null}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                  <span>Đổi điểm tích lũy (-{pointsRedeemed}đ):</span>
                  <span>-{formatCurrency(pointsDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>TỔNG CỘNG:</span>
                <span className="text-blue-600 text-lg">{formatCurrency(grandTotal)}</span>
              </div>
              {projectedEarnPoints > 0 && (
                <div className="flex justify-between text-[11px] text-emerald-700 font-medium pt-0.5">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Tích lũy sau thanh toán:</span>
                  </span>
                  <span>+{projectedEarnPoints} điểm</span>
                </div>
              )}
            </div>

            {/* Action Buttons: Print Receipt & Checkout */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
              <button
                id="btn-pos-print-receipt"
                type="button"
                onClick={handlePrintReceipt}
                disabled={activeTab.cart.length === 0 && !lastInvoice}
                title="In phiếu tạm tính / Xem trước hóa đơn giao dịch hiện tại (Phím F10 hoặc Ctrl+P)"
                className="sm:col-span-5 py-3 px-3 rounded-xl font-bold text-xs border border-slate-300 bg-white hover:bg-blue-50/60 hover:border-blue-300 text-slate-700 hover:text-blue-700 flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                <Printer className="w-4 h-4 text-blue-600" />
                <span>IN PHIẾU (F10)</span>
              </button>

              <button
                id="btn-pos-checkout"
                type="button"
                onClick={handleCheckout}
                disabled={activeTab.cart.length === 0}
                title="Thanh toán đơn hàng (Phím F9 hoặc Ctrl+Enter)"
                className={`sm:col-span-7 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${
                  activeTab.cart.length === 0
                    ? 'bg-slate-300 shadow-none cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-blue-600/30'
                }`}
              >
                <span>THANH TOÁN (F9)</span>
                <kbd className="hidden sm:inline-block text-[10px] bg-blue-700/80 px-1.5 py-0.5 rounded font-mono border border-blue-400/30">Ctrl+Enter</kbd>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Print & Receipt Dialog */}
      {printModalInvoice && (
        <InvoicePrintModal
          invoice={printModalInvoice}
          isDraft={isPrintDraft}
          onClose={() => setPrintModalInvoice(null)}
        />
      )}

      {/* Barcode Scanner Modal (Camera, Manual, and Quick Hardware Simulator) */}
      {showScannerModal && (
        <BarcodeScannerModal
          products={products}
          onScan={(code) => handleBarcodeScanned(code)}
          onClose={() => setShowScannerModal(false)}
        />
      )}
    </div>
  );
};
