'use strict';

/* Dữ liệu mẫu dùng cho lần chạy đầu tiên (khi database còn trống). */

const categories = [
  { slug: 'cam-quyt', name: 'Họ cam quýt' },
  { slug: 'qua-mong', name: 'Họ quả mọng' },
  { slug: 'nhiet-doi', name: 'Trái cây nhiệt đới' },
  { slug: 'nhap-khau', name: 'Trái cây nhập khẩu' },
  { slug: 'gio-qua', name: 'Giỏ quà' }
];

const products = [
  {
    slug: 'cam-dalat', name: 'Cam Đà Lạt', price: 16000, oldPrice: 20000, unit: 'kg',
    category: 'cam-quyt', origin: 'Việt Nam', stock: 120, sold: 145, badge: 'Bán chạy',
    image: '/image/traicay3.jpg',
    description: 'Cam sành Đà Lạt mọng nước, vị ngọt thanh, giàu vitamin C. Hái trong ngày và giao ngay cho bạn.'
  },
  {
    slug: 'nho-on-doi', name: 'Nho ôn đới', price: 13000, oldPrice: 15000, unit: 'kg',
    category: 'qua-mong', origin: 'Mỹ', stock: 80, sold: 96, badge: '',
    image: '/image/traicay4.jpg',
    description: 'Nho mọng, hạt nhỏ, ngọt đậm, được bảo quản lạnh từ vườn đến tay khách hàng.'
  },
  {
    slug: 'xoai-binh-duong', name: 'Xoài Bình Dương', price: 55000, oldPrice: 100000, unit: 'kg',
    category: 'nhiet-doi', origin: 'Việt Nam', stock: 60, sold: 210, badge: 'Giảm sâu',
    image: '/image/traicay5.jpg',
    description: 'Xoài cát Bình Dương chín vàng, thịt dày, thơm ngọt tự nhiên, ít xơ.'
  },
  {
    slug: 'dua-hau', name: 'Dưa hấu không hột', price: 17000, oldPrice: 20000, unit: 'kg',
    category: 'nhiet-doi', origin: 'Việt Nam', stock: 90, sold: 132, badge: '',
    image: '/image/traicay6.jpg',
    description: 'Dưa hấu ruột đỏ, không hột, giòn ngọt, thích hợp giải nhiệt cho cả gia đình.'
  },
  {
    slug: 'mang-cau', name: 'Mãng cầu ta', price: 13000, oldPrice: 15000, unit: 'kg',
    category: 'nhiet-doi', origin: 'Việt Nam', stock: 45, sold: 78, badge: '',
    image: '/image/traicay7.jpg',
    description: 'Mãng cầu ta chín tới, thịt trắng mềm, ngọt thơm, hạt ít.'
  },
  {
    slug: 'chuoi', name: 'Chuối chín', price: 14000, oldPrice: 16000, unit: 'kg',
    category: 'nhiet-doi', origin: 'Việt Nam', stock: 150, sold: 260, badge: 'Bán chạy',
    image: '/image/traicay8.jpg',
    description: 'Chuối chín tự nhiên, vỏ vàng đẹp, vị ngọt bùi, tốt cho bữa sáng.'
  },
  {
    slug: 'tao-do', name: 'Táo đỏ', price: 10000, oldPrice: 12000, unit: 'kg',
    category: 'nhap-khau', origin: 'Trung Quốc', stock: 100, sold: 188, badge: '',
    image: '/image/traicay9.jpg',
    description: 'Táo đỏ giòn, ngọt nhẹ, giàu chất xơ, phù hợp ăn vặt hằng ngày.'
  },
  {
    slug: 'cherry-uc', name: 'Cherry Úc', price: 13000, oldPrice: 16000, unit: 'hộp',
    category: 'nhap-khau', origin: 'Úc', stock: 40, sold: 64, badge: 'Nhập khẩu',
    image: '/image/traicay10.jpg',
    description: 'Cherry Úc quả to, căng mọng, vị ngọt thanh, nhập khẩu chính ngạch.'
  },
  {
    slug: 'dua-luoi', name: 'Dưa lưới Đà Lạt', price: 15000, oldPrice: 17000, unit: 'kg',
    category: 'nhiet-doi', origin: 'Việt Nam', stock: 55, sold: 91, badge: '',
    image: '/image/traicay11.jpg',
    description: 'Dưa lưới Đà Lạt ruột vàng, mật ngọt, thơm dịu, chuẩn vị nhà trồng.'
  },
  {
    slug: 'dau-tay-han', name: 'Dâu tây Hàn Quốc', price: 15000, oldPrice: 16000, unit: 'hộp',
    category: 'qua-mong', origin: 'Hàn Quốc', stock: 35, sold: 57, badge: '',
    image: '/image/traicay12.jpg',
    description: 'Dâu tây Hàn Quốc đỏ mọng, thơm ngọt, đóng hộp giấy bảo vệ từng quả.'
  },
  {
    slug: 'kiwi-xanh', name: 'Kiwi xanh', price: 17000, oldPrice: 20000, unit: 'kg',
    category: 'nhap-khau', origin: 'New Zealand', stock: 70, sold: 83, badge: '',
    image: '/image/traicay13.jpg',
    description: 'Kiwi xanh New Zealand giàu vitamin C, vị chua ngọt cân bằng, dễ ăn.'
  },
  {
    slug: 'bo-dak-lak', name: 'Quả bơ', price: 14000, oldPrice: 16000, unit: 'kg',
    category: 'nhiet-doi', origin: 'Việt Nam', stock: 85, sold: 119, badge: '',
    image: '/image/traicay14.jpg',
    description: 'Bơ Đắk Lắk dẻo mịn, béo nhẹ, chín tự nhiên, giàu dinh dưỡng.'
  },
  {
    slug: 'gio-qua-tet', name: 'Giỏ quà trái cây cao cấp', price: 450000, oldPrice: null, unit: 'giỏ',
    category: 'gio-qua', origin: 'Việt Nam', stock: 25, sold: 38, badge: 'Quà tặng',
    image: '/image/gio-qua-tet.png',
    description: 'Giỏ quà 5 loại trái cây theo mùa, gói giấy kraft và kèm thiệp chúc. Món quà cho Tết, lễ và sinh nhật.'
  }
];

const users = [
  {
    name: 'Quản trị viên', email: 'admin@hoaquanhatrong.vn', password: 'Admin@123',
    role: 'admin', phone: '0879917194', address: '280 Đ. An Dương Vương, P.4, Q.5, TP.HCM'
  },
  {
    name: 'Nguyễn Văn Khách', email: 'khach@hoaquanhatrong.vn', password: 'Khach@123',
    role: 'customer', phone: '0901234567', address: '12 Nguyễn Trãi, P.5, Q.5, TP.HCM'
  }
];

const demoOrders = [
  {
    customerEmail: 'khach@hoaquanhatrong.vn',
    customerName: 'Nguyễn Văn Khách',
    phone: '0901234567',
    address: '12 Nguyễn Trãi, P.5, Q.5, TP.HCM',
    payment: 'Thanh toán khi nhận hàng (COD)',
    delivery: 'Giao nhanh trong 2 giờ (nội thành TP.HCM)',
    status: 'Hoàn tất',
    note: 'Giao buổi sáng',
    hoursAgo: 30,
    items: [{ slug: 'cam-dalat', qty: 3 }, { slug: 'xoai-binh-duong', qty: 2 }]
  },
  {
    customerEmail: 'khach@hoaquanhatrong.vn',
    customerName: 'Nguyễn Văn Khách',
    phone: '0901234567',
    address: '12 Nguyễn Trãi, P.5, Q.5, TP.HCM',
    payment: 'Chuyển khoản ngân hàng',
    delivery: 'Giao tiêu chuẩn trong ngày',
    status: 'Đang giao',
    note: 'Chọn quả chín vừa',
    hoursAgo: 5,
    items: [{ slug: 'dau-tay-han', qty: 2 }, { slug: 'kiwi-xanh', qty: 1 }, { slug: 'bo-dak-lak', qty: 2 }]
  }
];

module.exports = { categories, products, users, demoOrders };
