import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/Mypage.css";

function MyPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [newRecord, setNewRecord] = useState({
    meal_type: "아침",
    food_id: "",
    food_name: "",
    calories: "",
  });

  // 로그인 상태 확인
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/me", { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => {
        alert("로그인이 필요합니다.");
        navigate("/login");
      });
  }, [navigate]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, selectedDate]);

  const loadFoods = async (query = "") => {
    try {
      const res = await axios.get("http://localhost:5000/api/foods", {
        params: { search: query },
      });
      setFoods(res.data || []);
    } catch (err) {
      console.error("음식 불러오기 오류:", err);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    loadFoods(value);
  };

  const handleFoodChange = async (e) => {
    const foodId = e.target.value;
    if (!foodId) {
      setNewRecord({ ...newRecord, food_id: "", food_name: "", calories: "" });
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/foods/${foodId}`);
      const { food_name, energy_kcal } = res.data;
      setNewRecord({
        ...newRecord,
        food_id: foodId,
        food_name,
        calories: energy_kcal,
      });
    } catch (err) {
      console.error("음식 상세 조회 오류:", err);
    }
  };

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [recRes, sumRes] = await Promise.all([
        axios.get("http://localhost:5000/api/records", {
          params: { user_id: user.id, record_date: selectedDate },
        }),
        axios.get("http://localhost:5000/api/daily-summary", {
          params: { user_id: user.id, record_date: selectedDate },
        }),
      ]);

      // 안전하게 기본값 설정
      setRecords(Array.isArray(recRes.data) ? recRes.data : []);
      setSummary(
        typeof sumRes.data === "object" && sumRes.data !== null
          ? sumRes.data
          : {}
      );
    } catch (err) {
      console.error("데이터 불러오기 오류:", err);
      setRecords([]);
      setSummary({});
    }
  }, [user?.id, selectedDate]);

  const addRecord = async () => {
    if (!user?.id) return alert("로그인이 필요합니다.");
    if (!newRecord.food_id) return alert("음식을 선택하세요.");

    try {
      await axios.post(
        "http://localhost:5000/api/records",
        {
          user_id: user.id,
          food_id: newRecord.food_id,
          record_date: selectedDate,
          meal_type: newRecord.meal_type,
          quantity: 1,
        },
        { withCredentials: true }
      );

      setNewRecord({
        meal_type: "아침",
        food_id: "",
        food_name: "",
        calories: "",
      });
      loadData();
    } catch (err) {
      console.error("추가 오류:", err);
    }
  };

  const deleteRecord = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/records/${id}`, {
        withCredentials: true,
      });
      loadData();
    } catch (err) {
      console.error("삭제 오류:", err);
    }
  };

  const groupedMeals = {
    아침: records.filter((r) => r.meal_type === "아침"),
    점심: records.filter((r) => r.meal_type === "점심"),
    저녁: records.filter((r) => r.meal_type === "저녁"),
    간식: records.filter((r) => r.meal_type === "간식"),
  };

  if (!user) return <div>로그인 정보를 확인 중입니다...</div>;

  return (
    <div className="mypage-root">
      <div className="mypage-header">
        <h1>{user.name || "사용자"}의 식단 기록</h1>
        <div className="date-picker">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="summary-card">
        <h2>오늘의 요약</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <p>{summary.total_kcal || 0} kcal</p>
            <small>총 섭취 칼로리</small>
          </div>
          <div className="summary-item">
            <p>{summary.total_carbs || 0} g</p>
            <small>탄수화물</small>
          </div>
          <div className="summary-item">
            <p>{summary.total_protein || 0} g</p>
            <small>단백질</small>
          </div>
          <div className="summary-item">
            <p>{summary.total_fat || 0} g</p>
            <small>지방</small>
          </div>
        </div>
      </div>

      <div className="add-food">
        <select
          value={newRecord.meal_type}
          onChange={(e) =>
            setNewRecord({ ...newRecord, meal_type: e.target.value })
          }
        >
          <option>아침</option>
          <option>점심</option>
          <option>저녁</option>
          <option>간식</option>
        </select>

        <input
          type="text"
          placeholder="음식 검색..."
          value={search}
          onChange={handleSearchChange}
        />

        <select value={newRecord.food_id} onChange={handleFoodChange}>
          <option value="">음식을 선택</option>
          {foods.map((f) => (
            <option key={f.id} value={f.id}>
              {f.food_name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="칼로리"
          value={newRecord.calories}
          readOnly
        />
        <button onClick={addRecord}>추가</button>
      </div>

      <div className="meals-wrap">
        {Object.entries(groupedMeals).map(([meal, items]) => (
          <div
            key={meal}
            className={`meal-card meal-${
              meal === "아침"
                ? "breakfast"
                : meal === "점심"
                ? "lunch"
                : meal === "저녁"
                ? "dinner"
                : "snack"
            }`}
          >
            <h4>{meal}</h4>
            <div className="meal-body">
              {items.length > 0 ? (
                <ul className="meal-list">
                  {items.map((r) => (
                    <li key={r.id}>
                      <span>
                        {r.food_name}{" "}
                        <span className="meta">({r.energy_kcal} kcal)</span>
                      </span>
                      <button
                        className="small-btn"
                        onClick={() => deleteRecord(r.id)}
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">등록된 식단이 없습니다.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyPage;
