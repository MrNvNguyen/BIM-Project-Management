# Cài helper cho máy user

Dành cho máy chỉ mở trang [https://ddcn.bimonecadvn.com/#/projects](https://ddcn.bimonecadvn.com/#/projects).

Trang web không mở được folder NAS trên máy user nếu máy đó chưa có helper. Helper chạy tại `127.0.0.1:8765` trên chính máy user.

## Cách cài

1. Copy cả thư mục này sang máy user (USB hoặc thư mục chia sẻ).
2. Double-click `CaiDat-MayUser.bat`.
3. Nếu Windows hỏi UAC, bấm **Yes**.
4. Khi hiện hộp thoại đã cài xong: đóng hẳn Chrome/Edge, mở lại trang dự án, nhấn Ctrl+F5.
5. Lần đầu bấm mở folder, nếu trình duyệt hỏi quyền mạng nội bộ, chọn **Cho phép**.

Không cần sửa file, không cần mở PowerShell.

File cài nằm ở `%LOCALAPPDATA%\Onecad\bimfolder`. Helper tự chạy lại mỗi lần đăng nhập Windows.
