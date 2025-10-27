import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Mainpage.css";

function Mainpage() {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState([]);
  const navigate = useNavigate();

  // 처음엔 전체 리스트 가져오기
  useEffect(() => {
    fetch("http://localhost:5000/api/foods")
      .then((res) => res.json())
      .then((data) => setFoods(data))
      .catch((err) => console.error("리스트 불러오기 실패:", err));
  }, []);

  // 검색하기
  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `http://localhost:5000/api/foods?search=${query}`
      );
      const data = await res.json();
      setFoods(data);
    } catch (err) {
      console.error("검색 실패:", err);
    }
  };

  // 음식 클릭 시 → 상세 페이지로 이동
  const handleFoodClick = (id) => {
    navigate(`/foods/${id}`);
  };

  return (
    <div>
      <div className="search-container">
        <h2>음식 검색</h2>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            placeholder="음식 이름 입력"
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">검색</button>
        </form>
      </div>
      {/* 리스트 출력 */}
      <ul className="food-list">
        {foods.map((food) => (
          <li
            key={food.id}
            onClick={() => handleFoodClick(food.id)}
            className="food-item"
          >
            {food.food_name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Mainpage;
