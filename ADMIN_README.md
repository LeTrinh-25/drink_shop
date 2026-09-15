# Khu vực Admin — Drink Shop

Tài liệu bổ sung cho phần quản trị được thêm vào dự án NestJS hiện có.

## 1. Công nghệ (giữ nguyên như dự án gốc)

| Thành phần | Công nghệ |
|---|---|
| Backend | NestJS 11 (TypeScript) |
| ORM | TypeORM (`synchronize: true`) |
| Database | MySQL |
| View | EJS (SSR) + Bootstrap 5 (CDN) |
| Biểu đồ | Chart.js 4 (CDN) |
| Xác thực | `express-session` + `bcrypt` (dùng lại `AuthService` có sẵn) |

Không thêm dependency mới. Validation và flash message được viết tay trong `src/common/`
để không phải cài `class-validator` hay `express-flash`.

## 2. Chạy và đăng nhập

```bash
npm install
npm run start:dev
```

Lần chạy đầu tiên, nếu trong bảng `users` chưa có tài khoản nào có `role = 'admin'`,
`AdminService.onModuleInit()` sẽ tự tạo một tài khoản quản trị và in thông tin ra console:

```
WARN [AdminService] Đã tạo tài khoản Admin mặc định -> username: admin / password: admin123
```

Thông tin này cấu hình được qua `.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD`).
**Hãy đổi mật khẩu ngay sau lần đăng nhập đầu tiên** tại `/admin/settings`.

Đăng nhập tại: <http://localhost:3000/admin/login>

> Nếu username đã tồn tại sẵn trong DB, hệ thống nâng quyền tài khoản đó lên admin
> thay vì tạo bản ghi trùng lặp.

## 3. Thay đổi database

Tất cả đều do TypeORM tự áp dụng nhờ `synchronize: true`, **không làm mất dữ liệu cũ**.

**Cột thêm vào bảng có sẵn**

| Bảng | Cột mới | Ghi chú |
|---|---|---|
| `users` | `fullName`, `email`, `phone` | nullable |
| `users` | `role` | `'user'` \| `'admin'`, mặc định `'user'` → user cũ vẫn là khách hàng |
| `users` | `isActive` | mặc định `true` |
| `users` | `createdAt` | |
| `products` | `stock` | mặc định `0` |
| `products` | `isActive` | mặc định `true` → sản phẩm cũ vẫn hiển thị |
| `products` | `category_id` | nullable, `ON DELETE SET NULL` |
| `products` | `createdAt` | |

**Bảng mới**

- `categories` — `id, name, description, isActive, createdAt`
- `orders` — `id, user_id, customerName, phone, address, paymentMethod, note, total, status, createdAt, updatedAt`
- `order_items` — `id, order_id, product_id, productName, productImage, price, quantity`

`order_items` sao chép lại tên/giá/ảnh sản phẩm tại thời điểm đặt, nên sửa hoặc xóa
sản phẩm về sau không làm sai lệch lịch sử đơn hàng.

`status` của đơn: `pending` → `confirmed` → `shipping` → `completed`, hoặc `cancelled`.
**Chỉ đơn `completed` mới được tính vào doanh thu.**

## 4. Danh sách route

### Xác thực
| Method | Route | Chức năng |
|---|---|---|
| GET/POST | `/admin/login` | Đăng nhập (từ chối tài khoản không phải admin và tài khoản bị khóa) |
| GET | `/admin/logout` | Đăng xuất |

### Trang quản trị
| Method | Route | Chức năng |
|---|---|---|
| GET | `/admin` | Dashboard |
| GET | `/admin/users` | Danh sách người dùng (tìm kiếm, lọc vai trò/trạng thái, phân trang) |
| GET/POST | `/admin/users/create` | Thêm người dùng |
| GET | `/admin/users/:id/detail` | Chi tiết + lịch sử mua hàng |
| GET/POST | `/admin/users/:id/edit` | Sửa |
| POST | `/admin/users/:id/delete` | Xóa |
| GET | `/admin/products` | Danh sách sản phẩm (tìm kiếm, lọc danh mục/trạng thái, sắp xếp, phân trang) |
| GET/POST | `/admin/products/create` | Thêm |
| GET | `/admin/products/:id/detail` | Chi tiết |
| GET/POST | `/admin/products/:id/edit` | Sửa |
| POST | `/admin/products/:id/delete` | Xóa |
| POST | `/admin/products/:id/toggle` | Bật/tắt hiển thị |
| GET | `/admin/categories` | Danh sách danh mục |
| GET/POST | `/admin/categories/create` | Thêm |
| GET/POST | `/admin/categories/:id/edit` | Sửa |
| POST | `/admin/categories/:id/delete` | Xóa |
| GET | `/admin/orders` | Danh sách đơn (tìm kiếm, lọc trạng thái + khoảng ngày, phân trang) |
| GET | `/admin/orders/:id/detail` | Chi tiết đơn |
| POST | `/admin/orders/:id/status` | Đổi trạng thái |
| POST | `/admin/orders/:id/delete` | Xóa đơn |
| GET | `/admin/statistics` | Thống kê & báo cáo (`?year=`) |
| GET | `/admin/settings` | Cài đặt tài khoản |
| POST | `/admin/settings/profile` | Cập nhật thông tin |
| POST | `/admin/settings/password` | Đổi mật khẩu |

### API JSON (cho biểu đồ)
| Method | Route |
|---|---|
| GET | `/admin/api/chart/revenue?days=N` |
| GET | `/admin/api/chart/top-products?limit=N` |

Hai route này dùng `AdminGuard` nên trả về 401/403 thay vì redirect.

### Route cũ (giữ tương thích)
`/products/admin`, `/products/admin/add`, `/products/admin/edit/:id`
→ redirect **301** sang route tương ứng trong `/admin/products`.

## 5. Phân quyền

`AdminMiddleware` được gắn cho `admin` và `admin/*path`, loại trừ `admin/login`:

- Chưa đăng nhập → lưu URL đang muốn vào rồi redirect `/admin/login`
  (đăng nhập xong quay lại đúng trang đó).
- Đã đăng nhập nhưng `role !== 'admin'` → HTTP **403** + trang `views/admin/403.ejs`.

Ràng buộc an toàn trong `AdminUsersController`:
- Không tự xóa tài khoản đang đăng nhập.
- Không tự hạ quyền / tự khóa tài khoản đang đăng nhập.
- Không xóa Admin cuối cùng của hệ thống.

## 6. Cách kiểm tra nhanh

1. Vào `/admin` khi chưa đăng nhập → bị đẩy về `/admin/login`.
2. Đăng nhập `admin` / `admin123` → vào Dashboard.
3. Tạo một danh mục ở `/admin/categories/create`, rồi tạo sản phẩm ở
   `/admin/products/create` (gán danh mục, đặt tồn kho).
4. Mở tab ẩn danh, đăng ký một tài khoản khách, đặt hàng ở trang bán hàng.
5. Quay lại `/admin/orders` → thấy đơn ở trạng thái “Chờ xác nhận”; tồn kho
   sản phẩm đã bị trừ.
6. Đổi trạng thái đơn sang “Hoàn thành” → Dashboard và `/admin/statistics`
   mới cộng doanh thu.
7. Đăng nhập bằng tài khoản khách rồi vào `/admin` → nhận trang 403.
