import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Auth.css";

function Signup() {
  const [form, setForm] = useState({ username: "", password: "", name: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // 로그인 페이지 이동용

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setMessage(data.message);

      if (res.ok) {
        // 회원가입 성공 시 1~2초 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setMessage("서버 오류 발생");
    }
  };

  return (
    <div className="auth-container">
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="아이디"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="name"
          placeholder="이름"
          value={form.name}
          onChange={handleChange}
          required
        />
        <button type="submit">회원가입</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default Signup;
