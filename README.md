# Mario đơn giản 2

Game Mario chạy trên trình duyệt (canvas, không cần thư viện) + **bảng xếp hạng online**.
Hạ tầng: **GitHub Actions** (CI/CD + test tự động) → **Cloudflare Workers** (host game + API) → **Cloudflare D1** (database).

```
public/            Game tĩnh (HTML/CSS/JS) — Workers Static Assets phục vụ trực tiếp
src/worker.js      Worker: API /api/scores, /api/health (+ phục vụ file tĩnh)
src/validation.js  Kiểm tra dữ liệu điểm
migrations/        Migration D1 (SQL)
test/game/         Unit test logic game (Vitest, Node)
test/worker/       Test Worker + D1 (Vitest trong runtime Workers thật)
e2e/               E2E test (Playwright + wrangler dev + D1 cục bộ)
.github/workflows/ci-cd.yml   Pipeline CI/CD
wrangler.jsonc     Cấu hình Cloudflare
```

## Pipeline CI/CD

| Sự kiện | Việc chạy |
| --- | --- |
| Pull request → `main` | Test (unit, Worker/D1, e2e) + build thử Worker |
| Push → `main` | Như trên, nếu **qua hết** thì: áp dụng migration D1 → deploy Worker → smoke test |

## Thiết lập một lần (làm theo thứ tự)

### 1. Tạo database D1
```bash
npm install
npx wrangler login
npx wrangler d1 create mario-game-db
```
Lệnh trên in ra `database_id`. Mở `wrangler.jsonc` và thay `REPLACE_WITH_YOUR_D1_DATABASE_ID` bằng ID đó
(ID không phải bí mật, có thể commit). Sau đó commit và push thay đổi này.

### 2. Lấy thông tin Cloudflare cho GitHub
- **Account ID**: Cloudflare Dashboard → *Workers & Pages* → cột bên phải (hoặc URL dashboard).
- **API Token**: *My Profile → API Tokens → Create Token* → dùng mẫu **Edit Cloudflare Workers**,
  rồi thêm quyền **Account → D1 → Edit**.

### 3. Thêm secrets vào GitHub
Repo → *Settings → Secrets and variables → Actions → New repository secret*:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### 4. (Khuyên dùng) Bảo vệ nhánh main
- *Settings → Environments → New environment* tên `production` (có thể bật *Required reviewers* để duyệt trước khi deploy).
- *Settings → Branches → Add rule* cho `main`: bật *Require status checks* và chọn job **Test**.

Từ giờ mỗi lần push lên `main`, GitHub Actions sẽ tự test và deploy. Địa chỉ game dạng
`https://mario-game.<tên-tài-khoản>.workers.dev`.

## Chạy ở máy

```bash
npm install
npm run db:migrate:local     # tạo bảng trong D1 cục bộ
npm run dev                  # mở http://localhost:8787
```

```bash
npm test                     # unit + Worker/D1
npx playwright install chromium   # chỉ cần lần đầu
npm run test:e2e             # e2e (tự bật wrangler dev)
```

Mở thẳng `public/index.html` bằng file:// vẫn chơi được, chỉ là không có bảng xếp hạng online.

## API

| Method | Đường dẫn | Mô tả |
| --- | --- | --- |
| GET | `/api/health` | Kiểm tra sống |
| GET | `/api/scores` | Top 10 điểm cao |
| POST | `/api/scores` | Gửi điểm: `{ "name": "Mario", "score": 1234, "levels": 2 }` |

> Điểm do trình duyệt gửi lên nên không thể chống gian lận tuyệt đối. Worker chỉ kiểm tra
> dữ liệu hợp lệ (kiểu số, giới hạn điểm, độ dài tên, chống chèn SQL/HTML).

## Điều khiển game
← → / A D: di chuyển · Space / ↑ / W: nhảy · P: tạm dừng · M: tắt tiếng · R: chơi lại từ đầu.
Trên điện thoại có nút cảm ứng.
