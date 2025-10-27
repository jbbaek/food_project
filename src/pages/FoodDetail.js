import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/FoodDetail.css"; // CSS 분리

function FoodDetail() {
  const { id } = useParams();
  const [food, setFood] = useState(null);

  useEffect(() => {
    const fetchFoodDetail = async () => {
      const res = await axios.get(`http://localhost:5000/api/foods/${id}`);
      setFood(res.data);
    };
    fetchFoodDetail();
  }, [id]);

  if (!food) return <p>불러오는 중...</p>;

  return (
    <div className="food-detail">
      <div className="food-header">
        <h2>{food.food_name}</h2>
        <span>{food.energy_kcal} kcal</span>
      </div>

      <div className="nutrient-grid">
        <div className="nutrient-card">탄수화물: {food.carbohydrate_g} g</div>
        <div className="nutrient-card">단백질: {food.protein_g} g</div>
        <div className="nutrient-card">지방: {food.fat_g} g</div>
        <div className="nutrient-card">당류: {food.sugar_g} g</div>
        <div className="nutrient-card">나트륨: {food.sodium_mg} mg</div>
        <div className="nutrient-card">칼슘: {food.calcium_mg} mg</div>
        <div className="nutrient-card">철분: {food.iron_mg} mg</div>
        <div className="nutrient-card">칼륨: {food.potassium_mg} mg</div>
        <div className="nutrient-card">비타민 A: {food.vitamin_a_ug} µg</div>
        <div className="nutrient-card">비타민 C: {food.vitamin_c_mg} mg</div>
        <div className="nutrient-card">비타민 D: {food.vitamin_d_ug} µg</div>
        <div className="nutrient-card">
          콜레스테롤: {food.cholesterol_mg} mg
        </div>
        <div className="nutrient-card">포화지방: {food.saturated_fat_g} g</div>
        <div className="nutrient-card">트랜스지방: {food.trans_fat_g} g</div>
      </div>
    </div>
  );
}

export default FoodDetail;
