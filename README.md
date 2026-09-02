# Sales Management System

Ứng dụng quản lý bán hàng chạy local trên PC, không cần Internet.

## Yêu cầu hệ thống
- Windows 10/11
- Java Runtime Environment (JRE) 17 trở lên đã cài đặt trên máy
  (kiểm tra bằng lệnh `java -version` trong PowerShell)

## Cách chạy ứng dụng

### Từ bản đóng gói (JAR)
1. Giải nén hoặc copy toàn bộ thư mục `release` vào máy.
2. Mở PowerShell tại thư mục đó.
3. Chạy lệnh:

4. File database `sales_management.db` sẽ tự tạo cùng thư mục nếu chưa có.

### Từ mã nguồn (dành cho lập trình viên)
Yêu cầu: JDK 17+, Maven 3.8+.


## Tài khoản đăng nhập mặc định
- Username: `admin`
- Password: `admin123`

**Khuyến nghị:** sau lần đăng nhập đầu tiên, vào mục "Nhân viên / Tài khoản" để tạo thêm tài khoản Manager/Employee riêng theo nhu cầu cửa hàng.

## Phân quyền theo vai trò
| Vai trò | Quyền |
|---|---|
| Admin | Toàn quyền: sản phẩm, kho, nhân viên, tài khoản, báo cáo, backup |
| Manager | Sản phẩm, kho, nhập hàng, bán hàng, báo cáo, backup (trừ quản lý nhân viên) |
| Employee | Bán hàng, tìm sản phẩm, quản lý khách hàng |

## Các chức năng chính
- **Bán hàng (POS):** tìm sản phẩm, thêm giỏ hàng, thanh toán, tự động trừ kho.
- **Sản phẩm / Danh mục:** quản lý CRUD, không xóa cứng sản phẩm đã có giao dịch.
- **Kho / Nhập hàng:** tạo phiếu nhập từ nhà cung cấp, tự động tăng tồn kho.
- **Báo cáo:** doanh thu, lợi nhuận, sản phẩm bán chạy theo khoảng thời gian.
- **Backup/Restore:** sao lưu database ra file `.db`, khôi phục khi cần.

## Sao lưu dữ liệu định kỳ
Khuyến nghị vào mục "Backup/Restore" tạo bản sao lưu **hàng ngày hoặc hàng tuần**, lưu ra ổ đĩa ngoài hoặc USB để phòng trường hợp máy tính gặp sự cố.

## Cấu trúc dự án


## Xử lý sự cố thường gặp
- **Không mở được ứng dụng:** kiểm tra đã cài Java 17+ chưa (`java -version`).
- **Quên mật khẩu admin:** cần truy cập trực tiếp database bằng DB Browser for SQLite để reset (liên hệ người quản trị kỹ thuật).
- **Dữ liệu bị lỗi/mất:** khôi phục từ bản backup gần nhất qua mục "Backup/Restore".