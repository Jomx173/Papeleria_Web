import { useEffect, useState } from "react";
import { getLowStockProducts } from "../services/api";

function StockAlert() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getLowStockProducts()
      .then((products) => setCount(products.length))
      .catch(() => setCount(0));
  }, []);

  if (count === 0) return null;

  return (
    <div className="stock-alert">
      ⚠️ {count} producto{count !== 1 ? "s" : ""} con stock bajo
    </div>
  );
}

export default StockAlert;