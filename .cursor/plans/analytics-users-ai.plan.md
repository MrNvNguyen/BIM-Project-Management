---
name: Analytics users AI
overview: Bảng người dùng trong tab Năng suất nhân sự (chỉ system admin). Bong bóng chat mọi trang, tra cứu theo đúng quyền vai trò, và AI tạo timesheet hoặc task qua API hiện có sau khi người dùng xác nhận.
todos:
  - id: analytics-users
    content: "Tab Năng suất nhân sự: bảng người dùng hệ thống từ dữ liệu sẵn, không đổi công thức điểm"
    status: pending
  - id: analytics-ai-lookup
    content: "Bong bóng chat mọi trang; tra cứu theo quyền vai trò; AI tạo timesheet và task qua API hiện có, có xác nhận"
    status: pending
isProject: false
---

# Kế hoạch phân tích người dùng và tra cứu vấn đề

Bảng người dùng nằm trong Báo cáo, chỉ `system_admin`. Tra cứu là bong bóng chat nổi cho mọi nhân sự đã đăng nhập, nhưng câu trả lời và thao tác chỉ trong quyền vai trò đó đang có.

## Người dùng hệ thống

Đặt trong tab **Năng suất nhân sự** (`analytics-team`, nút `tab-team`), một khối dưới bảng năng suất hiện có.

Công thức điểm của `GET /api/productivity` trong `src/index.tsx` giữ nguyên. Query đó loại `system_admin` khỏi điểm. Không đưa tài khoản quản trị vào biểu đồ điểm.

Khối mới đọc bảng sẵn có, không ghi một dòng log mỗi request:

- `users`: họ tên, vai trò, phòng ban, `is_active`, ngày tạo
- Chấm công gần nhất: `MAX(timesheets.work_date)` theo `user_id`
- Task đang mở và task trễ: đếm `tasks` theo `assigned_to`, cùng điều kiện trễ đang dùng ở productivity

Cột: họ tên, vai trò, phòng ban, đang hoạt động, chấm công gần nhất, task mở, task trễ. `system_admin` có trong bảng này.

API `GET /api/analytics/system-users`, `adminOnly`. Không trả `password_hash`, lương.

## Tra cứu — bong bóng chat

Nút tròn góc dưới phải, ngoài nội dung trang, hiện sau khi đăng nhập trên mọi trang. Bấm mở khung hội thoại: câu của người dùng một bên, câu trả lời bên kia, cùng kiểu bong bóng với chat dự án (dùng class chat đã có token sáng/tối). Không đặt trong tab Báo cáo.

Mọi vai trò đều mở được bong bóng. Nội dung trả về bị cắt theo quyền đang có của người đó:

- Bài `all`: mọi người đã đăng nhập.
- Bài gắn một hoặc vài vai trò (`member`, `project_leader`, `project_admin`, `system_admin`): chỉ những vai trò đó, cộng `system_admin` luôn thấy hết.
- Không dùng bậc “role cao hơn được xem bài của role thấp hơn”. `project_admin` và `project_leader` không cùng một thang quyền.

Kho tài liệu, migration cộng thêm, không ghi log từng request:

- Bảng `knowledge_articles`: tiêu đề, nội dung, loại `workflow` hoặc `technical`, cột `audience` (mặc định `all`), ngày sửa.
- `system_admin` thêm và sửa bài, kể cả chọn ai được đọc. Nhân sự khác chỉ hỏi, không thấy màn sửa.

`POST /api/assistant/ask`, đã đăng nhập. Server chỉ tìm trong các bài người đó được đọc (lọc chữ, chưa cần vector). Có secret `AI_API_KEY` thì gọi model một lần, chỉ với các đoạn đó và câu hỏi. Không có khóa, hoặc không có đoạn khớp, thì trả đúng đoạn tìm được hoặc câu “chưa có tài liệu”. Không bịa bước triển khai. Không gửi lương, mật khẩu, token, doanh thu. Trình duyệt không gọi model.

Bong bóng có thể nói quyền của chính người đang hỏi (dự án mình là thành viên, có được tạo timesheet cho người khác hay không). Không liệt kê quyền hay dữ liệu của người khác. Số task trễ cả công ty và phiếu thanh toán vẫn chỉ ở bảng người dùng cho admin.

## Việc hằng ngày — AI gọi API đang có

Có `AI_API_KEY` thì bong bóng còn nhận câu kiểu “chấm công hôm nay dự án X 8 giờ” hoặc “tạo task …”. Model chỉ trả ý định có cấu trúc (loại việc, trường). Server kiểm tra rồi ghi. Không có khóa thì bong bóng vẫn tra cứu, và nói chưa soạn được timesheet hay task.

Đợt này hai việc:

- Tạo timesheet: đi cùng luật `POST /api/timesheets` trong [src/index.tsx](src/index.tsx) (khoảng dòng 4047). Thành viên chỉ tạo cho mình, trong tuần hiện tại, trên dự án mình thuộc. `project_admin` tạo cho người khác chỉ trong dự án mình quản. `system_admin` giữ ngoại lệ tuần cũ. Giờ, loại ngày, trần OT, bản ghi đã duyệt: hàm validate hiện có quyết định, không viết lại trong prompt.
- Tạo task: đi cùng luật `POST /api/tasks` (khoảng dòng 2694). Mọi thành viên dự án được tạo trong dự án đó. Không thuộc dự án thì 403 như route hiện tại.

Luồng trên bong bóng:

1. Người dùng nói việc cần làm.
2. Server dựng bản nháp từ dự án và task người đó được thấy, hiện lại trong bong bóng.
3. Người dùng bấm xác nhận. Chưa xác nhận thì không ghi.
4. Server ghi bằng cùng kiểm tra của hai route trên (gọi chung một hàm với route, không `INSERT` riêng trong assistant). Lỗi API (tuần đã qua, không phải thành viên, timesheet đã duyệt) hiện nguyên câu lỗi.

Không thêm việc thanh toán, pháp lý, duyệt, lương. Việc hằng ngày sau này thêm theo cùng kiểu: nháp, xác nhận, rồi route đang có.

## Không làm

- Đổi công thức năng suất, VAT, phí QL, `computeBookedRevenue`
- Ghi log từng request để đo người dùng
- Đưa bong bóng tra cứu vào tab Báo cáo, hoặc khóa chỉ system admin
- Cho model tự ghi CSDL, hoặc cho trình duyệt gọi model
- Sửa `app.v2.js`
