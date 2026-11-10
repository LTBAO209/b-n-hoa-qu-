# Hoa Quả Nhà Trồng – app bán trái cây (Node + Express + SQLite)

Ứng dụng bán trái cây hoàn chỉnh gồm **giao diện khách hàng** và **khu quản trị riêng**, dữ liệu lưu trong
cơ sở dữ liệu SQLite thật (`app/data/shop.db`), có đăng ký/đăng nhập, phân quyền admin và lịch sử đơn hàng.

## Chạy thử

```bash
cd app
npm install
npm start
```

- Cửa hàng: http://localhost:3000
- Quản trị: http://localhost:3000/admin/

Cơ sở dữ liệu và dữ liệu mẫu được tạo tự động ở lần chạy đầu. Muốn làm lại từ đầu, dừng server rồi xóa
thư mục `app/data/`.

### Tài khoản mẫu

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị | `admin@hoaquanhatrong.vn` | `Admin@123` |
| Khách hàng | `khach@hoaquanhatrong.vn` | `Khach@123` |

> Đổi mật khẩu mặc định trước khi đưa lên môi trường thật.

## Chức năng

**Khách hàng**
- Trang chủ: banner, sản phẩm bán chạy, tìm kiếm, lọc theo danh mục, khoảng giá, sắp xếp, phân trang.
- Trang giảm giá (`/?sale=1`), chi tiết sản phẩm, sản phẩm cùng loại.
- Giỏ hàng, đặt hàng (khách đăng nhập hoặc vãng lai), phí ship 30.000đ và miễn phí từ 300.000đ.
- Đăng ký, đăng nhập, cập nhật thông tin, xem lịch sử đơn hàng và trạng thái.
- Gửi tin nhắn liên hệ tới cửa hàng.

**Quản trị (`/admin/`, chỉ role admin)**
- Dashboard: doanh thu, số đơn, đơn mới, khách hàng, sản phẩm bán chạy, cảnh báo sắp hết hàng.
- Sản phẩm: thêm / sửa / xóa, giá gốc để giảm giá, tồn kho, nhãn, ảnh, ẩn/hiện.
- Đơn hàng: lọc theo trạng thái, xem chi tiết từng món, đổi trạng thái Mới → Đang giao → Hoàn tất/Hủy.
- Tin nhắn: đánh dấu đã xử lý, xóa, phản hồi qua email.
- Khách hàng: danh sách, số đơn và tổng chi tiêu.

## Công nghệ

- Node.js (>= 22.5), Express 5, `node:sqlite` có sẵn trong Node nên không cần cài module native.
- Mật khẩu băm bằng `scrypt` + salt; phiên đăng nhập lưu trong bảng `sessions`, cookie `HttpOnly`, `SameSite=Lax`.
- Chặn request ghi dữ liệu từ origin khác, kiểm tra quyền admin ở mọi API `/api/admin/*`.
- Giá và tổng tiền luôn được server tính lại từ cơ sở dữ liệu, tồn kho trừ trong transaction khi đặt hàng.

## Cấu trúc

```
app/
  server.js          Express server + toàn bộ API
  seed-data.js       Danh mục, sản phẩm, tài khoản, đơn mẫu
  data/shop.db       SQLite (tự tạo, không commit)
  public/
    index.html, san-pham.html, gio-hang.html, thanh-toan.html,
    tai-khoan.html, dang-nhap.html, dang-ky.html, lien-he.html
    assets/store.css, assets/store.js
    admin/index.html, admin/admin.css, admin/admin.js
```

Ảnh sản phẩm dùng chung thư mục `../image` của repository và được phục vụ tại `/image/...`.

## API chính

| Phương thức | Đường dẫn | Quyền |
| --- | --- | --- |
| GET | `/api/meta` | công khai |
| GET | `/api/products?q&category&sale&min&max&sort&page&limit&ids` | công khai |
| GET | `/api/products/:slug` | công khai |
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | công khai |
| GET | `/api/auth/me`, PUT `/api/auth/profile` | đăng nhập |
| GET | `/api/orders/my` | đăng nhập |
| POST | `/api/orders` | công khai (khách vãng lai được) |
| POST | `/api/messages` | công khai |
| GET | `/api/admin/stats`, `/api/admin/products`, `/api/admin/orders`, `/api/admin/messages`, `/api/admin/users`, `/api/admin/images` | admin |
| POST/PUT/DELETE | `/api/admin/products[/:id]`, PATCH `/api/admin/orders/:id`, PATCH/DELETE `/api/admin/messages/:id` | admin |

## Ghi chú khi triển khai thật

- Chạy sau HTTPS, đặt `PORT` qua biến môi trường, sao lưu `app/data/shop.db` định kỳ.
- Đổi mật khẩu admin mặc định, cân nhắc thêm giới hạn đăng nhập sai và gửi email xác nhận đơn.
- Ảnh hiện chọn từ `../image`; muốn upload ảnh mới cần thêm route upload (multer) và kiểm tra định dạng file.
