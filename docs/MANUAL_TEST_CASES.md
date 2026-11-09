# Test case thủ công – Mario đơn giản 2

- **Địa chỉ test:** https://mario-game.sonhoang696.workers.dev
- **Trình duyệt khuyên dùng:** Chrome (thêm Firefox/Edge nếu có thời gian)
- **Cách ghi kết quả:** điền `Pass` / `Fail` vào cột *KQ*, ghi chú lỗi ở cột *Ghi chú*.
- **Dữ liệu test lên bảng xếp hạng:** đặt tên bắt đầu bằng `TEST_` để dễ xoá sau (xem mục 12).

## Mẹo test nhanh (dùng Console của trình duyệt)

Nhấn **F12 → tab Console**, dán lệnh rồi Enter. Chỉ dùng để **rút ngắn thời gian test**, không dùng khi test điểm số "thật".

| Mục đích | Lệnh |
| --- | --- |
| Sang gần lá cờ (hoàn thành màn) | `player.x = level.flag.x - 40; player.y = 10*TILE` |
| Gần hết giờ (còn 5 giây) | `timeLeft = 5` |
| Chỉ còn 1 mạng | `lives = 1` |
| Chết ngay | `killPlayer()` |
| Nhảy sang màn 2 / 3 | `levelIndex = 1; startLevel()` / `levelIndex = 2; startLevel()` |
| Có sẵn 99 xu (ăn 1 xu nữa = +1 mạng) | `coinCount = 99` |
| Đặt điểm để thử bảng xếp hạng | `score = 4321; lives = 1; killPlayer()` |

---

## 1. Smoke test (làm đầu tiên)

| ID | Mục tiêu | Các bước | Kết quả mong đợi | KQ | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| SM-01 | Trang game tải được | Mở link game | Hiện canvas game, tiêu đề tab "Mario đơn giản 2", màn hình tiêu đề "MARIO ĐƠN GIẢN 2". Không lỗi trắng trang | | |
| SM-02 | API sống | Mở `/api/health` | Hiện `{"ok":true}` | | |
| SM-03 | API bảng xếp hạng | Mở `/api/scores` | Hiện JSON dạng `{"scores":[...]}` | | |
| SM-04 | Không lỗi JS | Mở F12 → Console, tải lại trang | Không có dòng chữ đỏ (lỗi) | | |
| SM-05 | HTTPS | Nhìn thanh địa chỉ | Có ổ khoá, địa chỉ bắt đầu bằng `https://` | | |

## 2. Bắt đầu và điều khiển

| ID | Mục tiêu | Các bước | Kết quả mong đợi | KQ | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| CT-01 | Bắt đầu bằng Enter | Ở màn hình tiêu đề nhấn **Enter** | Vào game, Mario đứng ở đầu màn, HUD hiện `Màn 1/3 - Đồng cỏ`, `Mạng: ♥♥♥`, `Giờ: 200` | | |
| CT-02 | Bắt đầu bằng Space | Tải lại trang, nhấn **Space** | Vào game, Mario **không** nhảy ngay khi vừa bắt đầu | | |
| CT-03 | Bắt đầu bằng click | Tải lại trang, click vào khung game | Vào game | | |
| CT-04 | Chạy phải | Giữ **→** | Mario chạy sang phải, quay mặt phải, màn hình cuộn theo | | |
| CT-05 | Chạy trái | Giữ **←** | Mario chạy sang trái, quay mặt trái | | |
| CT-06 | Phím A / D | Giữ **D**, rồi **A** | Giống → và ← | | |
| CT-07 | Nhảy | Nhấn **Space**, **↑**, **W** (mỗi phím một lần) | Cả 3 phím đều làm Mario nhảy | | |
| CT-08 | Nhảy cao theo thời gian giữ phím | Nhấn nhanh Space rồi nhả; sau đó giữ Space lâu | Giữ lâu nhảy **cao hơn** nhấn nhanh | | |
| CT-09 | Gia tốc mượt | Chạy rồi nhả phím | Mario trượt nhẹ rồi dừng, không đứng khựng | | |
| CT-10 | Tường đầu màn | Chạy sang trái hết cỡ ở đầu màn | Mario bị chặn, không ra ngoài màn hình | | |
| CT-11 | Không kéo trang khi dùng phím | Dùng ↑ ↓ Space khi trang có thanh cuộn | Trang không bị cuộn theo | | |
| CT-12 | Mất focus | Đang giữ → rồi chuyển sang tab/cửa sổ khác, quay lại | Mario không tự chạy mãi, phím được thả | | |

## 3. Hộp `?`, nấm và gạch

(Màn 1: hộp `?` ở gần đầu màn, kế bên là gạch và hộp nấm; thêm một hộp `?` ở gần bậc thang đầu tiên.)

| ID | Mục tiêu | Các bước | Kết quả mong đợi | KQ | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| BL-01 | Hộp `?` ra xu | Nhảy đội đầu vào hộp `?` từ **dưới lên** | Hiện chữ `+10`, `Xu` tăng 1, `Điểm` +10, hộp đổi sang màu nâu (đã dùng) | | |
| BL-02 | Hộp đã dùng | Đội đầu lại hộp nâu | Không ra thêm xu, chỉ nghe tiếng "bump" | | |
| BL-03 | Hộp nấm | Đội đầu vào hộp nấm (hộp `?` thứ hai bên cạnh gạch) | Nấm đỏ chấm trắng hiện ra, chạy sang phải, rơi xuống đất | | |
| BL-04 | Ăn nấm | Chạm vào nấm | Mario lớn hơn (cao hơn), hiện `+1000`, có âm thanh | | |
| BL-05 | Nấm khi đã lớn | Đã lớn, ăn thêm nấm khác | Chỉ cộng 1000 điểm, không thay đổi kích thước | | |
| BL-06 | Mario nhỏ đội gạch | Ở trạng thái nhỏ, đội đầu vào gạch | Gạch hơi nảy lên rồi đứng yên, **không vỡ** | | |
| BL-07 | Mario lớn đập gạch | Ở trạng thái lớn, đội đầu vào gạch | Gạch **vỡ** thành mảnh, `Điểm` +50, ô trống | | |
| BL-08 | Hộp nấm khi trần thấp | Lớn lên ở chỗ có gạch ngay trên đầu | Không bị kẹt hay rớt xuyên sàn; điểm +1000 vẫn được cộng | | |
| BL-09 | Đứng trên hộp | Nhảy lên đứng trên hộp/gạch | Đứng vững, không rơi xuyên | | |

## 4. Xu, điểm, mạng, thời gian

| ID | Mục tiêu | Các bước | Kết quả mong đợi | KQ | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| SC-01 | Ăn xu | Chạm xu vàng bay | Xu biến mất, `Xu` +1, `Điểm` +10 | | |
| SC-02 | Không ăn lại | Quay lại chỗ xu đã ăn | Không có xu nữa | | |
| SC-03 | Giẫm kẻ địch | Nhảy lên đầu quái nâu | Quái bị dẹp, `Điểm` +100, Mario nảy lên | | |
| SC-04 | Mạng thêm khi đủ 100 xu | Console: `coinCount = 99`, rồi ăn 1 xu | `Mạng` +1, hiện `1UP!`, có âm thanh | | |
| SC-05 | Đồng hồ đếm ngược | Quan sát `Giờ` | Giảm mỗi giây (màn 1 bắt đầu 200) | | |
| SC-06 | Cảnh báo sắp hết giờ | Console: `timeLeft = 20` | `Giờ` đổi sang màu đỏ | | |
| SC-07 | Hết giờ | Console: `timeLeft = 3`, đứng chờ | Mario chết khi về 0 | | |
| SC-08 | Điểm thưởng thời gian | Hoàn thành màn khi còn thời gian | Màn "HOÀN THÀNH" ghi `Thưởng thời gian: +N`, N ≈ số giây còn lại × 5 | | |
| SC-09 | Điểm chạm cờ | Chạm cờ | Điểm tăng 500 (cộng thêm thưởng thời gian) | | |
| SC-10 | Kỷ lục | Chơi, kết thúc với điểm cao hơn lần trước | `Kỷ lục` trên HUD cập nhật; tải lại trang vẫn còn | | |

## 5. Kẻ địch

| ID | Mục tiêu | Các bước | Kết quả mong đợi | KQ | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| EN-01 | Quái nâu đi lại | Quan sát | Đi qua lại, quay đầu khi đụng tường | | |
| EN-02 | Chạm hông quái (Mario nhỏ) | Đi thẳng vào quái nâu, không nhảy | Mario chết (bay lên rồi rơi) | | |
| EN-03 | Quái gai (đỏ, có gai trắng) | Nhảy **lên đầu** quái gai | **Không** diệt được, Mario bị thương/chết | | |
| EN-04 | Quái gai tránh được | Nhảy qua đầu quái gai không chạm | Không sao | | |
| EN-05 | Mario lớn bị thương | Lớn lên rồi chạm quái | Nhỏ lại (không chết), nhấp nháy khoảng 2 giây | | |
| EN-06 | Bất tử tạm thời | Ngay sau EN-05 đi xuyên qua quái | Không bị thương trong lúc nhấp nháy | | |
| EN-07 | Quái rơi hố | Quan sát quái đi gần hố | Quái có thể rơi xuống hố và biến mất (không lỗi) | | |
| EN-08 | Giẫm quái khi đang bất tử | Giẫm quái lúc nhấp nháy | Vẫn diệt được, +100 | | |

## 6. Chết, mạng, Game Over

| ID | Mục tiêu | Các bước | Kết quả mong đợi | KQ | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| LF-01 | Rơi xuống hố | Chạy xuống hố đầu tiên (khoảng giữa màn 1) | Mario rơi, mất 1 mạng | | |
| LF-02 | Chơi lại màn sau khi chết | Chờ khoảng 2 giây sau khi chết | Màn bắt đầu lại từ đầu, đồng hồ về 200, **xu/hộp/quái được reset**, điểm về mức lúc bắt đầu màn, `Mạng` giảm 1 | | |
| LF-03 | Trạng thái lớn mất khi chết | Lớn lên → chết → chơi lại | Mario trở lại nhỏ | | |
| LF-04 | Game Over | Console: `lives = 1; killPlayer()` | Hiện "GAME OVER", điểm, kỷ lục, "Nhấn Enter để chơi lại" | | |
| LF-05 | Chơi lại sau Game Over | Nhấn Enter sau khi hiện Game Over (đợi khoảng 1 giây) | Game mới: màn 1, 3 mạng, điểm 0 | | |
| LF-06 | Phím R | Đang chơi nhấn **R** | Game bắt đầu lại từ đầu (màn 1, 3 mạng, điểm 0) | | |
| LF-07 | R ở màn hình tiêu đề | Ở màn tiêu đề nhấn R | Không có gì xảy ra | | |

## 7. Màn chơi và chiến thắng

| ID | Mục tiêu | Các bước | Kết quả mong đợi | KQ | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| LV-01 | Chạm cờ màn 1 | Console: `player.x = level.flag.x - 40; player.y = 10*TILE` | Hiện "HOÀN THÀNH MÀN 1!", điểm, thưởng thời gian, âm thanh thắng | | |
| LV-02 | Qua màn 2 | Nhấn Enter ở màn hoàn thành | Sang màn 2, `Màn 2/3 - Hoàng hôn`, nền **cam hoàng hôn**, đồng hồ 220 | | |
| LV-03 | Điểm giữ nguyên giữa màn | So sánh điểm cuối màn 1 và đầu màn 2 | Điểm/xu/mạng được giữ | | |
| LV-04 | Màn 3 | Hoàn thành màn 2 rồi Enter | `Màn 3/3 - Đêm trăng`, nền **tối có sao và trăng**, đồng hồ 240, nhiều quái gai hơn | | |
| LV-05 | Vực dài ở màn 3 | Qua vực rộng giữa màn 3 | Có 2 bậc đá nhỏ làm điểm đặt chân; có thể nhảy qua | | |
| LV-06 | Chiến thắng | Hoàn thành màn 3, nhấn Enter | Hiện "BẠN ĐÃ THẮNG CẢ 3 MÀN!" | | |
| LV-07 | Đợi trước khi bấm tiếp | Vừa chạm cờ đã nhấn Enter ngay | Chưa chuyển màn ngay (phải chờ khoảng 1 giây) | | |
| LV-08 | Chơi được hết cả 3 màn bằng tay | Chơi thật từ đầu đến cuối không dùng lệnh | Có thể hoàn thành mỗi màn; không có chỗ nào bị kẹt hoặc không thể vượt qua | | |

## 8. Tạm dừng và âm thanh

| ID | Mục tiêu | Các bước | Kết quả mong đợi | KQ | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| PA-01 | Tạm dừng | Đang chơi nhấn **P** | Hiện "TẠM DỪNG", game đứng yên, đồng hồ không chạy | | |
| PA-02 | Tiếp tục | Nhấn P (hoặc Enter) | Chơi tiếp, đồng hồ chạy lại | | |
| PA-03 | Esc để tạm dừng | Nhấn Esc | Tạm dừng như P | | |
| PA-04 | Âm thanh | Nhảy, ăn xu, giẫm quái, ăn nấm, chết | Mỗi hành động có tiếng khác nhau | | |
| PA-05 | Tắt tiếng | Nhấn **M** | Hiện "🔇 tắt tiếng (M)", không còn âm thanh; nhấn M lần nữa bật lại | | |
| PA-06 | Âm thanh chỉ bật sau thao tác | Tải trang, chưa bấm gì | Không có tiếng tự phát, không lỗi console | | |

## 9. Bảng xếp hạng và tên người chơi

| ID | Mục tiêu | Các bước | Kết quả mong đợi | KQ | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| LB-01 | Nhập tên | Gõ `TEST_An` vào ô "Tên trên bảng xếp hạng" (phía dưới game) | Gõ được, kể cả dấu cách; Mario **không** di chuyển khi gõ chữ A/D/Space | | |
| LB-02 | Giới hạn tên | Gõ tên dài hơn 16 ký tự | Chỉ nhập được tối đa 16 ký tự | | |
| LB-03 | Tên được nhớ | Nhập tên, tải lại trang | Tên còn trong ô nhập | | |
| LB-04 | Gửi điểm khi Game Over | Nhập tên `TEST_An`, Console: `score = 4321; lives = 1; killPlayer()` | Sau khoảng 2 giây hiện Game Over; mở `/api/scores` thấy `TEST_An` điểm 4321 | | |
| LB-05 | Hiển thị bảng xếp hạng | Sau LB-04 xem màn Game Over | Có mục "BẢNG XẾP HẠNG" với tối đa 5 dòng, điểm cao xếp trên | | |
| LB-06 | Bảng hiện ở màn tiêu đề | Tải lại trang | Màn tiêu đề cũng hiện bảng xếp hạng | | |
| LB-07 | Gửi điểm khi chiến thắng | Hoàn thành màn 3 (dùng lệnh nhảy màn) với tên `TEST_Thang` | Điểm được lưu với số màn = 3 | | |
| LB-08 | Tên trống | Xoá hết tên, kết thúc 1 ván có điểm > 0 | Lưu với tên **"Ẩn danh"** | | |
| LB-09 | Điểm 0 không gửi | Chết ngay lúc điểm = 0, hết mạng | Không có dòng mới trong `/api/scores` | | |
| LB-10 | Thứ tự | Gửi nhiều điểm khác nhau | `/api/scores` luôn sắp xếp **điểm cao → thấp**, tối đa 10 dòng | | |
| LB-11 | Không gửi trùng | Chơi một ván | Mỗi ván chỉ thêm **một** dòng điểm | | |
| LB-12 | Tên có ký tự đặc biệt | Tên `<b>x</b>` | Bảng hiển thị chữ thường, không in đậm/không chạy HTML (ký tự `<` `>` bị bỏ) | | |

## 10. API (kiểm tra bằng Console trên trang game)

Mỗi lệnh dán vào Console, kết quả in ra là mã trạng thái.

| ID | Mục tiêu | Lệnh | Kết quả mong đợi | KQ | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| API-01 | Gửi hợp lệ | `fetch('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'TEST_API',score:100,levels:1})}).then(r=>r.status)` | `201` | | |
| API-02 | Điểm âm | Như trên, đổi `score:-5` | `400` | | |
| API-03 | Điểm quá lớn | Đổi `score:99999999` | `400` | | |
| API-04 | Điểm thập phân | Đổi `score:1.5` | `400` | | |
| API-05 | Điểm là chữ | Đổi `score:"100"` | `400` | | |
| API-06 | Số màn sai | Đổi `levels:9` | `400` | | |
| API-07 | Thiếu tên | Bỏ `name` | `400` | | |
| API-08 | JSON hỏng | `fetch('/api/scores',{method:'POST',body:'{abc'}).then(r=>r.status)` | `400` | | |
| API-09 | Body quá lớn | `fetch('/api/scores',{method:'POST',body:JSON.stringify({name:'x',score:1,levels:0,j:'x'.repeat(3000)})}).then(r=>r.status)` | `413` | | |
| API-10 | Sai method | `fetch('/api/scores',{method:'DELETE'}).then(r=>r.status)` | `405` | | |
| API-11 | Đường dẫn lạ | `fetch('/api/abc').then(r=>r.status)` | `404` | | |
| API-12 | Chống SQL injection | Tên: `x'); DROP TABLE scores;--` | `201`, bảng xếp hạng vẫn hoạt động bình thường sau đó | | |

## 11. Giao diện, trình duyệt, điện thoại

| ID | Mục tiêu | Các bước | Kết quả mong đợi | KQ | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| UI-01 | Co giãn màn hình | Thu nhỏ cửa sổ trình duyệt | Khung game thu nhỏ theo, không bị tràn | | |
| UI-02 | Giao diện tiếng Việt | Đọc HUD, các màn hình | Chữ tiếng Việt có dấu hiển thị đúng, không lỗi font | | |
| UI-03 | Hướng dẫn phím | Xem dòng chữ dưới game | Có đủ: di chuyển, nhảy, tạm dừng (P), tắt tiếng (M), chơi lại (R) | | |
| UI-04 | Firefox | Mở game bằng Firefox, chạy CT-01, CT-07, BL-01 | Hoạt động giống Chrome | | |
| UI-05 | Edge | Như trên bằng Edge | Hoạt động giống Chrome | | |
| UI-06 | Điện thoại: nút cảm ứng | Mở trên điện thoại | Có 3 nút ◀ ▶ NHẢY dưới game (máy tính không hiện) | | |
| UI-07 | Điện thoại: bắt đầu | Chạm vào khung game | Vào game | | |
| UI-08 | Điện thoại: điều khiển | Giữ ◀ ▶, bấm NHẢY | Mario chạy, nhảy; giữ nhiều nút cùng lúc được | | |
| UI-09 | Điện thoại: không phóng to khi bấm | Bấm nút liên tục | Trang không bị phóng to hoặc cuộn | | |
| UI-10 | Xoay màn hình | Xoay ngang điện thoại | Bố cục vẫn dùng được | | |
| UI-11 | Hiệu năng | Chơi 3 phút | Hình mượt, không giật, không tốn pin/nóng bất thường | | |
| UI-12 | Chạy offline | Tải trang, tắt mạng, chơi tiếp rồi Game Over | Game vẫn chạy bình thường, không báo lỗi; điểm không lên bảng xếp hạng | | |

## 12. Dọn dữ liệu sau khi test

Bảng xếp hạng là dữ liệu **thật** trên Cloudflare D1, nên cần xoá các dòng `TEST_...` sau khi test:

1. Vào https://dash.cloudflare.com → *Storage & databases* → *D1* → `mario-game-db` → tab **Console**.
2. Chạy:
   ```sql
   DELETE FROM scores WHERE name LIKE 'TEST%';
   ```
3. Mở `/api/scores` để kiểm tra lại.

## Tổng kết

| Nhóm | Tổng | Pass | Fail |
| --- | --- | --- | --- |
| 1. Smoke | 5 | | |
| 2. Điều khiển | 12 | | |
| 3. Hộp / nấm / gạch | 9 | | |
| 4. Xu, điểm, thời gian | 10 | | |
| 5. Kẻ địch | 8 | | |
| 6. Chết, Game Over | 7 | | |
| 7. Màn chơi | 8 | | |
| 8. Tạm dừng, âm thanh | 6 | | |
| 9. Bảng xếp hạng | 12 | | |
| 10. API | 12 | | |
| 11. Giao diện, trình duyệt | 12 | | |
| **Tổng** | **101** | | |
