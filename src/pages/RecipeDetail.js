// RecipeDetail.js
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

function RecipeDetail() {
  const { seq } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!seq) {
      setLoading(false);
      setError("SEQ가 없습니다. 라우터를 확인하세요.");
      return;
    }

    let alive = true;

    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError("");
        setRecipe(null); // ✅ 이전 레시피 잔상 방지

        const res = await fetch(
          `http://localhost:5000/api/recipes/by-seq/${encodeURIComponent(seq)}`,
          { cache: "no-store" } // ✅ 캐시 방지
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data?.message || "레시피 정보를 불러오지 못했습니다."
          );
        }

        if (alive) setRecipe(data);
      } catch (err) {
        if (alive) setError(err.message || "오류가 발생했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchRecipe();

    return () => {
      alive = false;
    };
  }, [seq]);

  const steps = useMemo(() => {
    if (!recipe) return [];
    const arr = [];
    for (let i = 1; i <= 20; i++) {
      const key = String(i).padStart(2, "0");
      const txt = recipe[`MANUAL${key}`];
      const img = recipe[`MANUAL_IMG${key}`];
      if (txt && String(txt).trim() !== "") arr.push({ txt, img });
    }
    return arr;
  }, [recipe]);

  if (loading) return <div>불러오는 중...</div>;
  if (error) return <div>{error}</div>;
  if (!recipe) return <div>레시피 정보를 불러오지 못했습니다.</div>;

  return (
    <div className="min-h-screen bg-yellow-50 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-3 py-1 text-sm border rounded-md"
        >
          ← 뒤로가기
        </button>

        <h1 className="text-2xl font-bold mb-2">{recipe.RCP_NM}</h1>

        {recipe.ATT_FILE_NO_MAIN && (
          <img
            src={recipe.ATT_FILE_NO_MAIN}
            alt={recipe.RCP_NM}
            className="w-full max-h-80 object-cover rounded-md mb-4"
          />
        )}

        <p className="text-sm text-gray-600 mb-2">
          조리방법: {recipe.RCP_WAY2} / 요리종류: {recipe.RCP_PAT2}
        </p>

        <p className="text-sm text-gray-600 mb-4">
          중량: {recipe.INFO_WGT} / 열량: {recipe.INFO_ENG}kcal / 탄수화물:{" "}
          {recipe.INFO_CAR}g / 단백질: {recipe.INFO_PRO}g / 지방:{" "}
          {recipe.INFO_FAT}g / 나트륨: {recipe.INFO_NA}mg
        </p>

        {recipe.HASH_TAG && (
          <p className="text-xs text-gray-500 mb-4">{recipe.HASH_TAG}</p>
        )}

        <h2 className="text-xl font-semibold mb-2">재료</h2>
        <p className="mb-4 whitespace-pre-wrap">{recipe.RCP_PARTS_DTLS}</p>

        <h2 className="text-xl font-semibold mb-2">만드는 법</h2>
        <ol className="list-decimal pl-5 space-y-3">
          {steps.map((step, idx) => (
            <li key={idx} className="text-sm whitespace-pre-wrap">
              <p>{step.txt}</p>
              {step.img && (
                <img
                  src={step.img}
                  alt={`step-${idx + 1}`}
                  className="mt-1 rounded-md max-h-60"
                />
              )}
            </li>
          ))}
        </ol>

        {recipe.RCP_NA_TIP && (
          <>
            <h2 className="text-xl font-semibold mt-4 mb-2">저감 TIP</h2>
            <p className="text-sm whitespace-pre-wrap">{recipe.RCP_NA_TIP}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default RecipeDetail;
