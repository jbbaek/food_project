import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen bg-white">
      <div className="max-w-[1500px] mx-auto p-6 bg-yellow-50 shadow-sm">
        <h2 className="text-center text-orange-500 text-2xl font-bold mb-6">
          음식 검색
        </h2>

        <form
          onSubmit={handleSearch}
          className="flex gap-2 mb-6 justify-center"
        >
          <input
            type="text"
            value={query}
            placeholder="음식 이름 입력"
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 max-w-md p-2 border border-yellow-400 rounded-md text-sm focus:outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-orange-500 text-white font-bold rounded-md hover:bg-orange-400 transition duration-300"
          >
            검색
          </button>
        </form>

        {/* 리스트 출력 */}
        <ul className="list-none p-0 m-0 bg-white border border-gray-300 rounded-md">
          {foods.map((food) => (
            <li
              key={food.id}
              onClick={() => handleFoodClick(food.id)}
              className="px-4 py-3 border-b border-gray-200 text-gray-800 text-[15px] cursor-pointer hover:bg-yellow-100 transition duration-200 last:border-b-0"
            >
              {food.food_name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Mainpage;
