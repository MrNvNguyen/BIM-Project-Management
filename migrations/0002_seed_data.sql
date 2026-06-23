-- Seed disciplines data (24 canonical BIM discipline codes)
DELETE FROM disciplines;
INSERT INTO disciplines (code, name, category) VALUES 
  ('ZZ', 'Tổng hợp', 'general'),
  ('AA', 'Kiến trúc', 'architecture'),
  ('AD', 'Nội thất', 'architecture'),
  ('AF', 'Mặt dựng', 'architecture'),
  ('ES', 'Kết cấu', 'structure'),
  ('EM', 'Điều hòa thông gió', 'mep'),
  ('EE', 'Điện sinh hoạt', 'mep'),
  ('EP', 'Cấp thoát nước sinh hoạt', 'mep'),
  ('EF', 'Chữa cháy', 'mep'),
  ('EC', 'Thông tin liên lạc', 'mep'),
  ('CL', 'San nền', 'civil'),
  ('CT', 'Giao thông', 'civil'),
  ('CD', 'Thoát nước mưa', 'civil'),
  ('CS', 'Thoát nước thải', 'civil'),
  ('CW', 'Cấp nước', 'civil'),
  ('CF', 'Chữa cháy (hạ tầng)', 'civil'),
  ('CE', 'Điện (hạ tầng)', 'civil'),
  ('CC', 'Thông tin (hạ tầng)', 'civil'),
  ('LA', 'Cảnh quan', 'landscape'),
  ('LW', 'Cấp nước cảnh quan', 'landscape'),
  ('LD', 'Thoát nước cảnh quan', 'landscape'),
  ('LR', 'Tường chắn', 'landscape'),
  ('LE', 'Kè', 'landscape'),
  ('LL', 'Chiếu sáng', 'landscape');

-- Default System Admin account (password: Admin@123)
-- Password hash for 'Admin@123' - using simple encoding for demo
INSERT OR IGNORE INTO users (username, password_hash, full_name, email, role, department) VALUES 
  ('admin', '$2a$10$admin_hash_placeholder_Admin123', 'System Administrator', 'admin@onecad.vn', 'system_admin', 'Quản lý hệ thống');

-- Sample users
INSERT OR IGNORE INTO users (username, password_hash, full_name, email, role, department, salary_monthly) VALUES 
  ('nguyen.van.a', '$2a$10$member_hash_placeholder', 'Nguyễn Văn A', 'nva@onecad.vn', 'member', 'Kiến trúc', 15000000),
  ('tran.thi.b', '$2a$10$member_hash_placeholder', 'Trần Thị B', 'ttb@onecad.vn', 'member', 'Kết cấu', 16000000),
  ('le.van.c', '$2a$10$member_hash_placeholder', 'Lê Văn C', 'lvc@onecad.vn', 'project_leader', 'MEP', 18000000),
  ('pham.thi.d', '$2a$10$member_hash_placeholder', 'Phạm Thị D', 'ptd@onecad.vn', 'project_admin', 'Quản lý dự án', 22000000);

-- Sample projects
INSERT OR IGNORE INTO projects (code, name, description, client, project_type, status, start_date, end_date, contract_value, admin_id, leader_id, created_by) VALUES 
  ('PRJ001', 'Tòa nhà văn phòng OneCad Tower', 'Dự án thiết kế tòa nhà văn phòng 15 tầng tại Hà Nội', 'OneCad Vietnam', 'building', 'active', '2024-01-15', '2024-12-31', 5000000000, 4, 3, 1),
  ('PRJ002', 'Cầu vượt đường bộ QL1A', 'Dự án thiết kế cầu vượt tại km 45+200 QL1A', 'Bộ GTVT', 'transport', 'active', '2024-03-01', '2025-06-30', 12000000000, 4, 3, 1),
  ('PRJ003', 'Khu đô thị Eco City', 'Quy hoạch và thiết kế khu đô thị sinh thái 50ha', 'Eco Land JSC', 'building', 'planning', '2024-06-01', '2025-12-31', 8000000000, 4, 3, 1);

-- Sample categories
INSERT OR IGNORE INTO categories (project_id, name, code, discipline_code, phase, start_date, end_date, status, created_by) VALUES 
  (1, 'Thiết kế kiến trúc', 'CAT-AA', 'AA', 'basic_design', '2024-01-15', '2024-04-30', 'in_progress', 4),
  (1, 'Thiết kế kết cấu', 'CAT-ES', 'ES', 'basic_design', '2024-02-01', '2024-05-31', 'in_progress', 4),
  (1, 'Thiết kế MEP', 'CAT-MEP', 'EM', 'basic_design', '2024-03-01', '2024-06-30', 'pending', 4),
  (2, 'Thiết kế cầu', 'CAT-CT', 'CT', 'technical_design', '2024-03-01', '2024-09-30', 'in_progress', 4);

-- Sample tasks
INSERT OR IGNORE INTO tasks (project_id, category_id, title, description, discipline_code, phase, priority, status, assigned_to, assigned_by, start_date, due_date, estimated_hours, progress) VALUES 
  (1, 1, 'Vẽ mặt bằng tầng điển hình', 'Vẽ mặt bằng tầng 2-14 theo tiêu chuẩn BIM', 'AA', 'basic_design', 'high', 'in_progress', 2, 4, '2024-01-20', '2024-02-28', 40, 65),
  (1, 1, 'Thiết kế mặt đứng công trình', 'Thiết kế 4 mặt đứng theo phong cách hiện đại', 'AA', 'basic_design', 'high', 'in_progress', 2, 4, '2024-02-01', '2024-03-15', 30, 40),
  (1, 2, 'Tính toán móng cọc', 'Tính toán và thiết kế hệ móng cọc nhồi D600', 'ES', 'basic_design', 'urgent', 'review', 3, 4, '2024-02-01', '2024-02-20', 24, 90),
  (1, 2, 'Thiết kế khung thép tầng 1', 'Thiết kế hệ khung chịu lực tầng 1', 'ES', 'basic_design', 'medium', 'todo', 3, 4, '2024-03-01', '2024-03-30', 20, 0),
  (2, 4, 'Khảo sát địa chất', 'Lập báo cáo khảo sát địa chất công trình cầu', 'CT', 'technical_design', 'urgent', 'completed', 2, 4, '2024-03-01', '2024-03-20', 16, 100);

-- Sample timesheets
INSERT OR IGNORE INTO timesheets (user_id, project_id, task_id, work_date, regular_hours, overtime_hours, description, status) VALUES 
  (2, 1, 1, '2024-01-20', 8, 0, 'Bắt đầu vẽ mặt bằng tầng 2', 'approved'),
  (2, 1, 1, '2024-01-21', 8, 2, 'Tiếp tục vẽ mặt bằng tầng 3-5', 'approved'),
  (2, 1, 2, '2024-01-22', 8, 0, 'Phác thảo mặt đứng công trình', 'submitted'),
  (3, 1, 3, '2024-02-01', 8, 3, 'Tính toán tải trọng móng', 'approved'),
  (3, 2, 5, '2024-03-02', 8, 0, 'Thực hiện khảo sát địa chất', 'approved');

-- Sample assets
INSERT OR IGNORE INTO assets (asset_code, name, category, brand, model, serial_number, purchase_date, purchase_price, current_value, status, department, assigned_to, specifications, created_by) VALUES 
  ('PC-001', 'Máy tính làm việc BIM #1', 'computer', 'Dell', 'Precision 5820', 'SN123456', '2023-01-15', 45000000, 38000000, 'active', 'Kiến trúc', 2, 'CPU: Intel Xeon W-2223, RAM: 64GB ECC, GPU: NVIDIA RTX 3080 10GB, SSD: 2TB NVMe', 1),
  ('LP-001', 'Laptop BIM Workstation #1', 'laptop', 'HP', 'ZBook Studio G9', 'SN789012', '2023-03-20', 52000000, 45000000, 'active', 'Kết cấu', 3, 'CPU: Intel Core i9-12900H, RAM: 64GB DDR5, GPU: NVIDIA RTX A2000, SSD: 2TB NVMe', 1),
  ('SW-001', 'License Autodesk AEC Collection', 'software', 'Autodesk', 'AEC Collection 2024', 'AEC-2024-001', '2024-01-01', 28000000, 28000000, 'active', 'Toàn công ty', NULL, 'Revit, Civil 3D, Navisworks, AutoCAD - 5 users', 1),
  ('VH-001', 'Xe máy công tác', 'vehicle', 'Honda', 'SH 150i', '51B1-12345', '2022-06-01', 75000000, 55000000, 'active', 'Quản lý dự án', 4, 'Màu đen, BKS: 51B1-12345', 1);

-- Sample notifications
INSERT OR IGNORE INTO notifications (user_id, title, message, type, related_type, related_id) VALUES 
  (2, 'Task sắp đến hạn', 'Task "Vẽ mặt bằng tầng điển hình" còn 3 ngày đến hạn', 'warning', 'task', 1),
  (3, 'Task được giao mới', 'Bạn được giao task "Thiết kế khung thép tầng 1"', 'info', 'task', 4),
  (4, 'Báo cáo timesheet chờ duyệt', '3 timesheet đang chờ phê duyệt', 'info', 'task', NULL);
