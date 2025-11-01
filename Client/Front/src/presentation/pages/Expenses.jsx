import { useState, useEffect, useMemo } from "react";
import "../styles/pages/Expenses.css";
import { Sidebar } from "../components/system";
import { useTheme } from "../hooks/useTheme";
import { useTransactionData } from "../hooks/useTransactionData";

export default function Expenses() {
  useTheme();
  const [activeTab, setActiveTab] = useState("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.uid || "default-user";
  const { transactions, fetchTransactions } = useTransactionData(userId);

  const expenses = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          transaction.tipo && transaction.tipo.toLowerCase() === "despesa"
      )
      .map((transaction) => {
        const dateField =
          transaction.dataHora || transaction.data || transaction.criadoEm;
        let processedDate = dateField;

        if (
          dateField &&
          typeof dateField === "string" &&
          dateField.includes("/")
        ) {
          const [datePart] = dateField.split(", ");
          const [day, month, year] = datePart.split("/");
          processedDate = new Date(year, month - 1, day);
        }

        return {
          id: transaction.id || Math.random(),
          date: processedDate,
          description: transaction.descricao || "Sem descrição",
          category: transaction.categoria || "Outros",
          value: Math.abs(transaction.valor || 0),
        };
      });
  }, [transactions]);

  //Atualização do Gleison
  const filterByCurrentMonth = (expenses) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return expenses.filter((expense) => {
      if (!expense.date) return false;
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });
  };

  const filterByLastMonth = (expenses) => {
    const lastMonth = new Date().getMonth() - 1;
    const year =
      lastMonth < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
    const month = lastMonth < 0 ? 11 : lastMonth;
    return expenses.filter((expense) => {
      if (!expense.date) return false;
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === month && expenseDate.getFullYear() === year
      );
    });
  };

  const filterBySearch = (expenses, term) => {
    return expenses.filter((expense) =>
      expense.description.toLowerCase().includes(term.toLowerCase())
    );
  };

  const filterByCategory = (expenses, category) => {
    return expenses.filter((expense) => expense.category === category);
  };

  const filteredExpenses = expenses;

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    const filters = { type: 'despesa' };
    
    if (tab === 'este-mes') {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      filters.startDate = startDate;
      filters.endDate = endDate;
    } else if (tab === 'mes-passado') {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    
    if (categoryFilter) filters.category = categoryFilter;
    await fetchTransactions(filters);
  };

  const handleCategoryChange = async (category) => {
    setCategoryFilter(category);
    const filters = { type: 'despesa' };
    if (category) filters.category = category;
    await fetchTransactions(filters);
  };

  const categories = useMemo(
    () => [...new Set(expenses.map((expense) => expense.category))],
    [expenses]
  );

  return (
    <div className="sys-layout">
      <Sidebar />

      <main className="sys-main">
        <div className="expenses-container">
          <div className="expenses-header">
            <h1>Gerenciar Despesas</h1>
          </div>

          <div className="expenses-filters">
            <div className="tabs">
              <button
                className={activeTab === "todas" ? "active" : ""}
                onClick={() => handleTabChange("todas")}
              >
                Todas
              </button>
              <button
                className={activeTab === "este-mes" ? "active" : ""}
                onClick={() => handleTabChange("este-mes")}
              >
                Este Mês
              </button>
              <button
                className={activeTab === "mes-passado" ? "active" : ""}
                onClick={() => handleTabChange("mes-passado")}
              >
                Mês Passado
              </button>
            </div>

            <div className="filters-row">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Buscar despesas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="category-filter"
              >
                <option value="">Filtrar por categoria</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="expenses-content">
            <div className="expenses-summary">
              <h2>Todas as Despesas</h2>
              <p>Lista de todas as suas despesas registradas.</p>
            </div>

            <div className="expenses-table">
              <div className="table-header">
                <span>Data ↕</span>
                <span>Descrição ↕</span>
                <span>Categoria</span>
                <span>Valor ↕</span>
              </div>

              <div className="table-body">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => (
                    <div key={expense.id} className="table-row">
                      <span>
                        {(() => {
                          if (!expense.date)
                            return new Date().toLocaleDateString("pt-BR");

                          try {
                            const date = new Date(expense.date);
                            return isNaN(date.getTime())
                              ? "Data inválida"
                              : date.toLocaleDateString("pt-BR");
                          } catch {
                            return "Data inválida";
                          }
                        })()}
                      </span>
                      <span>{expense.description}</span>
                      <span className="category-tag">{expense.category}</span>
                      <span className="value">
                        R$ {Number(expense.value).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="no-expenses">Nenhuma despesa encontrada.</div>
                )}
              </div>
            </div>

            <div className="expenses-footer">
              Mostrando {filteredExpenses.length} de {expenses.length} despesas
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
