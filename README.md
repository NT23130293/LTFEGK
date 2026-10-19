# Đồ án game Pikachu — ba màn đầu

Mở `index.html` bằng trình duyệt để chơi. Game dùng JavaScript thuần và hình ảnh cục bộ, không cần cài thư viện hay kết nối mạng.

## Cách chơi

- Chọn hai Pokémon giống nhau. Đường nối chỉ đi ngang/dọc qua ô trống, có tối đa hai lần rẽ và được đi vòng ngoài bàn.
- Mỗi cặp đúng cộng 100 điểm. Xóa hết 72 cặp trước khi hết giờ để thắng.
- Màn 1: bàn 9 × 16, 6 loại, 600 giây; các quân đứng yên.
- Màn 2: bàn 9 × 16, 8 loại, 540 giây; các quân dồn sang phải sau mỗi cặp, giữ thứ tự trong hàng.
- Có tạm dừng, chơi lại, chọn màn. Khi hết nước đi, bàn tự xáo miễn phí và giữ số lượng mỗi loại.
- Hoàn thành lần lượt các màn; thắng màn 3 kết thúc bản đồ án hiện tại.

- Màn 3: bàn 9 × 16, 12 loại, 510 giây; các quân dồn xuống sau mỗi cặp, giữ thứ tự trong cột.

## Thuật toán trong script.js

1. Tạo từng cặp Pokémon và trộn bằng Fisher–Yates: O(N).
2. BFS với trạng thái `(hàng, cột, hướng, số lần rẽ)`; viền trống bao quanh bàn cho phép nối ngoài mép. Một lần tìm đường có độ phức tạp O(N), do số hướng và số lần rẽ bị giới hạn.
3. Gom quân theo loại rồi tìm đường giữa các cặp để phát hiện nước đi. Trường hợp xấu nhất O(N³).
4. Dồn phải bằng hai chỉ số đọc/ghi từ cuối hàng: O(N), giữ thứ tự quân.
5. Xáo quân còn lại khi bế tắc; nếu 60 lần trộn chưa có nước đi, chủ động hoán vị một cặp vào hai vị trí nối được.

`N` là số ô trên bàn. Đồng hồ dùng thời gian thực; mã phiên ngăn hoạt ảnh của lượt cũ làm thay đổi bàn mới. Chuyển tab sẽ tạm dừng game.

## Nguồn tham khảo

Phần JavaScript và tài nguyên hình ảnh được điều chỉnh từ project `D:\pikachu` do người dùng cung cấp. Bản này chỉ triển khai ba màn đầu, rút gọn các luật của màn 4–12 và giữ nguyên HTML gốc. JavaScript đợi HTML sẵn sàng rồi khởi tạo game.
