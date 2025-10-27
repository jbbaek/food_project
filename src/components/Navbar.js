import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../css/Navbar.css";

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 페이지 로드 및 경로 변경 시 로그인 상태 확인
  const checkLogin = () => {
    fetch("http://localhost:5000/api/me", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("로그인 필요");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  };

  useEffect(() => {
    checkLogin();
  }, [location.pathname]); // 경로 바뀔 때도 상태 갱신

  const handleLogout = () => {
    fetch("http://localhost:5000/api/logout", {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        setUser(null); // 로그아웃 시 상태 초기화
        navigate("/login");
      })
      .catch((err) => console.error("로그아웃 오류:", err));
  };

  return (
    <nav className="navbar">
      <ul className="navbar-links">
        <li>
          <Link to="/">Food</Link>
        </li>
        <li>
          <Link to="/mypage">마이페이지</Link>
        </li>

        {user ? (
          <li>
            <button className="logout-button" onClick={handleLogout}>
              로그아웃
            </button>
          </li>
        ) : (
          <>
            <li>
              <Link to="/login">로그인</Link>
            </li>
            <li>
              <Link to="/signup">회원가입</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
