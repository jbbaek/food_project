// server.js
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cors = require("cors");

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  session({
    secret: "secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

const db = mysql.createConnection({
  host: "localhost",
  user: "manager",
  password: "1234",
  database: "foods",
});

db.connect((err) => {
  if (err) console.error("DB 연결 실패:", err);
  else console.log("DB 연결 성공");
});

// ---------------- 회원가입 ----------------
app.post("/api/signup", async (req, res) => {
  const { username, password, name } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.query(
    "INSERT INTO users (username, password, name) VALUES (?, ?, ?)",
    [username, hashed, name],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: "회원가입 성공" });
    }
  );
});

// ---------------- 로그인 ----------------
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.query(
    "SELECT * FROM users WHERE username=?",
    [username],
    async (err, results) => {
      if (err) return res.status(500).json({ message: err.message });
      if (results.length === 0)
        return res.status(400).json({ message: "존재하지 않는 아이디" });

      const match = await bcrypt.compare(password, results[0].password);
      if (!match) return res.status(400).json({ message: "비밀번호 불일치" });

      req.session.user = {
        id: results[0].id,
        username: results[0].username,
        name: results[0].name,
      };
      res.json({ message: "로그인 성공", user: req.session.user });
    }
  );
});

// ---------------- 로그아웃 ----------------
app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "로그아웃 성공" });
});

// ---------------- 로그인 상태 확인 ----------------
app.get("/api/me", (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ message: "로그인 필요" });
  res.json(req.session.user);
});

// ---------------- 음식 조회 ----------------
app.get("/api/foods", (req, res) => {
  const search = req.query.search || "";
  const sql = search
    ? "SELECT id, food_name FROM foods WHERE food_name LIKE ?"
    : "SELECT id, food_name FROM foods LIMIT 100";
  db.query(sql, search ? [`%${search}%`] : [], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
});

app.get("/api/foods/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM foods WHERE id=?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length === 0)
      return res.status(404).json({ message: "음식 없음" });
    res.json(results[0]);
  });
});

// ---------------- 섭취 기록 추가 ----------------
app.post("/api/records/add", (req, res) => {
  const { user_id, food_id, quantity, record_date, meal_type } = req.body;
  if (!user_id || !food_id || !record_date || !meal_type)
    return res.status(400).json({ message: "필수 항목 누락" });

  const mealMap = {
    아침: "breakfast",
    점심: "lunch",
    저녁: "dinner",
    간식: "snack",
  };
  const dbMealType = mealMap[meal_type];
  if (!dbMealType) return res.status(400).json({ message: "잘못된 meal_type" });

  db.query(
    "INSERT INTO records (user_id, food_id, quantity, record_date, meal_type) VALUES (?, ?, ?, ?, ?)",
    [user_id, food_id, quantity || 1, record_date, dbMealType],
    (err, result) => {
      if (err) return res.status(500).json({ message: "DB 입력 오류" });
      res.json({ message: "추가 완료", id: result.insertId });
    }
  );
});

// ---------------- 섭취 기록 조회 ----------------
app.get("/api/records/list", (req, res) => {
  const { user_id, record_date } = req.query;
  if (!user_id || !record_date)
    return res.status(400).json({ message: "user_id와 record_date 필요" });

  db.query(
    `SELECT r.id, f.food_name, f.energy_kcal, r.meal_type 
     FROM records r 
     JOIN foods f ON r.food_id=f.id
     WHERE r.user_id=? AND r.record_date=?`,
    [user_id, record_date],
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });

      const mealMapReverse = {
        breakfast: "아침",
        lunch: "점심",
        dinner: "저녁",
        snack: "간식",
      };
      const mapped = results.map((r) => ({
        ...r,
        meal_type: mealMapReverse[r.meal_type] || r.meal_type,
      }));
      res.json(mapped);
    }
  );
});

// ---------------- 섭취 기록 삭제 ----------------
app.delete("/api/records/delete/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM records WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "삭제 완료" });
  });
});

// ---------------- 일일 합산 ----------------
app.get("/api/records/summary", (req, res) => {
  const { user_id, record_date } = req.query;
  if (!user_id || !record_date)
    return res.status(400).json({ message: "user_id와 record_date 필요" });

  db.query(
    `SELECT 
       COALESCE(SUM(f.energy_kcal * r.quantity),0) AS total_kcal,
       COALESCE(SUM(f.carbohydrate_g * r.quantity),0) AS total_carbs,
       COALESCE(SUM(f.protein_g * r.quantity),0) AS total_protein,
       COALESCE(SUM(f.fat_g * r.quantity),0) AS total_fat
     FROM records r JOIN foods f ON r.food_id=f.id
     WHERE r.user_id=? AND r.record_date=?`,
    [user_id, record_date],
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(results[0]);
    }
  );
});

app.get("/api/weekly-summary", (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ message: "user_id 필요" });

  const sql = `
    SELECT 
      DATE(record_date) AS date,
      ROUND(SUM(f.energy_kcal * r.quantity), 2) AS total_kcal,
      ROUND(SUM(f.carbohydrate_g * r.quantity), 2) AS total_carbohydrate,
      ROUND(SUM(f.protein_g * r.quantity), 2) AS total_protein,
      ROUND(SUM(f.fat_g * r.quantity), 2) AS total_fat,
      ROUND(SUM(f.sugar_g * r.quantity), 2) AS total_sugar,
      ROUND(SUM(f.sodium_mg * r.quantity), 2) AS total_sodium,
      ROUND(SUM(f.calcium_mg * r.quantity), 2) AS total_calcium,
      ROUND(SUM(f.iron_mg * r.quantity), 2) AS total_iron,
      ROUND(SUM(f.potassium_mg * r.quantity), 2) AS total_potassium,
      ROUND(SUM(f.vitamin_a_ug * r.quantity), 2) AS total_vitamin_a,
      ROUND(SUM(f.vitamin_c_mg * r.quantity), 2) AS total_vitamin_c,
      ROUND(SUM(f.vitamin_d_ug * r.quantity), 2) AS total_vitamin_d,
      ROUND(SUM(f.cholesterol_mg * r.quantity), 2) AS total_cholesterol,
      ROUND(SUM(f.saturated_fat_g * r.quantity), 2) AS total_saturated_fat,
      ROUND(SUM(f.trans_fat_g * r.quantity), 2) AS total_trans_fat
    FROM records r
    JOIN foods f ON r.food_id = f.id
    WHERE r.user_id = ?
      AND record_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(record_date)
    ORDER BY date ASC;
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
