import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function Mainpage() {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState([]); // 항상 배열 보장
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingAuto, setLoadingAuto] = useState(false);

  const navigate = useNavigate();
  const suggestionRef = useRef(null);
  const inputRef = useRef(null);

  // 초성 목록
  const initials = [
    "ㄱ",
    "ㄴ",
    "ㄷ",
    "ㄹ",
    "ㅁ",
    "ㅂ",
    "ㅅ",
    "ㅇ",
    "ㅈ",
    "ㅊ",
    "ㅋ",
    "ㅌ",
    "ㅍ",
    "ㅎ",
  ];

  // ✅ 초기 음식 리스트 로드 (API 구조 대응)
  useEffect(() => {
    fetchList();
    const handleDocClick = (e) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  const safeSetFoods = (data) => {
    // 응답 구조가 배열인지 확인
    if (Array.isArray(data)) setFoods(data);
    else if (data && Array.isArray(data.foods)) setFoods(data.foods);
    else if (data && Array.isArray(data.items)) setFoods(data.items);
    else setFoods([]); // 예외 시 빈 배열
  };

  const fetchList = async () => {
    setLoadingList(true);
    try {
      const res = await fetch("http://localhost:5000/api/foods");
      const data = await res.json();
      safeSetFoods(data);
    } catch (err) {
      console.error("리스트 불러오기 실패:", err);
      setFoods([]);
    } finally {
      setLoadingList(false);
    }
  };

  // 검색
  const handleSearch = async (e, q) => {
    if (e && e.preventDefault) e.preventDefault();
    const searchTerm = typeof q === "string" ? q : query;
    try {
      setLoadingList(true);
      const res = await fetch(
        `http://localhost:5000/api/foods?search=${encodeURIComponent(
          searchTerm || ""
        )}`
      );
      const data = await res.json();
      safeSetFoods(data);
      setSuggestions([]);
      if (typeof q === "string") setQuery(q);
    } catch (err) {
      console.error("검색 실패:", err);
      setFoods([]);
    } finally {
      setLoadingList(false);
    }
  };

  // 자동완성
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoadingAuto(true);
    const tid = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/foods/autocomplete?q=${encodeURIComponent(
            query
          )}`
        );
        const data = await res.json();
        if (Array.isArray(data)) setSuggestions(data);
        else if (data && Array.isArray(data.suggestions))
          setSuggestions(data.suggestions);
        else setSuggestions([]);
      } catch (err) {
        console.error("자동완성 실패:", err);
        setSuggestions([]);
      } finally {
        setLoadingAuto(false);
      }
    }, 200);

    return () => clearTimeout(tid);
  }, [query]);

  // 초성별 검색
  const handleInitialSearch = async (ch) => {
    try {
      setLoadingList(true);
      const res = await fetch(
        `http://localhost:5000/api/foods/by-initial?initial=${encodeURIComponent(
          ch
        )}`
      );
      const data = await res.json();
      safeSetFoods(data);
      setSuggestions([]);
      setQuery("");
    } catch (err) {
      console.error("초성 검색 실패:", err);
      setFoods([]);
    } finally {
      setLoadingList(false);
    }
  };

  const handleFoodClick = (id) => {
    navigate(`/foods/${id}`);
  };

  // AI 메뉴 추천
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const userMsg = { sender: "user", text: message };
    setChatLog((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("http://localhost:5000/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();

      const aiText =
        data.reply ||
        data.menu ||
        (data.foods && Array.isArray(data.foods)
          ? data.foods.map((f) => f.name || f.food_name).join(", ")
          : "추천을 불러올 수 없습니다.");

      const aiMsg = { sender: "ai", text: aiText };
      setChatLog((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("추천 요청 실패:", err);
      setChatLog((prev) => [
        ...prev,
        { sender: "ai", text: "서버 오류가 발생했습니다." },
      ]);
    }

    setMessage("");
  };

  const handleKeyDownChat = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 relative p-4">
      <div className="max-w-[1500px] mx-auto p-6 bg-yellow-50 shadow-sm rounded-lg">
        <h2 className="text-center text-orange-500 text-2xl font-bold mb-4">
          음식 검색
        </h2>

        {/* 초성 버튼 */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {initials.map((ch) => (
            <button
              key={ch}
              onClick={() => handleInitialSearch(ch)}
              className="px-2 py-1 border border-yellow-400 rounded-md text-sm hover:bg-yellow-100 transition"
            >
              {ch}
            </button>
          ))}
          <button
            onClick={fetchList}
            className="px-2 py-1 border border-yellow-400 rounded-md text-sm hover:bg-yellow-100 transition"
          >
            전체
          </button>
        </div>

        {/* 검색폼 */}
        <form
          onSubmit={(e) => handleSearch(e)}
          className="flex gap-2 mb-6 justify-center relative max-w-md mx-auto"
        >
          <div className="w-full relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              placeholder="음식 이름 입력"
              onChange={(e) => setQuery(e.target.value)}
              className="w-[100%] p-2 border border-yellow-400 rounded-md text-sm focus:outline-none focus:border-orange-500"
            />
            {/* 자동완성 박스 */}
            <div ref={suggestionRef} className="absolute left-0 right-0 z-20">
              {suggestions.length > 0 && (
                <ul className="bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-auto">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="px-3 py-2 hover:bg-yellow-100 cursor-pointer text-sm"
                      onClick={() => {
                        setQuery(s);
                        setSuggestions([]);
                        handleSearch(null, s);
                      }}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {loadingAuto && (
              <div className="absolute right-2 top-2 text-xs text-gray-500">
                검색 중...
              </div>
            )}
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-orange-500 text-white font-bold rounded-md hover:bg-orange-400 transition duration-300 whitespace-nowrap"
          >
            검색
          </button>
        </form>

        {/* 음식 리스트 */}
        <div className="max-w-3xl mx-auto">
          <ul className="list-none p-0 m-0 bg-white border border-gray-300 rounded-md">
            {loadingList ? (
              <li className="px-4 py-6 text-center text-gray-500">
                불러오는 중...
              </li>
            ) : foods.length === 0 ? (
              <li className="px-4 py-6 text-center text-gray-500">
                결과가 없습니다.
              </li>
            ) : (
              foods.map((food) => (
                <li
                  key={food.id ?? food.ID ?? food.RCP_SEQ ?? food.food_name}
                  onClick={() =>
                    handleFoodClick(food.id ?? food.ID ?? food.RCP_SEQ)
                  }
                  className="px-4 py-3 border-b border-gray-200 text-gray-800 text-[15px] cursor-pointer hover:bg-yellow-100 transition duration-200 last:border-b-0"
                >
                  {food.food_name ?? food.RCP_NM ?? food.name}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* AI 추천 버튼 */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 bg-orange-500 text-white p-4 rounded-full text-2xl shadow-lg hover:bg-orange-400 transition"
        title="메뉴 추천"
      >
        📃
      </button>

      {/* 채팅창 */}
      {showChat && (
        <div className="fixed bottom-20 right-6 w-80 bg-white border border-gray-300 rounded-2xl shadow-lg p-4 z-50">
          <h3 className="text-lg font-semibold text-orange-500 mb-2">
            메뉴 추천 AI
          </h3>
          <div className="h-64 overflow-y-auto mb-3 border border-gray-200 rounded-lg p-2 bg-yellow-50 text-sm">
            {chatLog.length === 0 && (
              <div className="text-gray-500 text-sm">
                원하는 말을 입력해보세요.
              </div>
            )}
            {chatLog.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-2 ${
                  msg.sender === "user"
                    ? "text-right"
                    : "text-left text-orange-700"
                }`}
              >
                <span
                  className={`inline-block px-3 py-1 rounded-lg ${
                    msg.sender === "user"
                      ? "bg-orange-500 text-white"
                      : "bg-white border border-orange-300"
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDownChat}
              placeholder="먹고 싶은 음식을 입력하세요"
              className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              className="bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-400 text-sm"
            >
              전송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Mainpage;
